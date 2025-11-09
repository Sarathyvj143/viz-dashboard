"""Migrate existing data to default workspace

Revision ID: 002
Revises: 001
Create Date: 2025-11-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy import TIMESTAMP
from datetime import datetime


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    """Migrate all existing data to a default workspace"""

    connection = op.get_bind()

    # PRE-FLIGHT CHECKS
    print("\n" + "="*60)
    print("Running pre-flight validation...")
    print("="*60)

    # Check 1: Verify active users exist
    result = connection.execute(text("SELECT COUNT(*) FROM users WHERE is_active = 1"))
    user_count = result.scalar()
    if user_count == 0:
        print("[INFO] No active users found - skipping default workspace creation")
        print("       The first user registration will create their personal workspace")
        print("       Migration 002 marked as complete (no-op)")
        return  # Exit successfully - nothing to migrate
    print(f"Found {user_count} active user(s)")

    # Check 2: Verify no orphaned dashboards
    result = connection.execute(text("""
        SELECT COUNT(*) FROM dashboards
        WHERE created_by NOT IN (SELECT id FROM users)
    """))
    orphaned = result.scalar()
    if orphaned > 0:
        raise Exception(f"MIGRATION FAILED: Found {orphaned} orphaned dashboards. Clean data first.")
    print("No orphaned dashboards")

    # Check 3: Verify SQLite version (for DROP COLUMN support)
    result = connection.execute(text("SELECT sqlite_version()"))
    sqlite_version = result.scalar()
    major, minor, patch = map(int, sqlite_version.split('.'))
    print(f"SQLite version: {sqlite_version}")

    # START MIGRATION
    print("\n" + "="*60)
    print("Starting migration to multi-tenant workspace...")
    print("="*60 + "\n")

    # Step 1: Create default workspace
    print("Step 1: Creating default workspace...")
    connection.execute(text("""
        INSERT INTO workspaces (id, name, slug, created_by, created_at, updated_at)
        SELECT
            1,
            'Default Workspace',
            'default',
            MIN(id),
            MIN(created_at),
            CURRENT_TIMESTAMP
        FROM users WHERE is_active = 1
    """))
    print("Created default workspace (ID: 1, slug: 'default')")

    # Step 2: Migrate all users to default workspace (preserve roles)
    print("\nStep 2: Migrating users to default workspace...")
    connection.execute(text("""
        INSERT INTO workspace_members (workspace_id, user_id, role, invited_by, joined_at)
        SELECT
            1,
            id,
            CASE
                WHEN role = 'admin' THEN 'admin'
                WHEN role = 'editor' THEN 'editor'
                ELSE 'viewer'
            END,
            id,
            created_at
        FROM users WHERE is_active = 1
    """))
    print(f"Migrated {user_count} user(s) to default workspace (roles preserved)")

    # Step 3: Set current_workspace_id for all users
    print("\nStep 3: Setting current workspace for all users...")
    connection.execute(text("UPDATE users SET current_workspace_id = 1 WHERE is_active = 1"))
    print("Set current_workspace_id = 1 for all active users")

    # Step 4: Migrate resources to default workspace
    print("\nStep 4: Migrating resources to default workspace...")

    result = connection.execute(text("SELECT COUNT(*) FROM dashboards"))
    dashboard_count = result.scalar()
    connection.execute(text("UPDATE dashboards SET workspace_id = 1"))
    print(f"   Migrated {dashboard_count} dashboard(s)")

    result = connection.execute(text("SELECT COUNT(*) FROM charts"))
    chart_count = result.scalar()
    connection.execute(text("UPDATE charts SET workspace_id = 1"))
    print(f"   Migrated {chart_count} chart(s)")

    result = connection.execute(text("SELECT COUNT(*) FROM connections"))
    connection_count = result.scalar()
    connection.execute(text("UPDATE connections SET workspace_id = 1"))
    print(f"   Migrated {connection_count} connection(s)")

    result = connection.execute(text("SELECT COUNT(*) FROM logs WHERE user_id IS NOT NULL"))
    log_count = result.scalar()
    connection.execute(text("UPDATE logs SET workspace_id = 1 WHERE user_id IS NOT NULL"))
    print(f"   Migrated {log_count} log(s)")

    # Step 5: Create default workspace settings
    print("\nStep 5: Creating default workspace settings...")
    connection.execute(text("""
        INSERT INTO workspace_settings (workspace_id, redis_enabled, redis_host, redis_port, max_dashboards, max_members)
        VALUES (1, 0, 'localhost', 6379, 1000, 100)
    """))
    print("Created default settings (Redis: disabled, max_dashboards: 1000, max_members: 100)")

    # Step 6: Add NOT NULL constraints and indexes
    print("\nStep 6: Adding constraints and indexes...")
    op.alter_column('dashboards', 'workspace_id', nullable=False)
    op.alter_column('charts', 'workspace_id', nullable=False)
    op.alter_column('connections', 'workspace_id', nullable=False)

    op.create_index('idx_dashboards_workspace', 'dashboards', ['workspace_id'])
    op.create_index('idx_charts_workspace', 'charts', ['workspace_id'])
    op.create_index('idx_connections_workspace', 'connections', ['workspace_id'])
    op.create_index('idx_logs_workspace', 'logs', ['workspace_id'])
    print("Added NOT NULL constraints and performance indexes")

    # Step 7: Add foreign key constraints
    print("\nStep 7: Adding foreign key constraints...")
    op.create_foreign_key('fk_dashboards_workspace', 'dashboards', 'workspaces', ['workspace_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_charts_workspace', 'charts', 'workspaces', ['workspace_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_connections_workspace', 'connections', 'workspaces', ['workspace_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_logs_workspace', 'logs', 'workspaces', ['workspace_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key('fk_users_current_workspace', 'users', 'workspaces', ['current_workspace_id'], ['id'], ondelete='SET NULL')
    print("Added foreign key constraints with proper CASCADE/SET NULL behavior")

    # Step 8: Remove old role column from users (if SQLite version supports it)
    print("\nStep 8: Removing old 'role' column from users table...")
    if (major, minor) >= (3, 35):
        op.drop_column('users', 'role')
        print("Removed 'role' column from users (now workspace-specific)")
    else:
        print(f"SQLite version {sqlite_version} < 3.35.0")
        print("   Skipping DROP COLUMN (not supported)")
        print("   Column 'role' left in place - manual cleanup required after upgrade")

    # Migration complete
    print("\n" + "="*60)
    print("Migration 002 completed successfully!")
    print("="*60)
    print(f"\nSummary:")
    print(f"   - Workspace ID: 1 (slug: 'default')")
    print(f"   - Users migrated: {user_count}")
    print(f"   - Dashboards migrated: {dashboard_count}")
    print(f"   - Charts migrated: {chart_count}")
    print(f"   - Connections migrated: {connection_count}")
    print(f"   - Logs migrated: {log_count}")
    print(f"   - All resources now scoped to workspace")
    print("="*60 + "\n")


def downgrade():
    """Reverse migration 002 - restore single-tenant state"""

    connection = op.get_bind()

    print("\nRolling back migration 002...")

    # Step 1: Add role column back to users
    print("Adding 'role' column back to users...")
    op.add_column('users', sa.Column('role', sa.String(length=20), default='viewer'))

    # Step 2: Restore roles from workspace_members
    print("Restoring user roles from workspace_members...")
    connection.execute(text("""
        UPDATE users
        SET role = (
            SELECT role FROM workspace_members
            WHERE workspace_members.user_id = users.id
            AND workspace_members.workspace_id = 1
            LIMIT 1
        )
    """))

    # Step 3: Remove foreign key constraints
    print("Removing foreign key constraints...")
    op.drop_constraint('fk_users_current_workspace', 'users', type_='foreignkey')
    op.drop_constraint('fk_logs_workspace', 'logs', type_='foreignkey')
    op.drop_constraint('fk_connections_workspace', 'connections', type_='foreignkey')
    op.drop_constraint('fk_charts_workspace', 'charts', type_='foreignkey')
    op.drop_constraint('fk_dashboards_workspace', 'dashboards', type_='foreignkey')

    # Step 4: Remove indexes
    print("Removing indexes...")
    op.drop_index('idx_logs_workspace', 'logs')
    op.drop_index('idx_connections_workspace', 'connections')
    op.drop_index('idx_charts_workspace', 'charts')
    op.drop_index('idx_dashboards_workspace', 'dashboards')

    # Step 5: Make workspace_id columns nullable again
    op.alter_column('dashboards', 'workspace_id', nullable=True)
    op.alter_column('charts', 'workspace_id', nullable=True)
    op.alter_column('connections', 'workspace_id', nullable=True)

    print("Migration 002 rollback completed")
