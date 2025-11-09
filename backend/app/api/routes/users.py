"""
User management routes with RBAC support
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import datetime

from app.models.schemas import (
    UserCreate, UserUpdate, UserResponse, UserListResponse,
    UserListItem, UserDetailResponse, UserWorkspaceMembership,
    PasswordChangeRequest, AdminPasswordResetRequest
)
from app.models.sqlite_models import User, WorkspaceMember, Workspace
from app.api.dependencies import get_db, get_current_user
from app.core.security import get_password_hash, verify_password
from app.core.permissions import is_workspace_admin

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=UserListResponse)
async def list_users(
    request: Request,
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by username or email"),
    role: Optional[str] = Query(None, pattern="^(admin|editor|viewer)$", description="Filter by role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all users with pagination, search, and filtering.

    Admin-only endpoint with comprehensive user listing including workspace counts.
    Supports search by username/email and filtering by role and active status.
    """
    # Only admins can list users (system-wide admin check)
    # Note: This checks the user's global role, not workspace-specific
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )

    # Build base query
    query = db.query(User)

    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.username.ilike(search_term),
                User.email.ilike(search_term)
            )
        )

    # Apply role filter
    if role:
        query = query.filter(User.role == role)

    # Apply active status filter
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    # Get total count before pagination
    total = query.count()

    # Calculate pagination
    total_pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size

    # Get paginated users
    users = query.order_by(User.created_at.desc()).offset(offset).limit(page_size).all()

    # Build response with workspace counts
    user_items = []
    for user in users:
        # Count workspaces user is member of
        workspace_count = db.query(func.count(WorkspaceMember.id)).filter(
            WorkspaceMember.user_id == user.id
        ).scalar()

        user_items.append(UserListItem(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
            last_login=user.last_login,
            workspace_count=workspace_count or 0
        ))

    return UserListResponse(
        users=user_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{user_id}", response_model=UserDetailResponse)
async def get_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed user information including workspace memberships.

    Users can view their own details. Admins can view any user.
    """
    # Check permission: user can view self, admins can view anyone
    if user_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get workspace memberships
    memberships = db.query(WorkspaceMember, Workspace).join(
        Workspace, WorkspaceMember.workspace_id == Workspace.id
    ).filter(
        WorkspaceMember.user_id == user_id
    ).all()

    workspace_list = [
        UserWorkspaceMembership(
            workspace_id=membership.WorkspaceMember.workspace_id,
            workspace_name=membership.Workspace.name,
            role=membership.WorkspaceMember.role,
            joined_at=membership.WorkspaceMember.joined_at
        )
        for membership in memberships
    ]

    return UserDetailResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login=user.last_login,
        email_verified=user.email_verified,
        current_workspace_id=user.current_workspace_id,
        workspaces=workspace_list
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new user.

    Admin-only endpoint. Creates a new user account with specified role.
    """
    # Only admins can create users
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )

    # Check if username already exists
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )

    # Create new user
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role,
        is_active=True,
        email_verified=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update user information.

    Users can update their own email. Admins can update role and active status.
    """
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Permission check
    is_self = user_id == current_user.id
    is_admin = current_user.role == 'admin'

    if not (is_self or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )

    # Update fields based on permission
    update_data = user_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field == "email":
            # Both user and admin can update email
            if value:
                # Check if email already exists
                existing = db.query(User).filter(
                    User.email == value,
                    User.id != user_id
                ).first()
                if existing:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Email already exists"
                    )
                user.email = value
                user.email_verified = False  # Reset verification on email change

        elif field in ["role", "is_active"]:
            # Only admin can update role and active status
            if not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only admins can update role and active status"
                )
            # Cannot modify your own role or active status
            if is_self:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot modify your own role or active status"
                )
            setattr(user, field, value)

    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deactivate a user (soft delete).

    Admin-only endpoint. Sets is_active to False instead of deleting.
    Cannot deactivate yourself.
    """
    # Only admins can delete users
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )

    # Cannot delete yourself
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate yourself"
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Soft delete: set is_active to False
    user.is_active = False
    user.updated_at = datetime.utcnow()
    db.commit()

    return None


@router.get("/{user_id}/workspaces", response_model=List[UserWorkspaceMembership])
async def get_user_workspaces(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get list of workspaces a user belongs to.

    Users can view their own workspaces. Admins can view any user's workspaces.
    """
    # Check permission
    if user_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )

    # Get workspace memberships
    memberships = db.query(WorkspaceMember, Workspace).join(
        Workspace, WorkspaceMember.workspace_id == Workspace.id
    ).filter(
        WorkspaceMember.user_id == user_id
    ).all()

    return [
        UserWorkspaceMembership(
            workspace_id=membership.WorkspaceMember.workspace_id,
            workspace_name=membership.Workspace.name,
            role=membership.WorkspaceMember.role,
            joined_at=membership.WorkspaceMember.joined_at
        )
        for membership in memberships
    ]


@router.post("/{user_id}/password", response_model=dict)
async def change_password(
    user_id: int,
    password_data: PasswordChangeRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Change user password.

    Users can change their own password with current password verification.
    """
    # Only users can change their own password with this endpoint
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only change your own password"
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Verify current password
    if not verify_password(password_data.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Update password
    user.password_hash = get_password_hash(password_data.new_password)
    user.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Password changed successfully"}


@router.post("/{user_id}/reset-password", response_model=dict)
async def admin_reset_password(
    user_id: int,
    password_data: AdminPasswordResetRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Admin reset user password.

    Admin-only endpoint. Resets password without requiring current password.
    """
    # Only admins can reset passwords
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update password
    user.password_hash = get_password_hash(password_data.new_password)
    user.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Password reset successfully"}
