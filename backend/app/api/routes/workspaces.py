"""
Workspace routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import re

from app.models.schemas import (
    WorkspaceCreate, WorkspaceResponse, WorkspaceUpdate,
    InviteMemberRequest, WorkspaceMemberResponse,
    AcceptInvitationRequest
)
from app.models.sqlite_models import (
    Workspace, WorkspaceMember, WorkspaceSettings, User
)
from app.core.permissions import (
    Permission, check_permission, is_workspace_admin,
    validate_workspace_ownership
)
from app.core.invitations import (
    create_invitation_token, generate_invitation_link,
    accept_invitation, send_invitation_email
)
from app.api.dependencies import get_db, get_current_user

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


def generate_unique_slug(db: Session, name: str) -> str:
    """
    Generate unique slug from workspace name.

    Args:
        db: Database session
        name: Workspace name

    Returns:
        Unique slug string
    """
    # Convert to lowercase, replace spaces with hyphens
    base_slug = re.sub(r'[^a-z0-9-]', '', name.lower().replace(' ', '-'))
    base_slug = re.sub(r'-+', '-', base_slug).strip('-')

    # Ensure slug is not empty
    if not base_slug:
        base_slug = 'workspace'

    # Check for uniqueness, add number suffix if needed
    slug = base_slug
    counter = 1

    while db.query(Workspace).filter(Workspace.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    workspace_data: WorkspaceCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new workspace.
    Creator automatically becomes admin.
    """
    # Generate unique slug
    slug = generate_unique_slug(db, workspace_data.name)

    # Create workspace
    workspace = Workspace(
        name=workspace_data.name,
        slug=slug,
        created_by=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(workspace)
    db.flush()  # Get workspace ID

    # Add creator as admin member
    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=current_user.id,
        role='admin',
        invited_by=current_user.id,
        joined_at=datetime.utcnow()
    )
    db.add(member)

    # Create default workspace settings
    settings = WorkspaceSettings(
        workspace_id=workspace.id,
        redis_enabled=False,
        redis_host='localhost',
        redis_port=6379,
        max_dashboards=1000,
        max_members=100
    )
    db.add(settings)

    # Set as current workspace for user if they don't have one
    if current_user.current_workspace_id is None:
        current_user.current_workspace_id = workspace.id

    db.commit()
    db.refresh(workspace)

    return workspace


@router.get("", response_model=List[WorkspaceResponse])
async def list_workspaces(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all workspaces the current user is a member of.
    """
    # Get workspaces where user is a member
    workspaces = db.query(Workspace).join(
        WorkspaceMember,
        WorkspaceMember.workspace_id == Workspace.id
    ).filter(
        WorkspaceMember.user_id == current_user.id
    ).all()

    return workspaces


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get workspace details.
    User must be a member of the workspace.
    """
    # Check membership
    if not check_permission(db, current_user.id, workspace_id, 'viewer'):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    return workspace


@router.patch("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: int,
    workspace_data: WorkspaceUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update workspace details.
    Requires admin role.
    """
    # Check admin permission
    if not is_workspace_admin(db, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    # Update fields
    if workspace_data.name:
        workspace.name = workspace_data.name
        # Note: Slug is NOT regenerated to preserve external references

    workspace.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(workspace)

    return workspace


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(
    workspace_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete workspace (CASCADE deletes all resources).
    Only workspace creator can delete.
    """
    # Validate ownership
    validate_workspace_ownership(db, current_user.id, workspace_id)

    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    # Delete workspace (CASCADE will delete members, resources, settings)
    db.delete(workspace)
    db.commit()

    return None


@router.post("/{workspace_id}/switch", response_model=dict)
async def switch_workspace(
    workspace_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Switch user's current workspace.
    User must be a member of the target workspace.
    """
    # Check membership
    if not check_permission(db, current_user.id, workspace_id, 'viewer'):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    # Update current workspace
    current_user.current_workspace_id = workspace_id
    db.commit()

    return {
        "message": "Workspace switched successfully",
        "workspace_id": workspace_id
    }


@router.get("/{workspace_id}/members", response_model=List[WorkspaceMemberResponse])
async def list_members(
    workspace_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all members of a workspace.
    User must be a member of the workspace.
    """
    # Check membership
    if not check_permission(db, current_user.id, workspace_id, 'viewer'):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    members = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id
    ).all()

    return members


@router.post("/{workspace_id}/invite", response_model=dict)
async def invite_member(
    workspace_id: int,
    invite_data: InviteMemberRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Invite a user to the workspace via email.
    Requires admin role.
    """
    # Check admin permission
    if not is_workspace_admin(db, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    # Check if user already exists and is a member
    existing_user = db.query(User).filter(User.email == invite_data.email).first()
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

    # Create invitation token
    token = create_invitation_token(
        workspace_id=workspace_id,
        email=invite_data.email,
        role=invite_data.role,
        invited_by=current_user.id
    )

    # Generate invitation link
    from app.config import settings
    invitation_link = generate_invitation_link(settings.FRONTEND_BASE_URL, token)

    # Send invitation email
    send_invitation_email(
        email=invite_data.email,
        workspace_name=workspace.name,
        invited_by_name=current_user.username,
        invitation_link=invitation_link
    )

    return {
        "message": "Invitation sent successfully",
        "email": invite_data.email,
        "role": invite_data.role
    }


@router.post("/accept-invitation", response_model=dict)
async def accept_workspace_invitation(
    invitation_data: AcceptInvitationRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Accept workspace invitation using token.
    """
    result = accept_invitation(
        db=db,
        token=invitation_data.token,
        user_id=current_user.id,
        email=current_user.email
    )

    return result


@router.delete("/{workspace_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    workspace_id: int,
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a member from the workspace.
    Requires admin role.
    Cannot remove yourself.
    Cannot remove workspace creator.
    """
    # Check admin permission
    if not is_workspace_admin(db, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    # Cannot remove yourself
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove yourself from workspace"
        )

    # Check if target is workspace creator
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if workspace and workspace.created_by == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove workspace creator"
        )

    # Remove member
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )

    db.delete(member)
    db.commit()

    return None


@router.patch("/{workspace_id}/members/{user_id}/role", response_model=WorkspaceMemberResponse)
async def update_member_role(
    workspace_id: int,
    user_id: int,
    role_data: dict,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a member's role in the workspace.
    Requires admin role.
    Cannot change your own role.
    """
    from app.core.permissions import can_modify_member_role

    new_role = role_data.get('role')
    if not new_role or new_role not in ['admin', 'editor', 'viewer']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be admin, editor, or viewer"
        )

    # Check if modification is allowed
    if not can_modify_member_role(db, current_user.id, user_id, workspace_id, new_role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify this member's role"
        )

    # Update role
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )

    member.role = new_role
    db.commit()
    db.refresh(member)

    return member
