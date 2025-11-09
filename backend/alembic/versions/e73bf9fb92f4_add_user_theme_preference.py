"""add_user_theme_preference

Revision ID: e73bf9fb92f4
Revises: f6554ddc8f18
Create Date: 2025-11-09 21:28:59.496014

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e73bf9fb92f4'
down_revision: Union[str, Sequence[str], None] = 'f6554ddc8f18'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add theme_preference column to users table
    op.add_column('users', sa.Column('theme_preference', sa.String(20), server_default='light'))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove theme_preference column from users table
    op.drop_column('users', 'theme_preference')
