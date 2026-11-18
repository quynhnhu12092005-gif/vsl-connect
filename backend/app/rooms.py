"""Authenticated, database-backed WebRTC signaling and expiring room presence.

Short HTTP sync requests work across separate Vercel instances. Audio and video
travel via WebRTC, never through this API or the database.
"""
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import time
import requests
from datetime import datetime, timedelta, timezone
from typing import Annotated, Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError

from app.auth import CurrentUser
from app.dependencies import Db
from app.models import User
from app.room_models import CallRoom, RoomEntryLimit, RoomParticipant, RoomSignal

router = APIRouter(prefix='/api/v1/rooms', tags=['call rooms'])
MAX_MEMBERS = 6
LEASE_SECONDS = 90
SIGNAL_SECONDS = 120
CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def normalize_code(value: str) -> str:
    code = re.sub(r'[\s-]', '', value).upper()
    if len(code) != 10 or any(char not in CODE_ALPHABET for char in code):
        raise ValueError('Mã phòng gồm 10 chữ cái hoặc chữ số, không gồm I, O, 0, 1.')
    return code


def require_write(request: Request, user: CurrentUser) -> User:
    token = request.headers.get('X-CSRF-Token', '')
    if not token or not hmac.compare_digest(token, request.state.session_claims['csrf']):
        raise HTTPException(403, 'Yêu cầu xác thực CSRF không hợp lệ.')
    return user


RoomWriter = Annotated[User, Depends(require_write)]


class ParticipantInput(BaseModel):
    client_id: UUID


class CreateInput(ParticipantInput):
    title: str = Field(min_length=1, max_length=80)
    visibility: Literal['public', 'private'] = 'public'

    @field_validator('title')
    @classmethod
    def clean_title(cls, value):
        value = value.strip()
        if not value or any(ord(char) < 32 for char in value):
            raise ValueError('Nhập tên phòng hợp lệ.')
        return value


class JoinInput(ParticipantInput):
    code: str = Field(min_length=1, max_length=40)

    @field_validator('code')
    @classmethod
    def clean_code(cls, value):
        return normalize_code(value)


class SyncInput(ParticipantInput):
    after: int = Field(default=0, ge=0, le=9_223_372_036_854_775_807)
    camera_on: bool = False
    microphone_on: bool = False
    hand_raised: bool = False


class SignalInput(ParticipantInput):
    recipient_id: UUID
    kind: Literal['offer', 'answer', 'ice', 'restart']
    data: dict

    @model_validator(mode='after')
    def validate_signal(self):
        encoded = json.dumps(self.data, ensure_ascii=True, allow_nan=False)
        if len(encoded) > 65_536:
            raise ValueError('Tín hiệu kết nối quá lớn.')
        if self.kind in ('offer', 'answer'):
            if self.data.get('type') != self.kind or not isinstance(self.data.get('sdp'), str):
                raise ValueError('Mô tả kết nối không hợp lệ.')
        elif self.kind == 'ice':
            if not isinstance(self.data.get('candidate'), str) or len(self.data['candidate']) > 4096:
                raise ValueError('ICE candidate không hợp lệ.')
            if self.data.get('sdpMid') is not None and not isinstance(self.data['sdpMid'], str):
                raise ValueError('ICE media không hợp lệ.')
            index = self.data.get('sdpMLineIndex')
            if index is not None and (type(index) is not int or not 0 <= index <= 100):
                raise ValueError('ICE media index không hợp lệ.')
        elif self.data:
            raise ValueError('Tín hiệu kết nối lại không hợp lệ.')
        return self


class LeaveInput(ParticipantInput):
    # sendBeacon cannot attach a CSRF header. The token stays in the POST body.
    csrf_token: str = Field(default='', max_length=200)


def expire_rooms(db, now):
    db.execute(delete(CallRoom).where(CallRoom.expires_at <= now))


def limit_entry(db, user_id, now):
    # The existing user row serializes first-time counter creation too.
    db.scalar(select(User.id).where(User.id == user_id).with_for_update())
    counter = db.get(RoomEntryLimit, user_id)
    if not counter:
        counter = RoomEntryLimit(user_id=user_id, window_start=now, attempts=0)
        db.add(counter)
    if counter.window_start <= now - timedelta(minutes=1):
        counter.window_start, counter.attempts = now, 0
    if counter.attempts >= 20:
        db.commit()
        raise HTTPException(429, 'Bạn thao tác quá nhanh. Hãy thử lại sau một phút.', headers={'Retry-After': '60'})
    counter.attempts += 1
    # Persist failed guesses, not just successful joins.
    db.commit()


