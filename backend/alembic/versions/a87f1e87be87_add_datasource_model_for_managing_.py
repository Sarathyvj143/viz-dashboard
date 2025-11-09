"""Add DataSource model for managing multiple databases and folders per connection

Revision ID: a87f1e87be87
Revises: 002
Create Date: 2025-11-08 18:15:47.465670

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a87f1e87be87'
down_revision: Union[str, Sequence[str], None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add DataSource table only."""
    # Create data_sources table
    op.create_table('data_sources',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('connection_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('source_type', sa.String(length=50), nullable=False),
    sa.Column('source_identifier', sa.String(length=500), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('workspace_id', sa.Integer(), nullable=False),
    sa.Column('created_by', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.TIMESTAMP(), nullable=True),
    sa.Column('updated_at', sa.TIMESTAMP(), nullable=True),
    sa.ForeignKeyConstraint(['connection_id'], ['connections.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('connection_id', 'source_identifier', name='uq_connection_source')
    )
    op.create_index('idx_datasource_workspace', 'data_sources', ['workspace_id'], unique=False)
    op.create_index(op.f('ix_data_sources_connection_id'), 'data_sources', ['connection_id'], unique=False)
    op.create_index(op.f('ix_data_sources_workspace_id'), 'data_sources', ['workspace_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema - Remove DataSource table."""
    op.drop_index(op.f('ix_data_sources_workspace_id'), table_name='data_sources')
    op.drop_index(op.f('ix_data_sources_connection_id'), table_name='data_sources')
    op.drop_index('idx_datasource_workspace', table_name='data_sources')
    op.drop_table('data_sources')
