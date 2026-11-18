from datetime import timedelta, timezone
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from test_backend import client
from app.db import get_engine
from app.main import app
from app.models import User
from app.room_models import CallRoom, RoomParticipant, RoomSignal
from app.rooms import utcnow
from app.security import hash_password


PASSWORD = 'correct-horse-battery-staple'


def sign_in(browser, email='admin@example.com'):
    response = browser.post('/api/v1/auth/login', json={'email': email, 'password': PASSWORD})
    assert response.status_code == 200
    return {'X-CSRF-Token': response.json()['csrf_token']}


def create(browser, headers, visibility='public', client_id=None):
    client_id = client_id or str(uuid4())
    response = browser.post('/api/v1/rooms', headers=headers,
        json={'title': 'Cùng học ký hiệu', 'visibility': visibility, 'client_id': client_id})
    assert response.status_code == 201, response.text
    return response.json(), client_id


def test_room_auth_csrf_and_private_listing(client):
    assert client.get('/api/v1/rooms').status_code == 401
    headers = sign_in(client)
    assert client.post('/api/v1/rooms', json={'title': 'Test', 'client_id': str(uuid4())}).status_code == 403
    private, private_id = create(client, headers, 'private')
    public, public_id = create(client, headers)
    listing = client.get('/api/v1/rooms')
    assert listing.headers['cache-control'] == 'no-store'
    assert [room['code'] for room in listing.json()] == [public['room']['code']]
    assert private['room']['code'] not in listing.text
    assert all('email' not in participant for participant in private['participants'])
    for state, member_id in ((private, private_id), (public, public_id)):
        response = client.post(f"/api/v1/rooms/{state['room']['code']}/leave",
            headers=headers, json={'client_id': member_id})
        assert response.json()['closed'] is True
    assert client.get('/api/v1/rooms').json() == []


def test_private_join_signaling_isolation_and_cascade(client):
    owner_headers = sign_in(client)
    first, owner_id = create(client, owner_headers, 'private')
    code = first['room']['code']
    with TestClient(app) as guest:
        guest_headers = sign_in(guest, 'learner@example.com')
        guest_id = str(uuid4())
        joined = guest.post('/api/v1/rooms/join', headers=guest_headers,
            json={'code': code.lower(), 'client_id': guest_id})
        assert joined.status_code == 200
        assert len(joined.json()['participants']) == 2
        # Knowing another participant's public ID cannot impersonate them.
        assert guest.post(f'/api/v1/rooms/{code}/sync', headers=guest_headers,
            json={'client_id': owner_id}).status_code == 403
        offer = {'client_id': owner_id, 'recipient_id': guest_id, 'kind': 'offer',
                 'data': {'type': 'offer', 'sdp': 'v=0\r\n'}}
        assert client.post(f'/api/v1/rooms/{code}/signals', headers=owner_headers, json=offer).status_code == 202
        sync = guest.post(f'/api/v1/rooms/{code}/sync', headers=guest_headers,
            json={'client_id': guest_id, 'camera_on': True, 'hand_raised': True}).json()
        assert len(sync['signals']) == 1
        assert sync['signals'][0]['sender_id'] == owner_id
        own_sync = client.post(f'/api/v1/rooms/{code}/sync', headers=owner_headers,
            json={'client_id': owner_id}).json()
        assert own_sync['signals'] == []
        assert any(p['hand_raised'] for p in own_sync['participants'])
        again = guest.post(f'/api/v1/rooms/{code}/sync', headers=guest_headers,
            json={'client_id': guest_id, 'after': sync['cursor']}).json()
        assert again['signals'] == []
        other, other_id = create(client, owner_headers)
        wrong_room = {**offer, 'client_id': other_id}
        assert client.post(f"/api/v1/rooms/{other['room']['code']}/signals",
            headers=owner_headers, json=wrong_room).status_code == 404
        # A missing CSRF token cannot eject even the current user's connection.
        assert guest.post(f'/api/v1/rooms/{code}/leave', json={'client_id': guest_id}).status_code == 403
        assert client.post(f'/api/v1/rooms/{code}/leave', headers=owner_headers,
            json={'client_id': owner_id}).json()['closed'] is False
        # The owner leaving must not close a room while someone remains.
        assert guest.post(f'/api/v1/rooms/{code}/sync', headers=guest_headers,
            json={'client_id': guest_id}).status_code == 200
        assert guest.post(f'/api/v1/rooms/{code}/leave', json={
            'client_id': guest_id, 'csrf_token': guest_headers['X-CSRF-Token'],
        }).json()['closed'] is True
        with Session(get_engine()) as db:
            assert db.scalar(select(CallRoom).where(CallRoom.code == code)) is None
            assert db.scalar(select(func.count()).select_from(RoomSignal)) == 0
        assert guest.post('/api/v1/rooms/join', headers=guest_headers,
            json={'code': code, 'client_id': str(uuid4())}).status_code == 404


