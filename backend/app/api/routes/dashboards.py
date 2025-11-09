"""
Dashboard CRUD routes with workspace-scoped access control
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import secrets

from app.models.schemas import DashboardCreate, DashboardUpdate, DashboardResponse
from app.models.sqlite_models import Dashboard, DashboardChart, User
from app.api.dependencies import get_db, get_current_user
from app.core.permissions import check_permission, is_workspace_editor_or_above
from app.core.workspace_middleware import WorkspaceContextInjector

router = APIRouter(prefix="/dashboards", tags=["Dashboards"])


@router.get("", response_model=List[DashboardResponse])
async def list_dashboards(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all dashboards in the current workspace

    All workspace members can view dashboards
    """
    # Get workspace_id from request context, header, or current user
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    # Filter dashboards by workspace
    dashboards = db.query(Dashboard).filter(
        Dashboard.workspace_id == workspace_id
    ).order_by(Dashboard.updated_at.desc()).all()

    return dashboards


@router.get("/{dashboard_id}", response_model=DashboardResponse)
async def get_dashboard(
    dashboard_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific dashboard by ID

    All workspace members can view dashboards
    """
    # Get workspace_id from request context
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    # Filter by workspace_id for security
    dashboard = db.query(Dashboard).filter(
        Dashboard.id == dashboard_id,
        Dashboard.workspace_id == workspace_id
    ).first()

    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )

    return dashboard


@router.post("", response_model=DashboardResponse, status_code=status.HTTP_201_CREATED)
async def create_dashboard(
    dashboard_data: DashboardCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new dashboard in the current workspace

    Requires editor or admin role in workspace
    """
    # Get workspace_id from request context
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    # Check editor or admin permission
    if not is_workspace_editor_or_above(db, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )

    # Create new dashboard with workspace_id
    dashboard = Dashboard(
        name=dashboard_data.name,
        description=dashboard_data.description,
        layout=dashboard_data.layout,
        is_public=dashboard_data.is_public,
        created_by=current_user.id,
        workspace_id=workspace_id
    )

    db.add(dashboard)
    db.commit()
    db.refresh(dashboard)

    return dashboard


@router.put("/{dashboard_id}", response_model=DashboardResponse)
async def update_dashboard(
    dashboard_id: int,
    dashboard_data: DashboardUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing dashboard

    Requires editor or admin role in workspace
    Editors can only update their own dashboards
    Workspace admins can update any dashboard in workspace
    """
    # Get workspace_id from request context
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    # Check editor or admin permission
    if not is_workspace_editor_or_above(db, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You need editor or admin role to update dashboards"
        )

    # Filter by workspace_id for security
    dashboard = db.query(Dashboard).filter(
        Dashboard.id == dashboard_id,
        Dashboard.workspace_id == workspace_id
    ).first()

    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )

    # Check ownership (editors can only edit their own, admins can edit any)
    from app.core.permissions import is_workspace_admin
    if not is_workspace_admin(db, current_user.id, workspace_id) and dashboard.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You can only update your own dashboards"
        )

    # Update fields if provided
    update_data = dashboard_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(dashboard, field, value)

    dashboard.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(dashboard)

    return dashboard


@router.delete("/{dashboard_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dashboard(
    dashboard_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a dashboard

    Requires editor or admin role in workspace
    Editors can only delete their own dashboards
    Workspace admins can delete any dashboard in workspace
    """
    # Get workspace_id from request context
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    # Check editor or admin permission
    if not is_workspace_editor_or_above(db, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You need editor or admin role to delete dashboards"
        )

    # Filter by workspace_id for security
    dashboard = db.query(Dashboard).filter(
        Dashboard.id == dashboard_id,
        Dashboard.workspace_id == workspace_id
    ).first()

    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )

    # Check ownership (editors can only delete their own, admins can delete any)
    from app.core.permissions import is_workspace_admin
    if not is_workspace_admin(db, current_user.id, workspace_id) and dashboard.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You can only delete your own dashboards"
        )

    db.delete(dashboard)
    db.commit()

    return None


@router.post("/{dashboard_id}/share", response_model=DashboardResponse)
async def generate_share_token(
    dashboard_id: int,
    request: Request,
    expires_in_days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a public sharing token for a dashboard

    Requires editor or admin role in workspace
    Editors can only share their own dashboards
    Workspace admins can share any dashboard in workspace
    """
    # Get workspace_id from request context
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    # Check editor or admin permission
    if not is_workspace_editor_or_above(db, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You need editor or admin role to share dashboards"
        )

    # Filter by workspace_id for security
    dashboard = db.query(Dashboard).filter(
        Dashboard.id == dashboard_id,
        Dashboard.workspace_id == workspace_id
    ).first()

    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )

    # Check ownership
    from app.core.permissions import is_workspace_admin
    if not is_workspace_admin(db, current_user.id, workspace_id) and dashboard.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You can only share your own dashboards"
        )

    # Generate secure random token
    dashboard.public_token = secrets.token_urlsafe(32)
    dashboard.public_token_created_at = datetime.utcnow()
    dashboard.public_token_expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
    dashboard.is_public = True
    dashboard.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(dashboard)

    return dashboard


@router.delete("/{dashboard_id}/share", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_share_token(
    dashboard_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Revoke public sharing for a dashboard

    Requires editor or admin role in workspace
    Editors can only revoke their own dashboards
    Workspace admins can revoke any dashboard in workspace
    """
    # Get workspace_id from request context
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    # Check editor or admin permission
    if not is_workspace_editor_or_above(db, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You need editor or admin role to revoke dashboard sharing"
        )

    # Filter by workspace_id for security
    dashboard = db.query(Dashboard).filter(
        Dashboard.id == dashboard_id,
        Dashboard.workspace_id == workspace_id
    ).first()

    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )

    # Check ownership
    from app.core.permissions import is_workspace_admin
    if not is_workspace_admin(db, current_user.id, workspace_id) and dashboard.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You can only revoke sharing for your own dashboards"
        )

    # Revoke sharing
    dashboard.public_token = None
    dashboard.public_token_created_at = None
    dashboard.public_token_expires_at = None
    dashboard.is_public = False
    dashboard.updated_at = datetime.utcnow()

    db.commit()

    return None


@router.get("/public/{share_token}", response_model=DashboardResponse)
async def get_public_dashboard(
    share_token: str,
    db: Session = Depends(get_db)
):
    """
    Get a publicly shared dashboard by token

    No authentication required
    Increments access count
    """
    dashboard = db.query(Dashboard).filter(
        Dashboard.public_token == share_token,
        Dashboard.is_public == True
    ).first()

    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found or not publicly accessible"
        )

    # Check if token is expired
    if dashboard.public_token_expires_at and dashboard.public_token_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This sharing link has expired"
        )

    # Increment access count
    dashboard.public_access_count += 1
    db.commit()
    db.refresh(dashboard)

    return dashboard
