"""
Health check endpoints for monitoring system status.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.models.sqlite_models import Workspace, User

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def health_check():
    """
    Basic health check endpoint.

    Returns:
        Simple status message indicating API is running
    """
    return {
        "status": "healthy",
        "message": "API is running"
    }


@router.get("/workspace-check")
async def workspace_health_check(db: Session = Depends(get_db)):
    """
    Verify workspace configuration is healthy.

    Checks for common workspace-related issues:
    - Users without workspace assignments
    - Existence of default workspace
    - Overall workspace count

    Returns:
        Detailed workspace health status and metrics
    """
    workspace_count = db.query(Workspace).count()

    users_with_workspace = db.query(User).filter(
        User.current_workspace_id != None
    ).count()

    users_without_workspace = db.query(User).filter(
        User.current_workspace_id == None
    ).count()

    default_workspace = db.query(Workspace).filter(
        Workspace.slug == 'default'
    ).first()

    # Determine overall status
    if users_without_workspace > 0:
        status = "degraded"
    else:
        status = "healthy"

    # Build warnings list
    warnings = []
    if users_without_workspace > 0:
        warnings.append(f"{users_without_workspace} user(s) without workspace assignment")
    if workspace_count == 0:
        warnings.append("No workspaces exist in the database")

    return {
        "status": status,
        "workspace_count": workspace_count,
        "users_with_workspace": users_with_workspace,
        "users_without_workspace": users_without_workspace,
        "default_workspace_exists": default_workspace is not None,
        "warnings": warnings
    }
