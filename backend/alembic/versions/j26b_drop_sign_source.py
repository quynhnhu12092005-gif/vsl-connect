"""Remove the unused dictionary source field."""

import sqlalchemy as sa
from alembic import op

revision = 'j26b_drop_sign_source'
down_revision = 'h26a_seasonal_appearance'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column('signs', 'source')


def downgrade():
    # The schema can be restored. Recover old source values from a backup.
    op.add_column('signs', sa.Column('source', sa.String(500), nullable=True))