def lock_room(db, code, now):
    try:
        code = normalize_code(code)
    except ValueError:
        raise HTTPException(404, 'Phòng không tồn tại hoặc đã kết thúc.') from None
    room = db.scalar(select(CallRoom).where(CallRoom.code == code).with_for_update())
    if not room:
        raise HTTPException(404, 'Phòng không tồn tại hoặc đã kết thúc.')
    db.execute(delete(RoomParticipant).where(
        RoomParticipant.room_id == room.id, RoomParticipant.expires_at <= now,
    ))
    members = db.scalar(select(func.count()).select_from(RoomParticipant).where(RoomParticipant.room_id == room.id))
    if room.expires_at <= now or not members:
        db.delete(room)
        db.commit()
        raise HTTPException(410, 'Phòng đã kết thúc vì không còn người tham gia.')
    db.execute(delete(RoomSignal).where(
        RoomSignal.room_id == room.id, RoomSignal.created_at <= now - timedelta(seconds=SIGNAL_SECONDS),
    ))
    return room


def member_for(db, room, user, client_id):
    member = db.get(RoomParticipant, str(client_id))
    if not member or member.room_id != room.id or member.user_id != user.id:
        raise HTTPException(403, 'Bạn chưa tham gia phòng hoặc phiên tham gia đã hết hạn.')
    return member


def room_summary(room, count):
    return {'code': room.code, 'title': room.title,
            'visibility': 'public' if room.is_public else 'private',
            'participant_count': count, 'max_participants': MAX_MEMBERS,
            'created_at': room.created_at.isoformat() + 'Z'}


def state_for(db, room, client_id, after=0):
    rows = db.execute(select(RoomParticipant, User).join(User, User.id == RoomParticipant.user_id)
        .where(RoomParticipant.room_id == room.id).order_by(RoomParticipant.joined_at, RoomParticipant.id)).all()
    signals = db.scalars(select(RoomSignal).where(
        RoomSignal.room_id == room.id, RoomSignal.recipient_id == str(client_id), RoomSignal.id > after,
    ).order_by(RoomSignal.id).limit(100)).all()
    return {
        'room': room_summary(room, len(rows)), 'self_id': str(client_id),
        'lease_seconds': LEASE_SECONDS, 'poll_interval_ms': 1800,
        'participants': [{'id': member.id, 'display_name': user.display_name,
            'avatar_url': user.avatar_url, 'is_creator': user.id == room.creator_id,
            'camera_on': member.camera_on, 'microphone_on': member.microphone_on,
            'hand_raised': member.hand_raised} for member, user in rows],
        'signals': [{'id': signal.id, 'sender_id': signal.sender_id, 'kind': signal.kind,
                     'data': json.loads(signal.payload)} for signal in signals],
        'cursor': signals[-1].id if signals else after,
    }


@router.get('')
def public_rooms(db: Db, user: CurrentUser, response: Response,
                 limit: int = Query(18, ge=1, le=30), offset: int = Query(0, ge=0, le=10000)):
    now = utcnow()
    expire_rooms(db, now)
    counts = select(RoomParticipant.room_id, func.count().label('count')).where(
        RoomParticipant.expires_at > now,
    ).group_by(RoomParticipant.room_id).subquery()
    rooms = db.execute(select(CallRoom, counts.c.count).join(counts, counts.c.room_id == CallRoom.id)
        .where(CallRoom.is_public.is_(True)).order_by(CallRoom.created_at.desc()).limit(limit).offset(offset)).all()
    result = [room_summary(room, count) for room, count in rooms]
    db.commit()
    response.headers['Cache-Control'] = 'no-store'
    return result


