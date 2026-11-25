"""Store the shared seasonal appearance setting."""

import sqlalchemy as sa
from alembic import op

revision = 'h26a_seasonal_appearance'
down_revision = 'g15d_call_rooms'
branch_labels = None
depends_on = None


def upgrade():
    settings = op.create_table(
        'seasonal_appearance',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=False),
        sa.Column('winter_enabled', sa.Boolean(), nullable=False),
        sa.Column('revision', sa.Integer(), nullable=False),
    )
    op.bulk_insert(settings, [{'id': 1, 'winter_enabled': False, 'revision': 0}])


def downgrade():
    op.drop_table('seasonal_appearance')
