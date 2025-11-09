"""
Permission Checking System

This module provides workspace-scoped role-based access control (RBAC).

Role Hierarchy:
- Admin (3): Full workspace control
- Editor (2): Create/edit resources
- Viewer (1): Read-only access
"""

from typing import Optional
from fastapi import HTTPException, status, Request, Depends
from sqlalchemy.orm import Session
from functools import wraps
import logging

logger = logging.getLogger(__name__)


# Role hierarchy levels
ROLE_HIERARCHY = {
    'admin': 3,
    'editor': 2,
    'viewer': 1
}


class Permission:
    """
    Permission constants for different operations.
    """
    # Workspace management
    WORKSPACE_DELETE = 'admin'
    WORKSPACE_UPDATE = 'admin'
    WORKSPACE_VIEW = 'viewer'

    # Member management
    MEMBER_INVITE = 'admin'
    MEMBER_REMOVE = 'admin'
    MEMBER_UPDATE_ROLE = 'admin'
    MEMBER_VIEW = 'viewer'

    # Dashboard operations
    DASHBOARD_CREATE = 'editor'
    DASHBOARD_UPDATE = 'editor'
    DASHBOARD_DELETE = 'editor'
    DASHBOARD_VIEW = 'viewer'

    # Chart operations
    CHART_CREATE = 'editor'
    CHART_UPDATE = 'editor'
    CHART_DELETE = 'editor'
    CHART_VIEW = 'viewer'

    # Connection operations
    CONNECTION_CREATE = 'editor'
    CONNECTION_UPDATE = 'editor'
    CONNECTION_DELETE = 'editor'
    CONNECTION_VIEW = 'viewer'

    # Settings operations
    SETTINGS_UPDATE = 'admin'
    SETTINGS_VIEW = 'admin'


def get_user_role(
    db: Session,
    user_id: int,
    workspace_id: int
) -> Optional[str]:
    """
    Get user's role in a specific workspace.

    Args:
        db: Database session
        user_id: User ID
        workspace_id: Workspace ID

    Returns:
        Role string ('admin', 'editor', 'viewer') or None if not a member
    """
    from app.models.sqlite_models import WorkspaceMember

    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.user_id == user_id,
        WorkspaceMember.workspace_id == workspace_id
    ).first()

    if not member:
        return None

    return member.role


def check_permission(
    db: Session,
    user_id: int,
    workspace_id: int,
    required_role: str
) -> bool:
    """
    Check if user has required permission in workspace.

    Args:
        db: Database session
        user_id: User ID
        workspace_id: Workspace ID
        required_role: Minimum required role

    Returns:
        True if user has permission, False otherwise
    """
    user_role = get_user_role(db, user_id, workspace_id)

    if user_role is None:
        return False

    user_role_level = ROLE_HIERARCHY.get(user_role, 0)
    required_role_level = ROLE_HIERARCHY.get(required_role, 0)

    return user_role_level >= required_role_level


