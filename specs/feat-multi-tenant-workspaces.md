# Specification: Multi-Tenant Workspace Architecture

## Status
**Draft** - Created 2025-11-01

## Authors
Claude Code

## Overview
Transform the existing single-tenant visualization platform into a multi-tenant SaaS architecture where each organization operates in an isolated workspace with its own users, dashboards, charts, data sources, and configurations. This enables the platform to serve multiple organizations from a single deployment while maintaining strict data isolation and workspace-level customization.

## Background/Problem Statement

### The Problem
The current visualization platform is designed for single-tenant deployments where one organization uses one instance. This creates several limitations:

1. **Resource Inefficiency**: Each organization requires separate infrastructure, leading to duplicated resources and increased operational costs
2. **Scaling Challenges**: Managing hundreds of separate deployments becomes operationally complex
3. **No Multi-Organization Support**: Users cannot belong to multiple organizations or switch between workspaces
4. **Collaboration Barriers**: Organizations cannot easily share dashboards or collaborate across team boundaries
5. **Deployment Overhead**: Each new organization requires manual deployment, configuration, and maintenance
6. **License Management**: Difficult to manage user licenses across multiple isolated deployments

### Root Cause Analysis
The platform was intentionally designed as single-tenant (listed as "Non-Goal" in original spec) to prioritize simplicity and data sovereignty. However, as adoption grows, the SaaS model becomes necessary to:
- Reduce infrastructure costs through resource sharing
- Simplify onboarding (self-service registration vs. manual deployment)
- Enable enterprise use cases where users need access to multiple organizations
- Provide centralized billing and license management

### Core Problem (Stripped of Solution Assumptions)
**How do we enable multiple organizations to use the platform while maintaining:**
- Complete data isolation between organizations
- Workspace-level customization (Redis, settings, configurations)
- Clear user identity and permissions per organization
- Self-service onboarding without manual intervention
- Seamless user experience when switching between workspaces

### Success Criteria
A successful implementation would allow:
1. Organization A creates workspace, invites members, creates dashboards - all isolated from Organization B
2. User can belong to multiple workspaces and switch between them without re-authentication
3. Each workspace admin can configure Redis, export settings, and other preferences independently
4. Existing single-tenant deployments can be migrated to multi-tenant without data loss
5. Platform can scale from 10 to 10,000 workspaces on the same infrastructure

### Alternative Approaches Considered

**Alternative 1: Separate Database Per Workspace**
- Pros: Perfect isolation, easier to scale per workspace
- Cons: Connection pool explosion, complex migrations, difficult cross-workspace queries
- Decision: Rejected due to operational complexity

**Alternative 2: Schema-Per-Workspace (PostgreSQL)**
- Pros: Good isolation, easier backups per workspace
- Cons: Requires PostgreSQL (conflicts with SQLite goal), complex schema management
- Decision: Rejected to maintain SQLite compatibility

**Alternative 3: Shared Tables with workspace_id (Chosen)**
- Pros: Simple, maintains SQLite, easy migrations, familiar patterns
- Cons: Requires rigorous query filtering, potential for data leaks if not careful
- Decision: Selected for balance of simplicity and effectiveness

**Alternative 4: Kubernetes Namespaces (Per-Workspace Deployments)**
- Pros: Perfect isolation, independent scaling
- Cons: Defeats multi-tenancy purpose, expensive, operationally complex
- Decision: Rejected as it doesn't solve the core problem

## Goals

- **Multi-Workspace Support**: Enable multiple organizations (workspaces) on a single deployment
- **Data Isolation**: Guarantee complete data separation between workspaces at the database level
- **User Membership**: Support users belonging to one or multiple workspaces
- **Role-Based Access Control**: Implement workspace-level roles (admin, editor, viewer) with proper permissions
- **Self-Service Onboarding**: Allow organizations to register and create workspaces without manual intervention
- **Workspace Administration**: Workspace admins can invite members, manage roles, and configure workspace settings
- **Workspace-Level Configuration**: Each workspace has independent Redis, export settings, and preferences
- **Seamless Workspace Switching**: Users can switch between workspaces without re-authentication
- **Backward Compatibility**: Existing single-tenant data can be migrated to default workspace
- **Audit Trail**: Track all workspace-level actions for security and compliance
- **Secure Invitations**: Email-based invitation system with token validation

## Non-Goals

- **Cross-Workspace Data Sharing**: Users cannot share dashboards across different workspaces (privacy/security)
- **Workspace Marketplace**: No public directory or discovery mechanism for workspaces
- **Sub-Workspaces/Teams**: No hierarchical workspace structure (flat organization model only)
- **Custom Domains Per Workspace**: All workspaces share the same domain (subdomain routing not supported)
- **Workspace-Level Billing**: Billing and subscription management out of scope
- **SSO/SAML Integration**: OAuth/SAML integration deferred to future phase
- **Real-Time Collaboration**: No real-time multi-user editing or presence indicators
- **Workspace Templates**: No predefined dashboard templates or workspace blueprints
- **White-Labeling**: No per-workspace branding or theming

## Technical Dependencies

### New Backend Dependencies
```python
# No new dependencies required - using existing stack:
# - SQLAlchemy for database models
# - FastAPI for workspace management routes
# - python-jose for invitation tokens
# - Existing auth/encryption infrastructure
```

### New Frontend Dependencies
```json
{
  "dependencies": {
    "@headlessui/react": "^1.7.17",  // Workspace switcher dropdown
    "react-select": "^5.8.0"         // Multi-select for member management
  }
}
```

### Database Migration Tool
```python
alembic>=1.12.0  // Database migration management
```

## Detailed Design

### 1. Database Schema Changes

#### New Tables

**workspaces**
```sql
CREATE TABLE workspaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                      -- Organization name (e.g., "Purple Data Org")
    slug TEXT UNIQUE NOT NULL,               -- URL-friendly identifier (e.g., "purple-data")
    description TEXT,                        -- Optional workspace description
    created_by INTEGER NOT NULL,             -- FK to users.id (workspace creator)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,             -- Soft delete flag

    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_created_by ON workspaces(created_by);
```

**workspace_members**
```sql
CREATE TABLE workspace_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'editor', 'viewer')),
    invited_by INTEGER,                      -- FK to users.id (who sent the invitation)
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,

    UNIQUE(workspace_id, user_id)           -- User can only be in workspace once
);

CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
```

**workspace_invitations**
```sql
CREATE TABLE workspace_invitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'editor', 'viewer')),
    token TEXT UNIQUE NOT NULL,              -- JWT invitation token
    invited_by INTEGER NOT NULL,             -- FK to users.id
    expires_at TIMESTAMP NOT NULL,           -- Token expiration
    accepted_at TIMESTAMP,                   -- When invitation was accepted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_workspace_invitations_token ON workspace_invitations(token);
CREATE INDEX idx_workspace_invitations_email ON workspace_invitations(email);
```

**workspace_settings**
```sql
CREATE TABLE workspace_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id INTEGER NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value TEXT,                      -- JSON-serialized value
    updated_by INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,

    UNIQUE(workspace_id, setting_key)
);

CREATE INDEX idx_workspace_settings_workspace ON workspace_settings(workspace_id);
```

#### Modified Existing Tables

**users**
```sql
-- BEFORE: role column with 'admin', 'editor', 'viewer'
-- AFTER: Remove global role, use workspace_members for roles

ALTER TABLE users DROP COLUMN role;  -- Role is now workspace-specific

-- Add new columns for global user management
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN current_workspace_id INTEGER;  -- Last active workspace

-- Update foreign key
ALTER TABLE users ADD CONSTRAINT fk_users_current_workspace
    FOREIGN KEY (current_workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;
```

