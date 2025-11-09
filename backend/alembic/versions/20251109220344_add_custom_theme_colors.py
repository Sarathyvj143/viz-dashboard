"""add custom theme colors

Revision ID: 20251109220344
Revises: e73bf9fb92f4
Create Date: 2025-11-09 22:03:44

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20251109220344'
down_revision: Union[str, None] = 'e73bf9fb92f4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('custom_theme_colors', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'custom_theme_colors')