@router.get('/ice')
def ice_configuration(user: CurrentUser, response: Response, db: Db):
    limit_entry(db, user.id, utcnow())
    servers = []
    stun_urls = [url.strip() for url in os.getenv('RTC_STUN_URLS', 'stun:stun.l.google.com:19302').split(',') if url.strip()]
    if any(not re.fullmatch(r'stuns?:[^\s]+', url) for url in stun_urls):
        raise HTTPException(503, 'Cấu hình máy chủ kết nối chưa hợp lệ.')
    if stun_urls:
        servers.append({'urls': stun_urls})
    provider = os.getenv('RTC_TURN_PROVIDER', 'coturn').strip().lower()
    if provider == 'cloudflare':
        key_id = os.getenv('CLOUDFLARE_TURN_KEY_ID', '').strip()
        token = os.getenv('CLOUDFLARE_TURN_API_TOKEN', '').strip()
        if not re.fullmatch(r'[a-zA-Z0-9_-]{16,128}', key_id) or not token:
            raise HTTPException(503, 'Chưa cấu hình đầy đủ Cloudflare TURN.')
        try:
            result = requests.post(
                f'https://rtc.live.cloudflare.com/v1/turn/keys/{key_id}/credentials/generate-ice-servers',
                headers={'Authorization': f'Bearer {token}'}, json={'ttl': 7200}, timeout=10,
            )
            result.raise_for_status()
            entries = result.json()['iceServers']
            if not isinstance(entries, list) or not 1 <= len(entries) <= 10:
                raise ValueError('Invalid ICE configuration')
            relay = False
            for entry in entries:
                urls = entry['urls']
                urls = [urls] if isinstance(urls, str) else urls
                if not isinstance(urls, list) or not urls or any(
                    not isinstance(url, str) or not re.fullmatch(r'(?:stuns?|turns?):[^\s]+', url) for url in urls
                ):
                    raise ValueError('Invalid ICE URLs')
                urls = [url for url in urls if not re.search(r':53(?:\?|$)', url)]
                if not urls:
                    continue
                item = {'urls': urls}
                if any(url.startswith(('turn:', 'turns:')) for url in urls):
                    if not all(isinstance(entry.get(key), str) and entry[key] for key in ('username', 'credential')):
                        raise ValueError('Missing TURN credentials')
                    item.update(username=entry['username'], credential=entry['credential'])
                    relay = True
                servers.append(item)
            if not relay:
                raise ValueError('No TURN relay')
        except (requests.RequestException, ValueError, KeyError, TypeError):
            raise HTTPException(503, 'Chưa lấy được kết nối TURN. Hãy thử lại hoặc kiểm tra cấu hình máy chủ.') from None
        response.headers['Cache-Control'] = 'no-store'
        return {'ice_servers': servers, 'relay_configured': True, 'expires_in': 7200}
    if provider != 'coturn':
        raise HTTPException(503, 'Nhà cung cấp TURN chưa hợp lệ.')
    turn_urls = [url.strip() for url in os.getenv('RTC_TURN_URLS', '').split(',') if url.strip()]
    turn_secret = os.getenv('RTC_TURN_SECRET', '')
    if turn_urls:
        if not turn_secret or any(not re.fullmatch(r'turns?:[^\s]+', url) for url in turn_urls):
            raise HTTPException(503, 'Cấu hình máy chủ chuyển tiếp chưa đầy đủ.')
        username = f'{int(time.time()) + 7200}:{user.id}'
        credential = base64.b64encode(hmac.new(turn_secret.encode(), username.encode(), hashlib.sha1).digest()).decode()
        servers.append({'urls': turn_urls, 'username': username, 'credential': credential})
    response.headers['Cache-Control'] = 'no-store'
    return {'ice_servers': servers, 'relay_configured': bool(turn_urls), 'expires_in': 7200}


@router.post('', status_code=201)
def create_room(payload: CreateInput, db: Db, user: RoomWriter, response: Response):
    now = utcnow()
    limit_entry(db, user.id, now)
    expire_rooms(db, now)
    client_id = str(payload.client_id)
    existing = db.get(RoomParticipant, client_id)
    if existing:
        if existing.user_id != user.id:
            raise HTTPException(409, 'Phiên tham gia không hợp lệ.')
        room = lock_room(db, db.get(CallRoom, existing.room_id).code, now)
        result = state_for(db, room, client_id)
        db.commit()
        return result
    expiry = now + timedelta(seconds=LEASE_SECONDS)
    for attempt in range(3):
        room = CallRoom(id=str(uuid4()), code=''.join(secrets.choice(CODE_ALPHABET) for _ in range(10)),
            title=payload.title, is_public=payload.visibility == 'public', creator_id=user.id,
            created_at=now, expires_at=expiry)
        try:
            with db.begin_nested():
                db.add(room)
                db.flush()
            break
        except IntegrityError:
            if attempt == 2:
                raise HTTPException(503, 'Không thể tạo mã phòng. Hãy thử lại.') from None
    db.add(RoomParticipant(id=client_id, room_id=room.id, user_id=user.id,
        joined_at=now, expires_at=expiry, camera_on=False, microphone_on=False,
        hand_raised=False, action_window=now, action_count=0))
    db.flush()
    result = state_for(db, room, client_id)
    db.commit()
    response.headers['Cache-Control'] = 'no-store'
    return result