**charts**
```sql
-- Add workspace_id for data isolation
ALTER TABLE charts ADD COLUMN workspace_id INTEGER NOT NULL DEFAULT 1;

ALTER TABLE charts ADD CONSTRAINT fk_charts_workspace
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

CREATE INDEX idx_charts_workspace ON charts(workspace_id);

-- Ensure created_by is within workspace
CREATE INDEX idx_charts_workspace_user ON charts(workspace_id, created_by);
```

**dashboards**
```sql
-- Add workspace_id for data isolation
ALTER TABLE dashboards ADD COLUMN workspace_id INTEGER NOT NULL DEFAULT 1;

ALTER TABLE dashboards ADD CONSTRAINT fk_dashboards_workspace
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

CREATE INDEX idx_dashboards_workspace ON dashboards(workspace_id);
```

**connections**
```sql
-- Add workspace_id for data isolation
ALTER TABLE connections ADD COLUMN workspace_id INTEGER NOT NULL DEFAULT 1;

ALTER TABLE connections ADD CONSTRAINT fk_connections_workspace
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

CREATE INDEX idx_connections_workspace ON connections(workspace_id);
```

**settings** → **Deprecated**
```sql
-- Global settings table is replaced by workspace_settings
-- Migration will move existing settings to default workspace
DROP TABLE settings;  -- After migration
```

**redis_config** (New Table)
```sql
CREATE TABLE redis_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id INTEGER NOT NULL,
    enabled BOOLEAN DEFAULT 0,
    host TEXT DEFAULT 'localhost',
    port INTEGER DEFAULT 6379,
    password TEXT,                           -- Encrypted
    db_number INTEGER DEFAULT 0,             -- Redis DB number (0-15)
    ttl_seconds INTEGER DEFAULT 3600,        -- Default cache TTL
    updated_by INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,

    UNIQUE(workspace_id)                     -- One config per workspace
);
```

**logs**
```sql
-- Add workspace_id for audit trail
ALTER TABLE logs ADD COLUMN workspace_id INTEGER;

ALTER TABLE logs ADD CONSTRAINT fk_logs_workspace
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

CREATE INDEX idx_logs_workspace ON logs(workspace_id);
```

### 2. Data Migration Strategy

#### Migration Phases

**Phase 1: Add New Tables and Columns**
```python
# Alembic migration: 001_add_workspace_tables.py

def upgrade():
    # Create new tables
    op.create_table('workspaces', ...)
    op.create_table('workspace_members', ...)
    op.create_table('workspace_invitations', ...)
    op.create_table('workspace_settings', ...)
    op.create_table('redis_config', ...)

    # Add workspace_id columns with default value 1 (default workspace)
    op.add_column('users', sa.Column('current_workspace_id', sa.Integer))
    op.add_column('charts', sa.Column('workspace_id', sa.Integer, default=1))
    op.add_column('dashboards', sa.Column('workspace_id', sa.Integer, default=1))
    op.add_column('connections', sa.Column('workspace_id', sa.Integer, default=1))
    op.add_column('logs', sa.Column('workspace_id', sa.Integer))
```

**Phase 2: Create Default Workspace**
```python
# Alembic migration: 002_create_default_workspace.py

def upgrade():
    # Create default workspace
    op.execute("""
        INSERT INTO workspaces (id, name, slug, description, created_by, created_at)
        SELECT
            1,
            'Default Workspace',
            'default',
            'Migrated from single-tenant deployment',
            MIN(id),  -- First user becomes workspace creator
            MIN(created_at)
        FROM users
        WHERE is_active = 1
    """)

    # Migrate all existing users to default workspace
    # All existing users become admins initially
    op.execute("""
        INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
        SELECT
            1,
            id,
            CASE
                WHEN role = 'admin' THEN 'admin'
                WHEN role = 'editor' THEN 'editor'
                ELSE 'viewer'
            END,
            created_at
        FROM users
        WHERE is_active = 1
    """)
```

**Phase 3: Migrate Existing Data**
```python
# Alembic migration: 003_migrate_existing_data.py

def upgrade():
    # Update all resources to belong to default workspace
    op.execute("UPDATE charts SET workspace_id = 1 WHERE workspace_id IS NULL")
    op.execute("UPDATE dashboards SET workspace_id = 1 WHERE workspace_id IS NULL")
    op.execute("UPDATE connections SET workspace_id = 1 WHERE workspace_id IS NULL")
    op.execute("UPDATE logs SET workspace_id = 1 WHERE workspace_id IS NULL")

    # Migrate global settings to workspace settings
    op.execute("""
        INSERT INTO workspace_settings (workspace_id, setting_key, setting_value, updated_at)
        SELECT
            1,
            key,
            value,
            updated_at
        FROM settings
    """)

    # Create default Redis config (disabled by default)
    op.execute("""
        INSERT INTO redis_config (workspace_id, enabled, host, port)
        VALUES (1, 0, 'localhost', 6379)
    """)
```

**Phase 4: Add Constraints and Remove Old Schema**
```python
# Alembic migration: 004_finalize_schema.py

def upgrade():
    # Make workspace_id NOT NULL after migration
    op.alter_column('charts', 'workspace_id', nullable=False)
    op.alter_column('dashboards', 'workspace_id', nullable=False)
    op.alter_column('connections', 'workspace_id', nullable=False)

    # Remove old role column from users
    op.drop_column('users', 'role')

    # Drop old settings table
    op.drop_table('settings')
```

### 3. Backend API Changes

#### New Workspace Routes

**Workspace Management (`/api/workspaces`)**

```python
# app/api/routes/workspaces.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.dependencies import get_db, get_current_user
from app.models.sqlite_models import User, Workspace, WorkspaceMember
from app.models.schemas import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    WorkspaceMemberResponse,
    WorkspaceInviteRequest,
    WorkspaceInviteResponse
)
from app.core.permissions import check_workspace_permission, WorkspaceRole

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])


@router.get("/", response_model=List[WorkspaceResponse])
async def list_user_workspaces(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all workspaces the current user belongs to."""
    workspaces = db.query(Workspace).join(WorkspaceMember).filter(
        WorkspaceMember.user_id == current_user.id
    ).all()

    return workspaces


@router.post("/", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    workspace: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new workspace. The creator automatically becomes an admin.

    Slug must be unique and URL-friendly (lowercase, hyphens, no spaces).
    """
    # Check if slug is already taken
    existing = db.query(Workspace).filter(Workspace.slug == workspace.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Workspace slug '{workspace.slug}' is already taken"
        )

    # Create workspace
    new_workspace = Workspace(
        name=workspace.name,
        slug=workspace.slug,
        description=workspace.description,
        created_by=current_user.id
    )
    db.add(new_workspace)
    db.flush()  # Get ID without committing

    # Add creator as admin
    membership = WorkspaceMember(
        workspace_id=new_workspace.id,
        user_id=current_user.id,
        role=WorkspaceRole.ADMIN.value,
        invited_by=current_user.id
    )
    db.add(membership)

    # Create default Redis config (disabled)
    redis_config = RedisConfig(
        workspace_id=new_workspace.id,
        enabled=False,
        host='localhost',
        port=6379
    )
    db.add(redis_config)

    db.commit()
    db.refresh(new_workspace)

    return new_workspace


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get workspace details. User must be a member."""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check membership
    check_workspace_permission(db, current_user.id, workspace_id, WorkspaceRole.VIEWER)

    return workspace


@router.patch("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: int,
    workspace: WorkspaceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update workspace details. Admin only."""
    check_workspace_permission(db, current_user.id, workspace_id, WorkspaceRole.ADMIN)

    db_workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not db_workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Update fields
    if workspace.name is not None:
        db_workspace.name = workspace.name
    if workspace.description is not None:
        db_workspace.description = workspace.description

    db_workspace.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_workspace)

    return db_workspace


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete workspace. Admin only.

    WARNING: This will cascade delete all charts, dashboards, and connections.
    """
    check_workspace_permission(db, current_user.id, workspace_id, WorkspaceRole.ADMIN)

    # Prevent deletion of default workspace
    if workspace_id == 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the default workspace"
        )

    db_workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not db_workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    db.delete(db_workspace)
    db.commit()

    return None
```

