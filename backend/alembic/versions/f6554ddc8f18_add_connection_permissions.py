"""add_connection_permissions

Revision ID: f6554ddc8f18
Revises: a87f1e87be87
Create Date: 2025-11-09 19:39:22.195809

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6554ddc8f18'
down_revision: Union[str, Sequence[str], None] = 'a87f1e87be87'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create connection_permissions table
    op.create_table(
        'connection_permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('connection_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('permission_level', sa.String(20), nullable=False),
        sa.Column('granted_by', sa.Integer(), nullable=False),
        sa.Column('granted_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['connection_id'], ['connections.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['granted_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('connection_id', 'user_id', name='unique_connection_user'),
        sa.CheckConstraint(
            "permission_level IN ('owner', 'editor', 'viewer')",
            name='valid_permission_level'
        )
    )

    # Create indexes for better query performance
    op.create_index('ix_connection_permissions_connection_id', 'connection_permissions', ['connection_id'])
    op.create_index('ix_connection_permissions_user_id', 'connection_permissions', ['user_id'])
    op.create_index('ix_connection_permissions_user_connection', 'connection_permissions', ['user_id', 'connection_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_connection_permissions_user_connection', table_name='connection_permissions')
    op.drop_index('ix_connection_permissions_user_id', table_name='connection_permissions')
    op.drop_index('ix_connection_permissions_connection_id', table_name='connection_permissions')
    op.drop_table('connection_permissions')