def require_permission(required_role: str):
    """
    Decorator to enforce permission checks on route handlers.

    Usage:
        @router.get("/dashboards")
        @require_permission(Permission.DASHBOARD_VIEW)
        async def get_dashboards(request: Request, db: Session = Depends(get_db)):
            ...

    Args:
        required_role: Minimum required role (admin, editor, viewer)

    Returns:
        Decorated function that checks permissions before execution

    Raises:
        HTTPException: 404 if user lacks permission (to prevent enumeration)
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request and db from kwargs
            request = kwargs.get('request')
            db = kwargs.get('db')

            if not request or not db:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Invalid route configuration"
                )

            # Get user and workspace from request state (set by middleware)
            user = getattr(request.state, 'user', None)
            workspace_id = getattr(request.state, 'workspace_id', None)

            if not user or workspace_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated"
                )

            # Check permission
            has_permission = check_permission(
                db, user.id, workspace_id, required_role
            )

            if not has_permission:
                logger.warning(
                    f"User {user.id} denied access to {func.__name__} "
                    f"(required: {required_role})"
                )
                # Return 404 instead of 403 to prevent workspace enumeration
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Resource not found"
                )

            # Permission granted, execute function
            return await func(*args, **kwargs)

        return wrapper
    return decorator


class PermissionChecker:
    """
    Dependency injection class for checking permissions in FastAPI routes.

    Usage:
        @router.get("/dashboards")
        async def get_dashboards(
            request: Request,
            db: Session = Depends(get_db),
            _: None = Depends(PermissionChecker(Permission.DASHBOARD_VIEW))
        ):
            ...
    """

    def __init__(self, required_role: str):
        """
        Initialize permission checker.

        Args:
            required_role: Minimum required role
        """
        self.required_role = required_role

    async def __call__(
        self,
        request: Request,
        db: Session
    ) -> None:
        """
        Check permission when used as a dependency.

        Args:
            request: FastAPI request
            db: Database session

        Raises:
            HTTPException: If permission check fails
        """
        user = getattr(request.state, 'user', None)
        workspace_id = getattr(request.state, 'workspace_id', None)

        if not user or workspace_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated"
            )

        has_permission = check_permission(
            db, user.id, workspace_id, self.required_role
        )

        if not has_permission:
            logger.warning(
                f"User {user.id} denied access "
                f"(required: {self.required_role})"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resource not found"
            )


def is_workspace_admin(
    db: Session,
    user_id: int,
    workspace_id: int
) -> bool:
    """
    Check if user is an admin of the workspace.

    Args:
        db: Database session
        user_id: User ID
        workspace_id: Workspace ID

    Returns:
        True if user is admin, False otherwise
    """
    return check_permission(db, user_id, workspace_id, 'admin')


def is_workspace_editor_or_above(
    db: Session,
    user_id: int,
    workspace_id: int
) -> bool:
    """
    Check if user is an editor or admin of the workspace.

    Args:
        db: Database session
        user_id: User ID
        workspace_id: Workspace ID

    Returns:
        True if user is editor or admin, False otherwise
    """
    return check_permission(db, user_id, workspace_id, 'editor')


def require_workspace_membership(
    db: Session,
    user_id: int,
    workspace_id: int
) -> None:
    """
    Ensure user is a member of the workspace.

    Args:
        db: Database session
        user_id: User ID
        workspace_id: Workspace ID

    Raises:
        HTTPException: 404 if user is not a member
    """
    user_role = get_user_role(db, user_id, workspace_id)

    if user_role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )


def can_modify_member_role(
    db: Session,
    actor_user_id: int,
    target_user_id: int,
    workspace_id: int,
    new_role: str
) -> bool:
    """
    Check if actor can modify target user's role.

    Rules:
    1. Only admins can change roles
    2. Cannot change your own role
    3. Cannot promote someone to a higher role than yours

    Args:
        db: Database session
        actor_user_id: User making the change
        target_user_id: User being modified
        workspace_id: Workspace ID
        new_role: New role to assign

    Returns:
        True if modification is allowed, False otherwise
    """
    # Cannot change your own role
    if actor_user_id == target_user_id:
        return False

    # Check if actor is admin
    if not is_workspace_admin(db, actor_user_id, workspace_id):
        return False

    # Get actor's role level
    actor_role = get_user_role(db, actor_user_id, workspace_id)
    actor_role_level = ROLE_HIERARCHY.get(actor_role, 0)

    # Cannot promote to a higher role than yours
    new_role_level = ROLE_HIERARCHY.get(new_role, 0)
    if new_role_level > actor_role_level:
        return False

    return True


def validate_workspace_ownership(
    db: Session,
    user_id: int,
    workspace_id: int
) -> None:
    """
    Validate that user is the workspace creator.

    This is used for destructive operations like workspace deletion.

    Args:
        db: Database session
        user_id: User ID
        workspace_id: Workspace ID

    Raises:
        HTTPException: 404 if user is not the creator
    """
    from app.models.sqlite_models import Workspace

    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id,
        Workspace.created_by == user_id
    ).first()

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
