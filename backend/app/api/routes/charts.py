"""
Chart management routes - CRUD operations for charts
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.models.schemas import ChartCreate, ChartUpdate, ChartResponse
from app.models.sqlite_models import Chart, User, DataSource
from app.api.dependencies import get_db, get_current_user
from app.core.permissions import is_workspace_editor_or_above
from app.core.workspace_middleware import WorkspaceContextInjector

router = APIRouter(prefix="/charts", tags=["Charts"])


@router.get("", response_model=List[ChartResponse])
async def list_charts(
    request: Request,
    data_source_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all charts in the current workspace
    Optionally filter by data_source_id
    """
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    query = db.query(Chart).filter(
        Chart.workspace_id == workspace_id
    )

    if data_source_id is not None:
        query = query.filter(Chart.data_source_id == data_source_id)

    charts = query.order_by(Chart.created_at.desc()).all()
    return charts


@router.get("/{chart_id}", response_model=ChartResponse)
async def get_chart(
    chart_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific chart by ID"""
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    chart = db.query(Chart).filter(
        Chart.id == chart_id,
        Chart.workspace_id == workspace_id
    ).first()

    if not chart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chart not found"
        )

    return chart


@router.post("", response_model=ChartResponse, status_code=status.HTTP_201_CREATED)
async def create_chart(
    chart_data: ChartCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new chart"""
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    # Check if user has editor permission
    if not is_workspace_editor_or_above(db, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to create charts"
        )

    # If data_source_id is provided, verify it exists and belongs to workspace
    if chart_data.data_source_id is not None:
        data_source = db.query(DataSource).filter(
            DataSource.id == chart_data.data_source_id,
            DataSource.workspace_id == workspace_id
        ).first()

        if not data_source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Data source not found or doesn't belong to this workspace"
            )

    # Create chart
    new_chart = Chart(
        name=chart_data.name,
        description=chart_data.description,
        chart_type=chart_data.chart_type,
        config=chart_data.config,
        data_source_id=chart_data.data_source_id,
        query=chart_data.query,
        workspace_id=workspace_id,
        created_by=current_user.id
    )

    db.add(new_chart)
    db.commit()
    db.refresh(new_chart)

    return new_chart


@router.put("/{chart_id}", response_model=ChartResponse)
async def update_chart(
    chart_id: int,
    chart_data: ChartUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing chart"""
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    # Check if user has editor permission
    if not is_workspace_editor_or_above(db, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update charts"
        )

    # Find chart
    chart = db.query(Chart).filter(
        Chart.id == chart_id,
        Chart.workspace_id == workspace_id
    ).first()

    if not chart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chart not found"
        )

    # If data_source_id is being updated, verify it exists and belongs to workspace
    if chart_data.data_source_id is not None:
        data_source = db.query(DataSource).filter(
            DataSource.id == chart_data.data_source_id,
            DataSource.workspace_id == workspace_id
        ).first()

        if not data_source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Data source not found or doesn't belong to this workspace"
            )

    # Update fields
    update_data = chart_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(chart, field, value)

    chart.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(chart)

    return chart


@router.delete("/{chart_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chart(
    chart_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a chart"""
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    # Check if user has editor permission
    if not is_workspace_editor_or_above(db, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete charts"
        )

    # Find chart
    chart = db.query(Chart).filter(
        Chart.id == chart_id,
        Chart.workspace_id == workspace_id
    ).first()

    if not chart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chart not found"
        )

    db.delete(chart)
    db.commit()

    return None
