"""
Connection-level permission system for fine-grained access control.
Allows workspace admins to grant specific users access to connections.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from typing import Optional
from app.models.sqlite_models import Connection, ConnectionPermission, User, WorkspaceMember
from app.core.permissions import get_user_role, ROLE_HIERARCHY


def get_user_connection_permission(
    db: Session,
    user_id: int,
    connection_id: int
) -> Optional[str]:
    """
    Get user's permission level for a specific connection.

    Returns:
        - Permission level ('owner', 'editor', 'viewer') if user has explicit permission
        - None if user has no permission

    Note: This function ONLY checks explicit connection permissions.
    Workspace-level permissions should be checked separately.
    """
    permission = db.query(ConnectionPermission).filter(
        ConnectionPermission.connection_id == connection_id,
        ConnectionPermission.user_id == user_id
    ).first()

    return permission.permission_level if permission else None


def check_connection_access(
    db: Session,
    user_id: int,
    connection_id: int,
    required_permission: str = 'viewer'
) -> bool:
    """
    Check if user can access a connection with the required permission level.

    Access is granted if ANY of these conditions are met:
    1. User has explicit connection permission at required level or higher
    2. User is workspace admin (full access to all workspace resources)
    3. User created the connection (automatic owner permission)

    Args:
        db: Database session
        user_id: User ID to check
        connection_id: Connection ID to check
        required_permission: Required permission level ('owner', 'editor', 'viewer')

    Returns:
        True if user has access, False otherwise
    """
    # Get connection to check workspace and creator
    connection = db.query(Connection).filter(Connection.id == connection_id).first()
    if not connection:
        return False

    # Check if user created the connection (automatic owner permission)
    if connection.created_by == user_id:
        return True

    # Check workspace role (workspace admins have full access)
    workspace_role = get_user_role(db, user_id, connection.workspace_id)
    if workspace_role == 'admin':
        return True

    # Check explicit connection permission
    conn_permission = get_user_connection_permission(db, user_id, connection_id)
    if not conn_permission:
        return False

    # Compare permission levels
    permission_hierarchy = {
        'owner': 3,
        'editor': 2,
        'viewer': 1
    }

    required_level = permission_hierarchy.get(required_permission, 0)
    user_level = permission_hierarchy.get(conn_permission, 0)

    return user_level >= required_level


def can_manage_connection_permissions(
    db: Session,
    user_id: int,
    connection_id: int
) -> bool:
    """
    Check if user can manage permissions for a connection.

    Permission management is allowed if:
    1. User is connection owner
    2. User is workspace admin
    3. User created the connection

    Args:
        db: Database session
        user_id: User ID to check
        connection_id: Connection ID

    Returns:
        True if user can manage permissions, False otherwise
    """
    connection = db.query(Connection).filter(Connection.id == connection_id).first()
    if not connection:
        return False

    # Creator can always manage permissions
    if connection.created_by == user_id:
        return True

    # Workspace admin can manage permissions
    workspace_role = get_user_role(db, user_id, connection.workspace_id)
    if workspace_role == 'admin':
        return True

    # Connection owner can manage permissions
    conn_permission = get_user_connection_permission(db, user_id, connection_id)
    if conn_permission == 'owner':
        return True

    return False


def grant_connection_permission(
    db: Session,
    connection_id: int,
    user_id: int,
    permission_level: str,
    granted_by: int
) -> ConnectionPermission:
    """
    Grant connection permission to a user.

    Args:
        db: Database session
        connection_id: Connection ID
        user_id: User ID to grant permission to
        permission_level: Permission level ('owner', 'editor', 'viewer')
        granted_by: User ID granting the permission

    Returns:
        Created ConnectionPermission object

    Raises:
        HTTPException if validation fails
    """
    # Validate connection exists
    connection = db.query(Connection).filter(Connection.id == connection_id).first()
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )

    # Validate user exists and is in the same workspace
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if user is in the connection's workspace
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == connection.workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a member of this workspace"
        )

    # Check if permission already exists
    existing = db.query(ConnectionPermission).filter(
        ConnectionPermission.connection_id == connection_id,
        ConnectionPermission.user_id == user_id
    ).first()

    if existing:
        # Update existing permission
        existing.permission_level = permission_level
        existing.granted_by = granted_by
        db.commit()
        db.refresh(existing)
        return existing

    # Create new permission
    permission = ConnectionPermission(
        connection_id=connection_id,
        user_id=user_id,
        permission_level=permission_level,
        granted_by=granted_by
    )

    db.add(permission)
    db.commit()
    db.refresh(permission)

    return permission


def revoke_connection_permission(
    db: Session,
    connection_id: int,
    user_id: int
) -> bool:
    """
    Revoke connection permission from a user.

    Args:
        db: Database session
        connection_id: Connection ID
        user_id: User ID to revoke permission from

    Returns:
        True if permission was revoked, False if no permission existed
    """
    permission = db.query(ConnectionPermission).filter(
        ConnectionPermission.connection_id == connection_id,
        ConnectionPermission.user_id == user_id
    ).first()

    if not permission:
        return False

    db.delete(permission)
    db.commit()

    return True


def get_connection_permissions(
    db: Session,
    connection_id: int
) -> list[ConnectionPermission]:
    """
    Get all permissions for a connection.

    Args:
        db: Database session
        connection_id: Connection ID

    Returns:
        List of ConnectionPermission objects
    """
    return db.query(ConnectionPermission).filter(
        ConnectionPermission.connection_id == connection_id
    ).all()


def get_user_accessible_connections(
    db: Session,
    user_id: int,
    workspace_id: int
) -> list[int]:
    """
    Get list of connection IDs that user can access in a workspace.

    Includes:
    1. Connections created by the user
    2. Connections with explicit permissions for the user
    3. All workspace connections if user is workspace admin

    Args:
        db: Database session
        user_id: User ID
        workspace_id: Workspace ID

    Returns:
        List of connection IDs
    """
    # Check if user is workspace admin
    workspace_role = get_user_role(db, user_id, workspace_id)

    if workspace_role == 'admin':
        # Admins can access all workspace connections
        connections = db.query(Connection.id).filter(
            Connection.workspace_id == workspace_id
        ).all()
        return [conn.id for conn in connections]

    # Get connections created by user
    created_connections = db.query(Connection.id).filter(
        Connection.workspace_id == workspace_id,
        Connection.created_by == user_id
    ).all()
    created_ids = {conn.id for conn in created_connections}

    # Get connections with explicit permissions
    permitted_connections = db.query(ConnectionPermission.connection_id).join(
        Connection
    ).filter(
        ConnectionPermission.user_id == user_id,
        Connection.workspace_id == workspace_id
    ).all()
    permitted_ids = {conn.connection_id for conn in permitted_connections}

    # Combine both sets
    accessible_ids = created_ids | permitted_ids

    return list(accessible_ids)


class ConnectionPermissionChecker:
    """
    Dependency class for checking connection permissions in route handlers.

    Usage:
        @app.get("/connections/{connection_id}")
        def get_connection(
            connection_id: int,
            _: None = Depends(ConnectionPermissionChecker('viewer'))
        ):
            # Handler code - user has been verified to have viewer access
            pass
    """

    def __init__(self, required_permission: str = 'viewer'):
        self.required_permission = required_permission

    def __call__(
        self,
        connection_id: int,
        current_user: User = Depends(lambda: None),  # Will be replaced with actual dependency
        db: Session = Depends(lambda: None)  # Will be replaced with actual dependency
    ):
        """Check if current user has required permission for connection."""
        if not check_connection_access(
            db,
            current_user.id,
            connection_id,
            self.required_permission
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {self.required_permission}"
            )
