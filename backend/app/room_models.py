"""Short-lived call rooms. Media never passes through these tables."""
from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class CallRoom(Base):
    __tablename__ = 'call_rooms'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    code: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(80))
    is_public: Mapped[bool] = mapped_column(Boolean)
    creator_id: Mapped[int | None] = mapped_column(ForeignKey('users.id', ondelete='SET NULL'))
    created_at: Mapped[datetime] = mapped_column(DateTime)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)


class RoomParticipant(Base):
    __tablename__ = 'room_participants'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    room_id: Mapped[str] = mapped_column(ForeignKey('call_rooms.id', ondelete='CASCADE'), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    camera_on: Mapped[bool] = mapped_column(Boolean, default=False)
    microphone_on: Mapped[bool] = mapped_column(Boolean, default=False)
    hand_raised: Mapped[bool] = mapped_column(Boolean, default=False)
    action_window: Mapped[datetime] = mapped_column(DateTime)
    action_count: Mapped[int] = mapped_column(Integer, default=0)
    __table_args__ = (UniqueConstraint('room_id', 'user_id', name='uq_room_participant_user'),)


class RoomSignal(Base):
    __tablename__ = 'room_signals'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    room_id: Mapped[str] = mapped_column(ForeignKey('call_rooms.id', ondelete='CASCADE'), index=True)
    sender_id: Mapped[str] = mapped_column(ForeignKey('room_participants.id', ondelete='CASCADE'))
    recipient_id: Mapped[str] = mapped_column(ForeignKey('room_participants.id', ondelete='CASCADE'), index=True)
    kind: Mapped[str] = mapped_column(String(12))
    payload: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    __table_args__ = (CheckConstraint("kind IN ('offer', 'answer', 'ice', 'restart')", name='ck_room_signal_kind'),)


class RoomEntryLimit(Base):
    __tablename__ = 'room_entry_limits'
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    window_start: Mapped[datetime] = mapped_column(DateTime)
    attempts: Mapped[int] = mapped_column(Integer)