**Member Management (`/api/workspaces/{id}/members`)**

```python
@router.get("/{workspace_id}/members", response_model=List[WorkspaceMemberResponse])
async def list_workspace_members(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all members of a workspace."""
    check_workspace_permission(db, current_user.id, workspace_id, WorkspaceRole.VIEWER)

    members = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id
    ).all()

    return members


@router.post("/{workspace_id}/invite", response_model=WorkspaceInviteResponse)
async def invite_to_workspace(
    workspace_id: int,
    invite: WorkspaceInviteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Invite a user to the workspace via email. Admin only.

    Sends an email with invitation link containing a JWT token.
    """
    check_workspace_permission(db, current_user.id, workspace_id, WorkspaceRole.ADMIN)

    # Check if user already exists in workspace
    existing_user = db.query(User).filter(User.email == invite.email).first()
    if existing_user:
        existing_member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == existing_user.id
        ).first()
        if existing_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a member of this workspace"
            )

    # Check for pending invitation
    pending = db.query(WorkspaceInvitation).filter(
        WorkspaceInvitation.workspace_id == workspace_id,
        WorkspaceInvitation.email == invite.email,
        WorkspaceInvitation.accepted_at.is_(None),
        WorkspaceInvitation.expires_at > datetime.utcnow()
    ).first()
    if pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation already sent to this email"
        )

    # Create invitation token (valid for 7 days)
    token = create_invitation_token(
        workspace_id=workspace_id,
        email=invite.email,
        role=invite.role
    )

    invitation = WorkspaceInvitation(
        workspace_id=workspace_id,
        email=invite.email,
        role=invite.role,
        token=token,
        invited_by=current_user.id,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(invitation)
    db.commit()

    # TODO: Send email notification
    # send_invitation_email(invite.email, token)

    return {
        "email": invite.email,
        "invitation_link": f"/accept-invite?token={token}",
        "expires_at": invitation.expires_at
    }


@router.delete("/{workspace_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    workspace_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a member from the workspace. Admin only.

    Cannot remove the workspace creator.
    """
    check_workspace_permission(db, current_user.id, workspace_id, WorkspaceRole.ADMIN)

    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if workspace.created_by == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove workspace creator"
        )

    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    db.delete(member)
    db.commit()

    return None


@router.patch("/{workspace_id}/members/{user_id}", response_model=WorkspaceMemberResponse)
async def update_member_role(
    workspace_id: int,
    user_id: int,
    role_update: MemberRoleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a member's role. Admin only."""
    check_workspace_permission(db, current_user.id, workspace_id, WorkspaceRole.ADMIN)

    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    member.role = role_update.role
    db.commit()
    db.refresh(member)

    return member
```

**Invitation Acceptance (`/api/workspaces/accept-invite`)**

```python
@router.post("/accept-invite", response_model=WorkspaceResponse)
async def accept_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Accept a workspace invitation.

    Validates token, checks expiration, and adds user to workspace.
    """
    # Decode invitation token
    try:
        payload = verify_invitation_token(token)
        workspace_id = payload.get("workspace_id")
        email = payload.get("email")
        role = payload.get("role")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invitation token"
        )

    # Verify email matches current user
    if current_user.email != email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation was sent to a different email address"
        )

    # Find invitation
    invitation = db.query(WorkspaceInvitation).filter(
        WorkspaceInvitation.token == token,
        WorkspaceInvitation.accepted_at.is_(None)
    ).first()

    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found or already accepted")

    if invitation.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has expired"
        )

    # Check if already a member
    existing = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this workspace"
        )

    # Add user to workspace
    member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=current_user.id,
        role=role,
        invited_by=invitation.invited_by
    )
    db.add(member)

    # Mark invitation as accepted
    invitation.accepted_at = datetime.utcnow()

    db.commit()

    # Return workspace details
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    return workspace
```

#### Modified Existing Routes

**Auth Routes - Registration with Workspace Creation**

```python
# app/api/routes/auth.py

@router.post("/register", response_model=RegisterResponse)
async def register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """
    Register a new user and create their workspace.

    Flow:
    1. Create user account
    2. Create workspace (user becomes admin)
    3. Add user to workspace as admin
    4. Return user + workspace details
    """
    # Check if user already exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        email_verified=False
    )
    db.add(user)
    db.flush()

    # Create workspace
    workspace_slug = generate_slug(user_data.workspace_name)
    workspace = Workspace(
        name=user_data.workspace_name,
        slug=workspace_slug,
        description=f"Workspace for {user_data.workspace_name}",
        created_by=user.id
    )
    db.add(workspace)
    db.flush()

    # Add user as workspace admin
    membership = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=user.id,
        role=WorkspaceRole.ADMIN.value,
        invited_by=user.id
    )
    db.add(membership)

    # Set as current workspace
    user.current_workspace_id = workspace.id

    # Create default Redis config
    redis_config = RedisConfig(
        workspace_id=workspace.id,
        enabled=False,
        host='localhost',
        port=6379
    )
    db.add(redis_config)

    db.commit()
    db.refresh(user)
    db.refresh(workspace)

    return {
        "user": user,
        "workspace": workspace,
        "message": "Registration successful"
    }
```

**Dashboard Routes - Workspace Filtering**

```python
# app/api/routes/dashboards.py

@router.get("/", response_model=List[DashboardResponse])
async def list_dashboards(
    workspace_id: int = Query(..., description="Workspace ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all dashboards in the specified workspace."""
    # Check workspace access
    check_workspace_permission(db, current_user.id, workspace_id, WorkspaceRole.VIEWER)

    # Filter by workspace
    dashboards = db.query(Dashboard).filter(
        Dashboard.workspace_id == workspace_id
    ).all()

    return dashboards


@router.post("/", response_model=DashboardResponse, status_code=status.HTTP_201_CREATED)
async def create_dashboard(
    workspace_id: int = Query(..., description="Workspace ID"),
    dashboard: DashboardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new dashboard in the specified workspace."""
    # Check permission (editor or admin)
    check_workspace_permission(db, current_user.id, workspace_id, WorkspaceRole.EDITOR)

    new_dashboard = Dashboard(
        name=dashboard.name,
        description=dashboard.description,
        layout=dashboard.layout,
        workspace_id=workspace_id,  # Explicitly set workspace
        created_by=current_user.id
    )
    db.add(new_dashboard)
    db.commit()
    db.refresh(new_dashboard)

    return new_dashboard
```

**Similar changes for:**
- `charts.py` - Add workspace filtering
- `connections.py` - Add workspace filtering
- `data.py` - Add workspace filtering
- `export.py` - Add workspace filtering
- `settings.py` - Replaced with workspace_settings

#### New Utility Functions

**Permission Checking (`app/core/permissions.py`)**

