"""Add multi-tenant workspace schema

Revision ID: 001
Revises: 
Create Date: 2025-11-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import TIMESTAMP
from datetime import datetime


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """Add workspace tables and workspace_id columns to existing tables"""
    
    # Create workspaces table
    op.create_table('workspaces',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', TIMESTAMP, nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', TIMESTAMP, nullable=False, default=datetime.utcnow),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug', name='uq_workspaces_slug')
    )
    op.create_index('idx_workspaces_slug', 'workspaces', ['slug'])
    op.create_index('idx_workspaces_created_by', 'workspaces', ['created_by'])

    # Create workspace_members table
    op.create_table('workspace_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('workspace_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('invited_by', sa.Integer(), nullable=True),
        sa.Column('joined_at', TIMESTAMP, nullable=False, default=datetime.utcnow),
        sa.CheckConstraint("role IN ('admin', 'editor', 'viewer')", name='check_valid_role'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['invited_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('workspace_id', 'user_id', name='uq_workspace_user')
    )
    op.create_index('idx_workspace_members_composite', 'workspace_members', ['user_id', 'workspace_id'])

    # Create workspace_settings table
    op.create_table('workspace_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('workspace_id', sa.Integer(), nullable=False),
        sa.Column('redis_enabled', sa.Boolean(), default=False),
        sa.Column('redis_host', sa.String(length=255), default='localhost'),
        sa.Column('redis_port', sa.Integer(), default=6379),
        sa.Column('redis_password', sa.Text(), nullable=True),
        sa.Column('max_dashboards', sa.Integer(), default=1000),
        sa.Column('max_members', sa.Integer(), default=100),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.Column('updated_at', TIMESTAMP, nullable=True),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('workspace_id', name='uq_workspace_settings_workspace')
    )

    # Add workspace_id columns (nullable initially for migration)
    op.add_column('users', sa.Column('current_workspace_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), default=False))
    op.add_column('dashboards', sa.Column('workspace_id', sa.Integer(), nullable=True))
    op.add_column('charts', sa.Column('workspace_id', sa.Integer(), nullable=True))
    op.add_column('connections', sa.Column('workspace_id', sa.Integer(), nullable=True))
    op.add_column('logs', sa.Column('workspace_id', sa.Integer(), nullable=True))

    print("Migration 001: Workspace schema created successfully")


def downgrade():
    """Reverse all changes from migration 001"""
    
    # Remove workspace_id columns from existing tables
    op.drop_column('logs', 'workspace_id')
    op.drop_column('connections', 'workspace_id')
    op.drop_column('charts', 'workspace_id')
    op.drop_column('dashboards', 'workspace_id')
    op.drop_column('users', 'email_verified')
    op.drop_column('users', 'current_workspace_id')

    # Drop workspace tables (in reverse order due to foreign keys)
    op.drop_table('workspace_settings')
    op.drop_table('workspace_members')
    op.drop_table('workspaces')

    print("✅ Migration 001: Downgrade completed successfully")