def test_six_member_capacity_idempotence_and_duplicate_tabs(client):
    owner_headers = sign_in(client)
    state, owner_id = create(client, owner_headers)
    code = state['room']['code']
    # Replaying a successful creation must not create a second room.
    replay, _ = create(client, owner_headers, client_id=owner_id)
    assert replay['room']['code'] == code
    with Session(get_engine()) as db:
        password_hash = hash_password(PASSWORD)
        for index in range(6):
            db.add(User(email=f'room-test-{index}@example.com', display_name=f'User {index}',
                        password_hash=password_hash, role='learner'))
        db.commit()
    for index in range(6):
        with TestClient(app) as guest:
            headers = sign_in(guest, f'room-test-{index}@example.com')
            member_id = str(uuid4())
            result = guest.post('/api/v1/rooms/join', headers=headers,
                json={'code': code, 'client_id': member_id})
            if index < 5:
                assert result.status_code == 200
                assert guest.post('/api/v1/rooms/join', headers=headers,
                    json={'code': code, 'client_id': member_id}).status_code == 200
                assert guest.post('/api/v1/rooms/join', headers=headers,
                    json={'code': code, 'client_id': str(uuid4())}).status_code == 409
            else:
                assert result.status_code == 409
                assert '6 người' in result.json()['detail']


def test_expired_presence_does_not_keep_rooms_alive(client):
    headers = sign_in(client)
    state, member_id = create(client, headers)
    code = state['room']['code']
    with Session(get_engine()) as db:
        room = db.scalar(select(CallRoom).where(CallRoom.code == code))
        room.expires_at = utcnow() - timedelta(seconds=1)
        db.get(RoomParticipant, member_id).expires_at = room.expires_at
        db.commit()
    assert client.post(f'/api/v1/rooms/{code}/sync', headers=headers,
        json={'client_id': member_id}).status_code == 410
    assert client.get('/api/v1/rooms').json() == []
    with Session(get_engine()) as db:
        assert db.scalar(select(func.count()).select_from(CallRoom)) == 0
        assert db.scalar(select(func.count()).select_from(RoomParticipant)) == 0


def test_room_entry_rate_limit_persists_failed_guesses(client):
    headers = sign_in(client)
    for _ in range(20):
        assert client.post('/api/v1/rooms/join', headers=headers,
            json={'code': 'AAAAAAAAAA', 'client_id': str(uuid4())}).status_code == 404
    blocked = client.post('/api/v1/rooms/join', headers=headers,
        json={'code': 'AAAAAAAAAA', 'client_id': str(uuid4())})
    assert blocked.status_code == 429
    assert blocked.headers['retry-after'] == '60'


def test_ice_credentials_are_short_lived_and_secret_is_not_exposed(client, monkeypatch):
    sign_in(client)
    monkeypatch.setenv('RTC_TURN_URLS', 'turn:relay.example.test:3478,turns:relay.example.test:5349')
    monkeypatch.setenv('RTC_TURN_SECRET', 'private-turn-signing-secret')
    response = client.get('/api/v1/rooms/ice')
    assert response.status_code == 200
    assert response.json()['relay_configured'] is True
    assert 'private-turn-signing-secret' not in response.text
    turn = response.json()['ice_servers'][-1]
    assert turn['credential']
    assert int(turn['username'].split(':')[0]) > int(utcnow().replace(tzinfo=timezone.utc).timestamp())
    assert response.headers['cache-control'] == 'no-store'
    monkeypatch.delenv('RTC_TURN_SECRET')
    assert client.get('/api/v1/rooms/ice').status_code == 503


def test_cloudflare_turn_keeps_api_token_server_side(client, monkeypatch):
    sign_in(client)
    monkeypatch.setenv('RTC_TURN_PROVIDER', 'cloudflare')
    monkeypatch.setenv('CLOUDFLARE_TURN_KEY_ID', 'a' * 32)
    monkeypatch.setenv('CLOUDFLARE_TURN_API_TOKEN', 'server-private-token')

    class Reply:
        def raise_for_status(self):
            pass

        def json(self):
            return {'iceServers': [{'urls': ['turn:turn.cloudflare.com:3478?transport=udp',
                'turn:turn.cloudflare.com:53?transport=udp'], 'username': 'temporary', 'credential': 'temporary-password'}]}

    def post(url, **kwargs):
        assert url.endswith('/credentials/generate-ice-servers')
        assert kwargs['headers']['Authorization'] == 'Bearer server-private-token'
        assert kwargs['json'] == {'ttl': 7200}
        assert kwargs['timeout'] == 10
        return Reply()

    monkeypatch.setattr('app.rooms.requests.post', post)
    response = client.get('/api/v1/rooms/ice')
    assert response.status_code == 200
    assert response.json()['relay_configured'] is True
    assert response.json()['expires_in'] == 7200
    assert 'server-private-token' not in response.text
    assert ':53?' not in response.text
    def unavailable(*args, **kwargs):
        from requests import Timeout
        raise Timeout('server-private-token upstream details')

    monkeypatch.setattr('app.rooms.requests.post', unavailable)
    failed = client.get('/api/v1/rooms/ice')
    assert failed.status_code == 503
    assert 'server-private-token' not in failed.text
    monkeypatch.delenv('CLOUDFLARE_TURN_API_TOKEN')
    assert client.get('/api/v1/rooms/ice').status_code == 503


def test_signal_payload_validation(client):
    headers = sign_in(client)
    state, owner_id = create(client, headers)
    response = client.post(f"/api/v1/rooms/{state['room']['code']}/signals", headers=headers,
        json={'client_id': owner_id, 'recipient_id': str(uuid4()), 'kind': 'offer',
              'data': {'type': 'answer', 'sdp': 'invalid'}})
    assert response.status_code == 422
