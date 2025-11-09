"""
Database connection management routes with workspace-scoped access control
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.models.schemas import ConnectionCreate, ConnectionUpdate, ConnectionResponse, ConnectionTestResult
from app.models.sqlite_models import Connection, User
from app.api.dependencies import get_db, get_current_user
from app.core.encryption import encryption
from app.core.permissions import is_workspace_editor_or_above
from app.core.workspace_middleware import WorkspaceContextInjector
from app.services.connection_tester import connection_tester

router = APIRouter(prefix="/connections", tags=["Connections"])


@router.get("", response_model=List[ConnectionResponse])
async def list_connections(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all connections in the current workspace

    All workspace members can view connections
    """
    # Get workspace_id from request context (set by middleware)
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    # Filter connections by workspace
    connections = db.query(Connection).filter(
        Connection.workspace_id == workspace_id
    ).order_by(Connection.updated_at.desc()).all()

    # Manually build response with decrypted configs
    result = []
    for conn in connections:
        decrypted_config = encryption.decrypt_connection_config(conn.config) if isinstance(conn.config, str) else conn.config
        result.append({
            "id": conn.id,
            "name": conn.name,
            "type": conn.type,
            "config": decrypted_config,
            "is_active": conn.is_active,
            "created_at": conn.created_at,
            "created_by": conn.created_by
        })

    return result


@router.get("/{connection_id}", response_model=ConnectionResponse)
async def get_connection(
    connection_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific connection by ID

    All workspace members can view connections
    """
    # Get workspace_id from request context
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    # Filter by workspace_id for security
    connection = db.query(Connection).filter(
        Connection.id == connection_id,
        Connection.workspace_id == workspace_id
    ).first()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )

    # Decrypt config before returning
    decrypted_config = encryption.decrypt_connection_config(connection.config) if isinstance(connection.config, str) else connection.config

    return {
        "id": connection.id,
        "name": connection.name,
        "type": connection.type,
        "config": decrypted_config,
        "is_active": connection.is_active,
        "created_at": connection.created_at,
        "created_by": connection.created_by
    }


@router.post("", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
async def create_connection(
    connection_data: ConnectionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new database/storage connection in the current workspace

    Requires editor or admin role in workspace
    Connection config is encrypted before storage
    """
    # Get workspace_id from request context
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    # Check editor or admin permission
    if not is_workspace_editor_or_above(db, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )

    # Check for duplicate name in this workspace
    existing = db.query(Connection).filter(
        Connection.name == connection_data.name,
        Connection.workspace_id == workspace_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A connection with this name already exists in this workspace"
        )

    # Encrypt connection config before storing
    encrypted_config = encryption.encrypt_connection_config(connection_data.config)

    # Create new connection with workspace_id
    connection = Connection(
        name=connection_data.name,
        type=connection_data.type,
        config=encrypted_config,
        is_active=True,
        created_by=current_user.id,
        workspace_id=workspace_id
    )

    db.add(connection)
    db.commit()
    db.refresh(connection)

    # Return with decrypted config
    return {
        "id": connection.id,
        "name": connection.name,
        "type": connection.type,
        "config": connection_data.config,  # Use original unencrypted config from request
        "is_active": connection.is_active,
        "created_at": connection.created_at,
        "created_by": connection.created_by
    }


@router.put("/{connection_id}", response_model=ConnectionResponse)
async def update_connection(
    connection_id: int,
    connection_data: ConnectionUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing connection

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

    # Filter by workspace_id for security
    connection = db.query(Connection).filter(
        Connection.id == connection_id,
        Connection.workspace_id == workspace_id
    ).first()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )

    # Update fields if provided
    update_data = connection_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field == "config" and value is not None:
            # Encrypt config if it's being updated
            encrypted_config = encryption.encrypt_connection_config(value)
            setattr(connection, field, encrypted_config)
        else:
            setattr(connection, field, value)

    connection.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(connection)

    # Decrypt config before returning
    decrypted_config = encryption.decrypt_connection_config(connection.config) if isinstance(connection.config, str) else connection.config

    return {
        "id": connection.id,
        "name": connection.name,
        "type": connection.type,
        "config": decrypted_config,
        "is_active": connection.is_active,
        "created_at": connection.created_at,
        "created_by": connection.created_by
    }


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connection(
    connection_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a connection

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

    # Filter by workspace_id for security
    connection = db.query(Connection).filter(
        Connection.id == connection_id,
        Connection.workspace_id == workspace_id
    ).first()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )

    db.delete(connection)
    db.commit()

    return None


@router.post("/test-credentials", response_model=ConnectionTestResult)
async def test_credentials(
    connection_data: ConnectionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Test database/storage credentials before saving

    Requires editor or admin role in workspace
    Returns success status and diagnostic information
    Does NOT save the connection
    """
    # Get workspace_id from request context
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    # Check editor or admin permission
    if not is_workspace_editor_or_above(db, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )

    # Use service to test connection
    result = connection_tester.test_connection(
        connection_data.type,
        connection_data.config
    )
    return result


@router.post("/{connection_id}/test", response_model=ConnectionTestResult)
async def test_connection(
    connection_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Test a saved database/storage connection

    Requires editor or admin role in workspace
    Returns success status and diagnostic information
    """
    # Get workspace_id from request context
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    # Check editor or admin permission
    if not is_workspace_editor_or_above(db, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )

    # Filter by workspace_id for security
    connection = db.query(Connection).filter(
        Connection.id == connection_id,
        Connection.workspace_id == workspace_id
    ).first()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )

    # Decrypt config and test using service
    config = encryption.decrypt_connection_config(connection.config)
    result = connection_tester.test_connection(connection.type, config)
    return result