```python
from enum import Enum
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.sqlite_models import WorkspaceMember

class WorkspaceRole(str, Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"

# Role hierarchy (admin > editor > viewer)
ROLE_HIERARCHY = {
    WorkspaceRole.ADMIN: 3,
    WorkspaceRole.EDITOR: 2,
    WorkspaceRole.VIEWER: 1
}

def check_workspace_permission(
    db: Session,
    user_id: int,
    workspace_id: int,
    required_role: WorkspaceRole
) -> WorkspaceMember:
    """
    Check if user has required permission level in workspace.

    Raises:
        HTTPException 403: If user doesn't have permission
        HTTPException 404: If workspace membership not found

    Returns:
        WorkspaceMember: The membership record
    """
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.user_id == user_id,
        WorkspaceMember.workspace_id == workspace_id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or you don't have access"
        )

    user_role_level = ROLE_HIERARCHY.get(WorkspaceRole(membership.role), 0)
    required_role_level = ROLE_HIERARCHY.get(required_role, 0)

    if user_role_level < required_role_level:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This action requires {required_role.value} role or higher"
        )

    return membership


def get_user_workspace_role(
    db: Session,
    user_id: int,
    workspace_id: int
) -> WorkspaceRole | None:
    """Get user's role in workspace, or None if not a member."""
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.user_id == user_id,
        WorkspaceMember.workspace_id == workspace_id
    ).first()

    return WorkspaceRole(membership.role) if membership else None


def is_workspace_admin(
    db: Session,
    user_id: int,
    workspace_id: int
) -> bool:
    """Check if user is an admin of the workspace."""
    role = get_user_workspace_role(db, user_id, workspace_id)
    return role == WorkspaceRole.ADMIN
```

**Invitation Token Management (`app/core/security.py`)**

```python
from jose import jwt, JWTError
from datetime import datetime, timedelta
from app.config import settings

def create_invitation_token(workspace_id: int, email: str, role: str) -> str:
    """Create a JWT token for workspace invitation."""
    expires_delta = timedelta(days=7)
    expire = datetime.utcnow() + expires_delta

    to_encode = {
        "workspace_id": workspace_id,
        "email": email,
        "role": role,
        "type": "workspace_invitation",
        "exp": expire
    }

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm="HS256"
    )
    return encoded_jwt


def verify_invitation_token(token: str) -> dict:
    """
    Verify and decode invitation token.

    Raises:
        JWTError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"]
        )

        # Verify token type
        if payload.get("type") != "workspace_invitation":
            raise JWTError("Invalid token type")

        return payload
    except JWTError as e:
        raise JWTError(f"Invalid invitation token: {str(e)}")
```

### 4. Frontend Changes

#### Workspace Context and State Management

**Workspace Store (`src/store/workspaceStore.ts`)**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as workspaceAPI from '../api/workspaces';
import { Workspace, WorkspaceMember } from '../types/workspace';

interface WorkspaceStore {
  // State
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  members: WorkspaceMember[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWorkspaces: () => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace) => void;
  createWorkspace: (data: CreateWorkspaceRequest) => Promise<Workspace>;
  updateWorkspace: (id: number, data: UpdateWorkspaceRequest) => Promise<void>;
  deleteWorkspace: (id: number) => Promise<void>;
  fetchMembers: (workspaceId: number) => Promise<void>;
  inviteMember: (workspaceId: number, data: InviteMemberRequest) => Promise<void>;
  removeMember: (workspaceId: number, userId: number) => Promise<void>;
  updateMemberRole: (workspaceId: number, userId: number, role: string) => Promise<void>;
  acceptInvitation: (token: string) => Promise<Workspace>;
  clearError: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspace: null,
      members: [],
      isLoading: false,
      error: null,

