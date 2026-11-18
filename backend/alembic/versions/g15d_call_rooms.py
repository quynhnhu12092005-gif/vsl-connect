"""Add expiring video rooms, participants and WebRTC signaling."""
from alembic import op
import sqlalchemy as sa

revision = 'g15d_call_rooms'
down_revision = 'f04c_tidb_checks'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('call_rooms',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('code', sa.String(10), nullable=False),
        sa.Column('title', sa.String(80), nullable=False),
        sa.Column('is_public', sa.Boolean(), nullable=False),
        sa.Column('creator_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL')),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_call_rooms_code', 'call_rooms', ['code'], unique=True)
    op.create_index('ix_call_rooms_expires_at', 'call_rooms', ['expires_at'])
    op.create_table('room_participants',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('room_id', sa.String(36), sa.ForeignKey('call_rooms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('joined_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('camera_on', sa.Boolean(), nullable=False),
        sa.Column('microphone_on', sa.Boolean(), nullable=False),
        sa.Column('hand_raised', sa.Boolean(), nullable=False),
        sa.Column('action_window', sa.DateTime(), nullable=False),
        sa.Column('action_count', sa.Integer(), nullable=False),
        sa.UniqueConstraint('room_id', 'user_id', name='uq_room_participant_user'),
    )
    op.create_index('ix_room_participants_room_id', 'room_participants', ['room_id'])
    op.create_index('ix_room_participants_user_id', 'room_participants', ['user_id'])
    op.create_index('ix_room_participants_expires_at', 'room_participants', ['expires_at'])
    op.create_table('room_signals',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('room_id', sa.String(36), sa.ForeignKey('call_rooms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('sender_id', sa.String(36), sa.ForeignKey('room_participants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('recipient_id', sa.String(36), sa.ForeignKey('room_participants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('kind', sa.String(12), nullable=False),
        sa.Column('payload', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.CheckConstraint("kind IN ('offer', 'answer', 'ice', 'restart')", name='ck_room_signal_kind'),
    )
    for column in ('room_id', 'recipient_id', 'created_at'):
        op.create_index(f'ix_room_signals_{column}', 'room_signals', [column])
    op.create_table('room_entry_limits',
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('window_start', sa.DateTime(), nullable=False),
        sa.Column('attempts', sa.Integer(), nullable=False),
    )


def downgrade():
    op.drop_table('room_entry_limits')
    op.drop_table('room_signals')
    op.drop_table('room_participants')
    op.drop_table('call_rooms')