@router.post('/join')
def join_room(payload: JoinInput, db: Db, user: RoomWriter, response: Response):
    now = utcnow()
    limit_entry(db, user.id, now)
    room = lock_room(db, payload.code, now)
    client_id = str(payload.client_id)
    existing = db.get(RoomParticipant, client_id)
    if existing:
        member_for(db, room, user, client_id)
    else:
        duplicate = db.scalar(select(RoomParticipant.id).where(
            RoomParticipant.room_id == room.id, RoomParticipant.user_id == user.id,
        ))
        if duplicate:
            raise HTTPException(409, 'Bạn đang ở phòng này trong tab khác. Hãy rời tab đó trước hoặc chờ phiên cũ hết hạn.')
        count = db.scalar(select(func.count()).select_from(RoomParticipant).where(RoomParticipant.room_id == room.id))
        if count >= MAX_MEMBERS:
            raise HTTPException(409, 'Phòng đã đủ 6 người. Hãy chọn phòng khác.')
        existing = RoomParticipant(id=client_id, room_id=room.id, user_id=user.id,
            joined_at=now, expires_at=now, camera_on=False, microphone_on=False,
            hand_raised=False, action_window=now, action_count=0)
        db.add(existing)
    existing.expires_at = now + timedelta(seconds=LEASE_SECONDS)
    room.expires_at = existing.expires_at
    db.flush()
    result = state_for(db, room, client_id)
    db.commit()
    response.headers['Cache-Control'] = 'no-store'
    return result


@router.post('/{code}/sync')
def sync_room(code: str, payload: SyncInput, db: Db, user: RoomWriter, response: Response):
    now = utcnow()
    room = lock_room(db, code, now)
    member = member_for(db, room, user, payload.client_id)
    member.expires_at = now + timedelta(seconds=LEASE_SECONDS)
    member.camera_on, member.microphone_on, member.hand_raised = payload.camera_on, payload.microphone_on, payload.hand_raised
    room.expires_at = member.expires_at
    db.flush()
    result = state_for(db, room, member.id, payload.after)
    db.commit()
    response.headers['Cache-Control'] = 'no-store'
    return result


@router.post('/{code}/signals', status_code=202)
def send_signal(code: str, payload: SignalInput, db: Db, user: RoomWriter):
    now = utcnow()
    room = lock_room(db, code, now)
    sender = member_for(db, room, user, payload.client_id)
    recipient = db.get(RoomParticipant, str(payload.recipient_id))
    if not recipient or recipient.room_id != room.id or recipient.id == sender.id:
        raise HTTPException(404, 'Người nhận đã rời phòng.')
    if sender.action_window <= now - timedelta(minutes=1):
        sender.action_window, sender.action_count = now, 0
    if sender.action_count >= 240:
        raise HTTPException(429, 'Quá nhiều tín hiệu kết nối. Hãy thử lại sau.', headers={'Retry-After': '60'})
    sender.action_count += 1
    db.add(RoomSignal(room_id=room.id, sender_id=sender.id, recipient_id=recipient.id,
        kind=payload.kind, payload=json.dumps(payload.data, ensure_ascii=True), created_at=now))
    db.commit()
    return {'accepted': True}


@router.post('/{code}/leave')
def leave_room(code: str, payload: LeaveInput, request: Request, db: Db, user: CurrentUser):
    token = request.headers.get('X-CSRF-Token', '') or payload.csrf_token
    if not token or not hmac.compare_digest(token, request.state.session_claims['csrf']):
        raise HTTPException(403, 'Yêu cầu xác thực CSRF không hợp lệ.')
    now = utcnow()
    try:
        room = lock_room(db, code, now)
    except HTTPException as error:
        if error.status_code in (404, 410):
            return {'closed': True}
        raise
    member = db.get(RoomParticipant, str(payload.client_id))
    if not member:
        db.commit()
        return {'closed': False}
    member_for(db, room, user, payload.client_id)
    db.delete(member)
    db.flush()
    remaining_expiry = db.scalar(select(func.max(RoomParticipant.expires_at)).where(RoomParticipant.room_id == room.id))
    closed = remaining_expiry is None
    if closed:
        db.delete(room)
    else:
        room.expires_at = remaining_expiry
    db.commit()
    return {'closed': closed}