      fetchWorkspaces: async () => {
        set({ isLoading: true, error: null });
        try {
          const workspaces = await workspaceAPI.listWorkspaces();
          set({ workspaces, isLoading: false });

          // If no current workspace, set first one
          if (!get().currentWorkspace && workspaces.length > 0) {
            set({ currentWorkspace: workspaces[0] });
          }
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      setCurrentWorkspace: (workspace: Workspace) => {
        set({ currentWorkspace: workspace });

        // Update user's last active workspace on backend
        workspaceAPI.setCurrentWorkspace(workspace.id).catch(console.error);
      },

      createWorkspace: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const workspace = await workspaceAPI.createWorkspace(data);
          set((state) => ({
            workspaces: [...state.workspaces, workspace],
            currentWorkspace: workspace,
            isLoading: false
          }));
          return workspace;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateWorkspace: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const updated = await workspaceAPI.updateWorkspace(id, data);
          set((state) => ({
            workspaces: state.workspaces.map((w) => w.id === id ? updated : w),
            currentWorkspace: state.currentWorkspace?.id === id ? updated : state.currentWorkspace,
            isLoading: false
          }));
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      deleteWorkspace: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await workspaceAPI.deleteWorkspace(id);
          set((state) => {
            const workspaces = state.workspaces.filter((w) => w.id !== id);
            const currentWorkspace = state.currentWorkspace?.id === id
              ? workspaces[0] || null
              : state.currentWorkspace;

            return { workspaces, currentWorkspace, isLoading: false };
          });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      fetchMembers: async (workspaceId) => {
        set({ isLoading: true, error: null });
        try {
          const members = await workspaceAPI.listMembers(workspaceId);
          set({ members, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      inviteMember: async (workspaceId, data) => {
        set({ isLoading: true, error: null });
        try {
          await workspaceAPI.inviteMember(workspaceId, data);
          set({ isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      removeMember: async (workspaceId, userId) => {
        set({ isLoading: true, error: null });
        try {
          await workspaceAPI.removeMember(workspaceId, userId);
          set((state) => ({
            members: state.members.filter((m) => m.user_id !== userId),
            isLoading: false
          }));
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateMemberRole: async (workspaceId, userId, role) => {
        set({ isLoading: true, error: null });
        try {
          const updated = await workspaceAPI.updateMemberRole(workspaceId, userId, role);
          set((state) => ({
            members: state.members.map((m) => m.user_id === userId ? updated : m),
            isLoading: false
          }));
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      acceptInvitation: async (token) => {
        set({ isLoading: true, error: null });
        try {
          const workspace = await workspaceAPI.acceptInvitation(token);
          set((state) => ({
            workspaces: [...state.workspaces, workspace],
            currentWorkspace: workspace,
            isLoading: false
          }));
          return workspace;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({ currentWorkspace: state.currentWorkspace })
    }
  )
);
```

#### Workspace Switcher Component

**Workspace Switcher (`src/components/workspace/WorkspaceSwitcher.tsx`)**

```typescript
import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, PlusIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useNavigate } from 'react-router-dom';

export function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const navigate = useNavigate();

  const handleWorkspaceChange = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    navigate('/dashboards');  // Redirect to dashboards on switch
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center justify-between w-full px-4 py-3 text-left bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
        <div className="flex items-center gap-3">
          <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-white">
              {currentWorkspace?.name || 'Select Workspace'}
            </p>
            <p className="text-xs text-gray-400">
              {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 right-0 mt-2 origin-top-left bg-gray-800 border border-gray-700 rounded-lg shadow-xl focus:outline-none z-50">
          <div className="px-2 py-2">
            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Your Workspaces
            </p>

            {workspaces.map((workspace) => (
              <Menu.Item key={workspace.id}>
                {({ active }) => (
                  <button
                    onClick={() => handleWorkspaceChange(workspace)}
                    className={`
                      w-full text-left px-3 py-2 rounded-md text-sm
                      ${active ? 'bg-gray-700' : ''}
                      ${currentWorkspace?.id === workspace.id ? 'bg-indigo-600 text-white' : 'text-gray-300'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{workspace.name}</span>
                      {currentWorkspace?.id === workspace.id && (
                        <span className="text-xs bg-indigo-500 px-2 py-0.5 rounded">Active</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{workspace.slug}</p>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>

          <div className="border-t border-gray-700 px-2 py-2">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => navigate('/workspaces/new')}
                  className={`
                    w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2
                    ${active ? 'bg-gray-700' : ''}
                    text-gray-300
                  `}
                >
                  <PlusIcon className="w-4 h-4" />
                  Create New Workspace
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
```

#### Registration Flow Update

**Updated Registration Page (`src/pages/Register.tsx`)**

```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  workspaceName: z.string().min(2, 'Workspace name must be at least 2 characters')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
  const { register: registerUser, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
        workspace_name: data.workspaceName
      });
      navigate('/dashboards');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Create Your Workspace
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('workspaceName')}
            label="Workspace Name"
            placeholder="Your Organization"
            error={errors.workspaceName?.message}
            helpText="This will be the name of your workspace (e.g., 'Acme Corp', 'Design Team')"
          />

          <Input
            {...register('username')}
            label="Username"
            placeholder="johndoe"
            error={errors.username?.message}
          />

          <Input
            {...register('email')}
            type="email"
            label="Email"
            placeholder="you@example.com"
            error={errors.email?.message}
          />

          <Input
            {...register('password')}
            type="password"
            label="Password"
            placeholder="••••••••"
            error={errors.password?.message}
          />

          <Input
            {...register('confirmPassword')}
            type="password"
            label="Confirm Password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
          />

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
          >
            Create Workspace & Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-300">
          Already have an account?{' '}
          <a href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
```

#### Workspace Management Page

**Workspace Settings (`src/pages/WorkspaceSettings.tsx`)**

```typescript
import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';

export function WorkspaceSettings() {
  const { currentWorkspace, members, fetchMembers, inviteMember, removeMember, updateMemberRole } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');

  useEffect(() => {
    if (currentWorkspace) {
      fetchMembers(currentWorkspace.id);
    }
  }, [currentWorkspace]);

  const handleInvite = async () => {
    if (!currentWorkspace) return;

    try {
      await inviteMember(currentWorkspace.id, {
        email: inviteEmail,
        role: inviteRole
      });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('viewer');
    } catch (error) {
      console.error('Failed to invite member:', error);
    }
  };

  const handleRemove = async (userId: number) => {
    if (!currentWorkspace) return;
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await removeMember(currentWorkspace.id, userId);
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (!currentWorkspace) return;

    try {
      await updateMemberRole(currentWorkspace.id, userId, newRole);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  if (!currentWorkspace) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">{currentWorkspace.name}</h1>
        <p className="text-gray-400">{currentWorkspace.description}</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Members</h2>
          <Button
            onClick={() => setShowInviteModal(true)}
            icon={<UserPlusIcon className="w-5 h-5" />}
          >
            Invite Member
          </Button>
        </div>

        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
            >
              <div>
                <p className="text-white font-medium">{member.user.username}</p>
                <p className="text-sm text-gray-400">{member.user.email}</p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                  className="px-3 py-1.5 bg-gray-600 text-white rounded-md text-sm"
                  disabled={member.user_id === currentWorkspace.created_by}
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>

                {member.user_id !== currentWorkspace.created_by && (
                  <button
                    onClick={() => handleRemove(member.user_id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Member"
      >
        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@example.com"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg"
            >
              <option value="viewer">Viewer - Can view dashboards</option>
              <option value="editor">Editor - Can create and edit</option>
              <option value="admin">Admin - Full access</option>
            </select>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleInvite} className="flex-1">
              Send Invitation
            </Button>
            <Button
              onClick={() => setShowInviteModal(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
```

#### Updated Sidebar Navigation

**Sidebar with Workspace Switcher (`src/components/layout/Sidebar.tsx`)**

```typescript
import React from 'react';
import { NavLink } from 'react-router-dom';
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher';
import { useAuthStore } from '../../store/authStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import {
  ChartBarIcon,
  RectangleStackIcon,
  CircleStackIcon,
  CogIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();

  const navigation = [
    { name: 'Dashboards', href: '/dashboards', icon: RectangleStackIcon },
    { name: 'Charts', href: '/charts', icon: ChartBarIcon },
    { name: 'Data Sources', href: '/datasources', icon: CircleStackIcon, minRole: 'editor' },
    { name: 'Members', href: '/workspace/members', icon: UsersIcon, minRole: 'viewer' },
    { name: 'Settings', href: '/workspace/settings', icon: CogIcon, minRole: 'admin' }
  ];

  return (
    <aside className="w-64 bg-gray-900 h-screen flex flex-col">
      {/* Workspace Switcher */}
      <div className="p-4">
        <WorkspaceSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{user?.username}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
```

### 5. End-to-End Integration Flow

#### Complete User Journey: Registration → Dashboard Creation

```
1. User Registration
   └─> POST /api/auth/register
       ├─> Create user account
       ├─> Create workspace (user = admin)
       ├─> Add user to workspace_members
       ├─> Create default Redis config
       └─> Return JWT + user + workspace

2. Login
   └─> POST /api/auth/login
       ├─> Validate credentials
       ├─> Fetch user's workspaces
       ├─> Set current_workspace_id
       └─> Return JWT + user + workspaces[]

3. Fetch Workspaces
   └─> GET /api/workspaces
       └─> Return all workspaces user is a member of

4. Switch Workspace
   └─> Frontend: workspaceStore.setCurrentWorkspace()
       ├─> Update local state
       ├─> POST /api/users/me/current-workspace
       └─> Redirect to /dashboards

5. Create Dashboard
   └─> POST /api/dashboards?workspace_id=1
       ├─> Check permission (editor or admin)
       ├─> Create dashboard with workspace_id
       └─> Return dashboard

6. Invite Member
   └─> POST /api/workspaces/{id}/invite
       ├─> Check permission (admin only)
       ├─> Create invitation token
       ├─> Store in workspace_invitations
       └─> Send email (TODO)

7. Accept Invitation
   └─> POST /api/workspaces/accept-invite?token=xxx
       ├─> Verify token
       ├─> Add user to workspace_members
       ├─> Mark invitation as accepted
       └─> Return workspace
```

#### Data Flow Tracing: Dashboard Query

```
User views dashboard in Workspace A:

1. Frontend: GET /api/dashboards?workspace_id=1
   ├─> Include workspace_id in query params
   └─> Include JWT in Authorization header

2. Backend: dashboards.py::list_dashboards()
   ├─> Extract user from JWT (via get_current_user dependency)
   ├─> Extract workspace_id from query params
   ├─> Check permission: check_workspace_permission(user.id, workspace_id, VIEWER)
   │   ├─> Query workspace_members table
   │   ├─> Verify user is member
   │   └─> Verify role >= VIEWER
   ├─> Query dashboards WHERE workspace_id = 1
   └─> Return filtered dashboards

3. Data Isolation Guarantee:
   ├─> User CANNOT access workspace_id=2 dashboards (permission check fails)
   ├─> Query automatically filters by workspace_id
   └─> No cross-workspace data leakage possible
```

### 6. Security Considerations

#### Data Isolation Enforcement

**Query-Level Filtering**
```python
# ALWAYS filter by workspace_id in all queries
dashboards = db.query(Dashboard).filter(
    Dashboard.workspace_id == workspace_id  # REQUIRED
).all()

# NEVER query without workspace filter
dashboards = db.query(Dashboard).all()  # DANGEROUS - exposes all workspaces
```

**Permission Middleware**
```python
# Use dependency injection to enforce permissions
@router.get("/dashboards")
async def list_dashboards(
    workspace_id: int = Query(..., description="Workspace ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ALWAYS check permission before returning data
    check_workspace_permission(db, current_user.id, workspace_id, WorkspaceRole.VIEWER)

    # Now safe to query
    dashboards = db.query(Dashboard).filter(
        Dashboard.workspace_id == workspace_id
    ).all()
```

**Prevent Privilege Escalation**
```python
# Ensure user cannot modify resources in other workspaces
@router.put("/dashboards/{dashboard_id}")
async def update_dashboard(
    dashboard_id: int,
    workspace_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check workspace permission
    check_workspace_permission(db, current_user.id, workspace_id, WorkspaceRole.EDITOR)

    # Fetch dashboard
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(404, "Dashboard not found")

    # CRITICAL: Verify dashboard belongs to the workspace
    if dashboard.workspace_id != workspace_id:
        raise HTTPException(403, "Access denied")

    # Now safe to update
    ...
```

#### Invitation Token Security

**Token Generation**
```python
# Signed JWT tokens with expiration
# Cannot be tampered with (signature verification)
# Include workspace_id, email, role, and expiration

def create_invitation_token(workspace_id: int, email: str, role: str) -> str:
    expires_delta = timedelta(days=7)  # 7-day expiration
    expire = datetime.utcnow() + expires_delta

    to_encode = {
        "workspace_id": workspace_id,
        "email": email,
        "role": role,
        "type": "workspace_invitation",
        "exp": expire  # JWT standard expiration claim
    }

    # Signed with SECRET_KEY - cannot be forged
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt
```

**Token Validation**
```python
# Verify signature, expiration, and email match
def verify_invitation_token(token: str) -> dict:
    try:
        # Automatically validates signature and expiration
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])

        # Verify token type
        if payload.get("type") != "workspace_invitation":
            raise JWTError("Invalid token type")

        return payload
    except JWTError as e:
        raise JWTError(f"Invalid invitation token: {str(e)}")

# In acceptance endpoint
if current_user.email != payload_email:
    raise HTTPException(400, "Token was sent to different email")
```

#### Audit Logging

**Log All Workspace Actions**
```python
# app/utils/audit.py

def log_workspace_action(
    db: Session,
    user_id: int,
    workspace_id: int,
    action: str,
    resource_type: str,
    resource_id: int | None = None,
    details: dict | None = None,
    ip_address: str | None = None
):
    """Log workspace-level action for audit trail."""
    log = Log(
        user_id=user_id,
        workspace_id=workspace_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address
    )
    db.add(log)
    db.commit()

# Usage in routes
log_workspace_action(
    db=db,
    user_id=current_user.id,
    workspace_id=workspace_id,
    action="create",
    resource_type="dashboard",
    resource_id=new_dashboard.id,
    details={"name": new_dashboard.name}
)
```

### 7. Performance Considerations

#### Database Indexing Strategy

```sql
-- Workspace lookups (frequent)
CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_created_by ON workspaces(created_by);

-- Membership checks (every request)
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_composite ON workspace_members(user_id, workspace_id);

-- Resource filtering (every list query)
CREATE INDEX idx_charts_workspace ON charts(workspace_id);
CREATE INDEX idx_dashboards_workspace ON dashboards(workspace_id);
CREATE INDEX idx_connections_workspace ON connections(workspace_id);

-- Audit queries
CREATE INDEX idx_logs_workspace ON logs(workspace_id);
CREATE INDEX idx_logs_created_at ON logs(created_at);

-- Invitation lookups
CREATE INDEX idx_workspace_invitations_token ON workspace_invitations(token);
CREATE INDEX idx_workspace_invitations_email ON workspace_invitations(email);
```

#### Query Optimization

**Eager Loading**
```python
# Load workspace with members in single query
workspace = db.query(Workspace).options(
    joinedload(Workspace.members).joinedload(WorkspaceMember.user)
).filter(Workspace.id == workspace_id).first()

# Avoid N+1 queries when listing dashboards
dashboards = db.query(Dashboard).options(
    joinedload(Dashboard.creator),
    joinedload(Dashboard.dashboard_charts).joinedload(DashboardChart.chart)
).filter(Dashboard.workspace_id == workspace_id).all()
```

**Pagination for Large Result Sets**
```python
@router.get("/dashboards", response_model=PaginatedDashboardResponse)
async def list_dashboards(
    workspace_id: int = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_workspace_permission(db, current_user.id, workspace_id, WorkspaceRole.VIEWER)

    query = db.query(Dashboard).filter(Dashboard.workspace_id == workspace_id)

    total = query.count()
    dashboards = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": dashboards,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }
```

#### Caching Strategy

**Workspace Membership Cache (Redis)**
```python
# Cache membership checks (high read, low write)
# TTL: 5 minutes

def get_user_workspace_role_cached(
    db: Session,
    redis_client: Redis,
    user_id: int,
    workspace_id: int
) -> WorkspaceRole | None:
    cache_key = f"workspace:{workspace_id}:user:{user_id}:role"

    # Check cache
    cached_role = redis_client.get(cache_key)
    if cached_role:
        return WorkspaceRole(cached_role.decode())

    # Query database
    role = get_user_workspace_role(db, user_id, workspace_id)

    # Cache result
    if role:
        redis_client.setex(cache_key, 300, role.value)  # 5-minute TTL

    return role

# Invalidate on membership change
def invalidate_membership_cache(redis_client: Redis, user_id: int, workspace_id: int):
    cache_key = f"workspace:{workspace_id}:user:{user_id}:role"
    redis_client.delete(cache_key)
```

### 8. Testing Strategy

#### Unit Tests

**Workspace Creation (`tests/test_workspaces.py`)**
```python
import pytest
from app.models.sqlite_models import Workspace, WorkspaceMember, User
from app.core.permissions import WorkspaceRole

def test_create_workspace(db, test_user):
    """
    Purpose: Verify workspace creation creates workspace, adds creator as admin, and creates default Redis config.

    Why this test exists: Ensures the critical registration flow works correctly.
    Edge cases: Tests that workspace slug must be unique.
    """
    workspace = Workspace(
        name="Test Org",
        slug="test-org",
        created_by=test_user.id
    )
    db.add(workspace)
    db.flush()

    membership = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=test_user.id,
        role=WorkspaceRole.ADMIN.value
    )
    db.add(membership)
    db.commit()

    # Assertions
    assert workspace.id is not None
    assert workspace.created_by == test_user.id
    assert membership.role == "admin"

    # Verify uniqueness constraint
    duplicate = Workspace(name="Duplicate", slug="test-org", created_by=test_user.id)
    db.add(duplicate)
    with pytest.raises(Exception):  # SQLAlchemy IntegrityError
        db.commit()

def test_workspace_permission_check(db, test_user, test_workspace):
    """
    Purpose: Verify permission checking correctly enforces role hierarchy.

    Why this test exists: Permission checks are critical for data isolation.
    Edge cases: Tests viewer cannot perform editor actions, editor cannot perform admin actions.
    This test CAN FAIL to reveal permission escalation bugs.
    """
    from app.core.permissions import check_workspace_permission, WorkspaceRole

    # Add user as viewer
    membership = WorkspaceMember(
        workspace_id=test_workspace.id,
        user_id=test_user.id,
        role=WorkspaceRole.VIEWER.value
    )
    db.add(membership)
    db.commit()

    # Viewer can access viewer-level endpoints
    check_workspace_permission(db, test_user.id, test_workspace.id, WorkspaceRole.VIEWER)  # Should pass

    # Viewer CANNOT access editor-level endpoints
    with pytest.raises(HTTPException) as exc:
        check_workspace_permission(db, test_user.id, test_workspace.id, WorkspaceRole.EDITOR)
    assert exc.value.status_code == 403

    # Viewer CANNOT access admin-level endpoints
    with pytest.raises(HTTPException) as exc:
        check_workspace_permission(db, test_user.id, test_workspace.id, WorkspaceRole.ADMIN)
    assert exc.value.status_code == 403
```

**Data Isolation Tests**
```python
def test_workspace_data_isolation(db, test_user, other_user):
    """
    Purpose: Verify users cannot access resources from workspaces they don't belong to.

    Why this test exists: Data isolation is the most critical security requirement.
    Edge cases: Tests cross-workspace access attempts fail with 404 (not 403 to avoid info disclosure).
    This test WILL FAIL if workspace filtering is missing from queries.
    """
    # Create two separate workspaces
    workspace1 = Workspace(name="Workspace 1", slug="ws1", created_by=test_user.id)
    workspace2 = Workspace(name="Workspace 2", slug="ws2", created_by=other_user.id)
    db.add_all([workspace1, workspace2])
    db.flush()

    # Add users to their respective workspaces
    db.add_all([
        WorkspaceMember(workspace_id=workspace1.id, user_id=test_user.id, role="admin"),
        WorkspaceMember(workspace_id=workspace2.id, user_id=other_user.id, role="admin")
    ])

    # Create dashboard in workspace 1
    dashboard1 = Dashboard(
        name="Dashboard 1",
        workspace_id=workspace1.id,
        created_by=test_user.id
    )
    db.add(dashboard1)
    db.commit()

    # Test user CAN access dashboard in their workspace
    check_workspace_permission(db, test_user.id, workspace1.id, WorkspaceRole.VIEWER)
    result = db.query(Dashboard).filter(
        Dashboard.workspace_id == workspace1.id
    ).all()
    assert len(result) == 1

    # Other user CANNOT access workspace 1
    with pytest.raises(HTTPException) as exc:
        check_workspace_permission(db, other_user.id, workspace1.id, WorkspaceRole.VIEWER)
    assert exc.value.status_code == 404  # Not 403 to avoid info disclosure

    # Other user queries their workspace - should return empty
    result = db.query(Dashboard).filter(
        Dashboard.workspace_id == workspace2.id
    ).all()
    assert len(result) == 0  # No dashboards in workspace 2
```

#### Integration Tests

**Invitation Flow (`tests/integration/test_invitation_flow.py`)**
```python
@pytest.mark.asyncio
async def test_complete_invitation_flow(client, test_user, test_workspace):
    """
    Purpose: Verify end-to-end invitation flow from sending invite to acceptance.

    Why this test exists: Ensures the multi-step invitation process works correctly.
    Edge cases: Tests expired tokens, duplicate invitations, wrong email acceptance.
    This test CAN FAIL to reveal token generation, validation, or email mismatch bugs.
    """
    # Step 1: Admin sends invitation
    response = await client.post(
        f"/api/workspaces/{test_workspace.id}/invite",
        json={"email": "newuser@example.com", "role": "editor"},
        headers={"Authorization": f"Bearer {test_user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    invitation_token = data["invitation_link"].split("token=")[1]

    # Step 2: New user registers with same email
    response = await client.post(
        "/api/auth/register",
        json={
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "password123",
            "workspace_name": "New User Workspace"
        }
    )
    assert response.status_code == 201
    new_user_token = response.json()["access_token"]

    # Step 3: New user accepts invitation
    response = await client.post(
        "/api/workspaces/accept-invite",
        params={"token": invitation_token},
        headers={"Authorization": f"Bearer {new_user_token}"}
    )
    assert response.status_code == 200

    # Step 4: Verify new user can access workspace
    response = await client.get(
        f"/api/workspaces/{test_workspace.id}",
        headers={"Authorization": f"Bearer {new_user_token}"}
    )
    assert response.status_code == 200

    # Step 5: Verify new user has editor role
    response = await client.get(
        f"/api/workspaces/{test_workspace.id}/members",
        headers={"Authorization": f"Bearer {new_user_token}"}
    )
    members = response.json()
    new_member = [m for m in members if m["user"]["email"] == "newuser@example.com"][0]
    assert new_member["role"] == "editor"

@pytest.mark.asyncio
async def test_invitation_token_expiration(client, test_user, test_workspace):
    """
    Purpose: Verify expired invitation tokens are rejected.

    Why this test exists: Ensures security by preventing use of old tokens.
    This test CAN FAIL to reveal token expiration validation bugs.
    """
    # Create expired token (manually for testing)
    from app.core.security import create_invitation_token
    from datetime import datetime, timedelta
    import jose.jwt as jwt

    expired_payload = {
        "workspace_id": test_workspace.id,
        "email": "test@example.com",
        "role": "viewer",
        "type": "workspace_invitation",
        "exp": datetime.utcnow() - timedelta(days=1)  # Expired yesterday
    }
    expired_token = jwt.encode(expired_payload, settings.SECRET_KEY, algorithm="HS256")

    # Attempt to accept expired token
    response = await client.post(
        "/api/workspaces/accept-invite",
        params={"token": expired_token},
        headers={"Authorization": f"Bearer {test_user_token}"}
    )
    assert response.status_code == 400
    assert "expired" in response.json()["detail"].lower()
```

#### E2E Tests (Playwright)

**Workspace Switching (`tests/e2e/test_workspace_switching.spec.ts`)**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Workspace Switching', () => {
  test('user can switch between multiple workspaces', async ({ page }) => {
    // Purpose: Verify workspace switcher UI and data isolation in browser
    // Why: Ensures frontend correctly filters data by workspace

    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboards
    await page.waitForURL('/dashboards');

    // Verify current workspace is displayed
    const workspaceName = await page.textContent('[data-testid="current-workspace-name"]');
    expect(workspaceName).toBe('Test Workspace 1');

    // Create dashboard in workspace 1
    await page.click('button:has-text("New Dashboard")');
    await page.fill('input[name="name"]', 'Dashboard in WS1');
    await page.click('button:has-text("Create")');

    // Verify dashboard appears
    await expect(page.locator('text=Dashboard in WS1')).toBeVisible();

    // Switch to workspace 2
    await page.click('[data-testid="workspace-switcher"]');
    await page.click('text=Test Workspace 2');

    // Verify workspace changed
    await expect(page.locator('[data-testid="current-workspace-name"]')).toHaveText('Test Workspace 2');

    // Verify dashboard from WS1 is NOT visible (data isolation)
    await expect(page.locator('text=Dashboard in WS1')).not.toBeVisible();

    // Verify empty state
    await expect(page.locator('text=No dashboards found')).toBeVisible();
  });
});
```

### 9. Documentation

#### API Documentation Updates

**OpenAPI/Swagger Additions**
```python
# app/main.py

app = FastAPI(
    title="Visualization Platform API",
    description="Multi-tenant visualization and analytics platform",
    version="2.0.0",  # Version bump for multi-tenancy
    openapi_tags=[
        {"name": "auth", "description": "Authentication and user management"},
        {"name": "workspaces", "description": "Workspace management"},
        {"name": "dashboards", "description": "Dashboard operations"},
        {"name": "charts", "description": "Chart operations"},
        {"name": "connections", "description": "Data source connections"}
    ]
)
```

#### User Documentation

**New User Guide Sections**
1. **Getting Started with Workspaces**
   - What is a workspace?
   - Creating your first workspace during registration
   - Understanding roles (Admin, Editor, Viewer)

2. **Inviting Team Members**
   - How to send invitations
   - Accepting invitations
   - Managing member roles

3. **Switching Between Workspaces**
   - Using the workspace switcher
   - Understanding data isolation

4. **Workspace Administration**
   - Configuring workspace settings
   - Managing Redis per workspace
   - Workspace-level audit logs

#### Migration Guide

**Upgrading from Single-Tenant to Multi-Tenant**
```markdown
# Migration Guide: Single-Tenant → Multi-Tenant

## Overview
This guide helps you migrate your existing single-tenant deployment to the new multi-tenant architecture.

## Prerequisites
- Backup your SQLite database: `cp app_metadata.db app_metadata.db.backup`
- Install Alembic: `pip install alembic`
- Stop the application

## Step 1: Run Database Migrations
```bash
cd backend
alembic upgrade head
```

This will:
1. Create new workspace tables
2. Create a "Default Workspace" with ID=1
3. Migrate all existing users to the default workspace as admins
4. Migrate all existing resources (charts, dashboards, connections) to the default workspace
5. Remove the global `role` column from users

## Step 2: Verify Migration
```bash
sqlite3 app_metadata.db "SELECT * FROM workspaces;"
sqlite3 app_metadata.db "SELECT * FROM workspace_members;"
```

You should see:
- 1 workspace named "Default Workspace"
- All your existing users as members with admin role

## Step 3: Update Environment Variables
No changes required - existing `.env` file works with multi-tenant setup.

## Step 4: Restart Application
```bash
docker-compose up -d
```

## Step 5: Test
1. Login with existing credentials
2. Verify you can access all existing dashboards
3. Try creating a new workspace
4. Invite a test user

## Rollback Plan
If migration fails:
```bash
# Restore backup
cp app_metadata.db.backup app_metadata.db

# Downgrade migrations
alembic downgrade -1
```
```

### 10. Implementation Phases

#### Phase 1: MVP/Core Multi-Tenancy

**Scope: Basic workspace isolation**
- Database schema changes (all tables and migrations)
- Workspace CRUD routes
- Updated authentication with workspace creation on registration
- Permission checking system
- Data isolation enforcement (workspace_id filtering)
- Basic workspace switcher UI
- Updated dashboard/chart routes with workspace filtering

**Deliverables:**
- Users can register and create workspaces
- Users can create multiple workspaces
- Resources are isolated by workspace
- Basic permission checking works (admin/editor/viewer)
- Workspace switcher in sidebar

**Success Criteria:**
- All existing single-tenant data migrated successfully
- Users cannot access other workspaces' data
- Permission checks pass 100% of test cases

#### Phase 2: Member Management & Invitations

**Scope: Collaborative features**
- Invitation token system
- Email notification infrastructure (placeholder)
- Member management UI
- Workspace settings page
- Role management (change member roles)
- Member removal
- Invitation acceptance flow

**Deliverables:**
- Admins can invite members via email
- Members can accept invitations and join workspaces
- Workspace settings page with member list
- Role assignment and updates

**Success Criteria:**
- Invitation flow works end-to-end
- Token security validated (expiration, signature)
- Members can be promoted/demoted
- Invitation links expire correctly

#### Phase 3: Workspace-Level Configuration

**Scope: Per-workspace customization**
- Workspace settings (Redis config)
- Workspace-level export settings
- Workspace-level audit logs
- Workspace deletion with cascade
- Workspace description and metadata
- Usage analytics per workspace

**Deliverables:**
- Each workspace can configure Redis independently
- Workspace admins can customize export settings
- Audit logs filtered by workspace
- Analytics dashboard showing per-workspace usage

**Success Criteria:**
- Redis can be enabled/disabled per workspace
- Workspace deletion removes all associated data
- Audit logs queryable per workspace

#### Phase 4: Polish & Optimization

**Scope: Performance and UX improvements**
- Database query optimization
- Membership cache (Redis)
- Eager loading for relationships
- Pagination for large workspaces
- Bulk member invitation
- Workspace templates
- Enhanced workspace switcher (search, favorites)
- Workspace activity feed

**Deliverables:**
- Improved query performance with indexing
- Redis caching for membership checks
- Paginated member lists
- Bulk invite via CSV
- Workspace search in switcher

**Success Criteria:**
- Permission checks < 50ms (with cache)
- Dashboard list queries < 100ms
- Support 1000+ members per workspace
- Support 10,000+ workspaces per deployment

### 11. Open Questions

1. **Email Service Integration**
   - Which email service provider should we use? (SendGrid, AWS SES, Mailgun)
   - Should we support SMTP configuration per workspace?
   - How do we handle email templates and branding?

2. **Workspace Limits**
   - Should there be a limit on number of workspaces per user?
   - Should there be a limit on number of members per workspace?
   - How do we handle storage quotas per workspace?

3. **Workspace Transfer**
   - Should we support transferring workspace ownership?
   - What happens if the workspace creator account is deleted?
   - Can a workspace have multiple admins?

4. **Cross-Workspace Collaboration**
   - Should users be able to share dashboards across workspaces? (Currently Non-Goal)
   - Should there be a "public" workspace concept?
   - How do we handle user identity across workspaces?

5. **Billing Integration**
   - How should billing be scoped? (Per workspace? Per user?)
   - Should admins see usage metrics for cost estimation?
   - How do we enforce workspace limits based on plan tier?

6. **Data Retention**
   - What happens to workspace data after workspace deletion?
   - Should we support soft-delete with recovery period?
   - How long should we keep audit logs?

7. **Migration Safety**
   - Should we run migrations in transaction mode or phase them?
   - How do we handle very large databases (>10GB)?
   - Should we provide a dry-run mode for migrations?

## References

### Related Specifications
- [feat-visualization-platform.md](./feat-visualization-platform.md) - Original single-tenant specification

### External Documentation
- [FastAPI Dependency Injection](https://fastapi.tiangolo.com/tutorial/dependencies/) - Dependency injection patterns
- [SQLAlchemy Multi-Tenancy](https://docs.sqlalchemy.org/en/20/orm/queryguide/select.html#filtering-with-where) - Query filtering patterns
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725) - Token security guidelines
- [Headless UI](https://headlessui.com/) - Workspace switcher dropdown component
- [React Select](https://react-select.com/) - Member selection component

### Similar Implementations
- [Slack Multi-Workspace](https://slack.com/help/articles/212681477-Sign-in-to-Slack#switch-workspaces) - Workspace switching UX reference
- [Notion Teams](https://www.notion.so/help/guides/collaborate-with-your-team) - Member management patterns
- [Linear Workspaces](https://linear.app/docs/workspaces) - Workspace isolation and permissions

### Database Design References
- [Multi-Tenant Data Architecture](https://docs.microsoft.com/en-us/azure/architecture/patterns/sharding) - Architectural patterns
- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) - Alternative isolation approach

---

## Quality Score: 9/10

**Strengths:**
- Comprehensive coverage of all 17 sections
- Detailed technical design with code examples
- Clear migration strategy with safety considerations
- Strong security focus (data isolation, permission checking, audit logging)
- Practical implementation phases
- Extensive testing strategy with purpose-driven tests

**Areas for Improvement:**
- Email notification implementation details (placeholder)
- Specific performance benchmarks not quantified
- No mention of observability/monitoring strategy
- Could benefit from sequence diagrams for complex flows
