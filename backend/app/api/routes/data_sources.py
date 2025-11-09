"""
Data Source management routes - manage databases and folders within connections
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.models.schemas import DataSourceCreate, DataSourceUpdate, DataSourceResponse
from app.models.sqlite_models import DataSource, Connection, User
from app.api.dependencies import get_db, get_current_user
from app.core.encryption import encryption
from app.core.permissions import is_workspace_editor_or_above
from app.core.workspace_middleware import WorkspaceContextInjector

router = APIRouter(prefix="/data-sources", tags=["Data Sources"])


@router.get("", response_model=List[DataSourceResponse])
async def list_data_sources(
    request: Request,
    connection_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all data sources in the current workspace
    Optionally filter by connection_id
    """
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    query = db.query(DataSource).filter(
        DataSource.workspace_id == workspace_id
    )

    if connection_id is not None:
        query = query.filter(DataSource.connection_id == connection_id)

    data_sources = query.order_by(DataSource.created_at.desc()).all()
    return data_sources


@router.get("/{data_source_id}", response_model=DataSourceResponse)
async def get_data_source(
    data_source_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific data source by ID"""
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    data_source = db.query(DataSource).filter(
        DataSource.id == data_source_id,
        DataSource.workspace_id == workspace_id
    ).first()

    if not data_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )

    return data_source


@router.post("", response_model=DataSourceResponse, status_code=status.HTTP_201_CREATED)
async def create_data_source(
    data_source_data: DataSourceCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new data source (database or folder) within a connection
    Requires editor or admin role in workspace
    """
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    # Check editor or admin permission
    if not is_workspace_editor_or_above(db, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )

    # Verify connection exists and belongs to this workspace
    connection = db.query(Connection).filter(
        Connection.id == data_source_data.connection_id,
        Connection.workspace_id == workspace_id
    ).first()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )

    # Check for duplicate source_identifier in this connection
    existing = db.query(DataSource).filter(
        DataSource.connection_id == data_source_data.connection_id,
        DataSource.source_identifier == data_source_data.source_identifier
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A data source with this identifier already exists for this connection"
        )

    # Create new data source
    data_source = DataSource(
        connection_id=data_source_data.connection_id,
        name=data_source_data.name,
        source_type=data_source_data.source_type,
        source_identifier=data_source_data.source_identifier,
        is_active=True,
        created_by=current_user.id,
        workspace_id=workspace_id
    )

    db.add(data_source)
    db.commit()
    db.refresh(data_source)

    return data_source


@router.put("/{data_source_id}", response_model=DataSourceResponse)
async def update_data_source(
    data_source_id: int,
    data_source_data: DataSourceUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing data source"""
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    # Check editor or admin permission
    if not is_workspace_editor_or_above(db, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )

    data_source = db.query(DataSource).filter(
        DataSource.id == data_source_id,
        DataSource.workspace_id == workspace_id
    ).first()

    if not data_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )

    # Update fields if provided
    update_data = data_source_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(data_source, field, value)

    data_source.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(data_source)

    return data_source


@router.delete("/{data_source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_data_source(
    data_source_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a data source"""
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    # Check editor or admin permission
    if not is_workspace_editor_or_above(db, current_user.id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )

    data_source = db.query(DataSource).filter(
        DataSource.id == data_source_id,
        DataSource.workspace_id == workspace_id
    ).first()

    if not data_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )

    db.delete(data_source)
    db.commit()

    return None


@router.get("/connection/{connection_id}/discover")
async def discover_data_sources(
    connection_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Discover available databases or folders in a connection
    For databases: lists all available databases
    For cloud storage: lists top-level folders
    """
    workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)

    # Verify connection exists and belongs to this workspace
    connection = db.query(Connection).filter(
        Connection.id == connection_id,
        Connection.workspace_id == workspace_id
    ).first()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )

    try:
        # Decrypt connection config
        config = encryption.decrypt_connection_config(connection.config)

        if connection.type == "mysql":
            import mysql.connector
            conn = mysql.connector.connect(
                host=config.get("host"),
                port=config.get("port", 3306),
                user=config.get("user"),
                password=config.get("password"),
                connect_timeout=10
            )
            cursor = conn.cursor()
            cursor.execute("SHOW DATABASES")
            databases = [row[0] for row in cursor.fetchall()]
            conn.close()

            # Filter out system databases
            databases = [db for db in databases if db not in ['information_schema', 'mysql', 'performance_schema', 'sys']]

            return {
                "success": True,
                "source_type": "database",
                "items": [{"identifier": db, "name": db} for db in databases]
            }

        elif connection.type == "postgresql":
            import psycopg2
            conn = psycopg2.connect(
                host=config.get("host"),
                port=config.get("port", 5432),
                user=config.get("user"),
                password=config.get("password"),
                connect_timeout=10
            )
            cursor = conn.cursor()
            cursor.execute("SELECT datname FROM pg_database WHERE datistemplate = false")
            databases = [row[0] for row in cursor.fetchall()]
            conn.close()

            # Filter out system databases
            databases = [db for db in databases if db not in ['postgres', 'template0', 'template1']]

            return {
                "success": True,
                "source_type": "database",
                "items": [{"identifier": db, "name": db} for db in databases]
            }

        elif connection.type == "s3":
            import boto3
            s3_client = boto3.client(
                's3',
                aws_access_key_id=config.get("accessKeyId"),
                aws_secret_access_key=config.get("secretAccessKey"),
                region_name=config.get("region")
            )

            # List top-level folders in the bucket
            response = s3_client.list_objects_v2(
                Bucket=config.get("bucket"),
                Delimiter='/',
                MaxKeys=100
            )

            folders = []
            if 'CommonPrefixes' in response:
                folders = [prefix['Prefix'] for prefix in response['CommonPrefixes']]

            return {
                "success": True,
                "source_type": "folder",
                "items": [{"identifier": folder, "name": folder.rstrip('/')} for folder in folders]
            }

        elif connection.type == "azure_blob":
            from azure.storage.blob import BlobServiceClient

            blob_service_client = BlobServiceClient.from_connection_string(
                config.get("connectionString")
            )
            container_client = blob_service_client.get_container_client(
                config.get("containerName")
            )

            # List blobs with delimiter to get folders
            blobs = container_client.walk_blobs(name_starts_with="", delimiter='/')
            folders = [blob.name for blob in blobs if blob.name.endswith('/')]

            return {
                "success": True,
                "source_type": "folder",
                "items": [{"identifier": folder, "name": folder.rstrip('/')} for folder in folders[:100]]  # Limit to 100
            }

        elif connection.type == "gcs":
            from google.cloud import storage
            import os

            # Set credentials
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = config.get("keyFile")

            client = storage.Client(project=config.get("projectId"))
            bucket = client.get_bucket(config.get("bucket"))

            # List blobs with delimiter to get folders
            blobs = bucket.list_blobs(delimiter='/', max_results=100)
            folders = list(blobs.prefixes)

            return {
                "success": True,
                "source_type": "folder",
                "items": [{"identifier": folder, "name": folder.rstrip('/')} for folder in folders]
            }

        else:
            return {
                "success": False,
                "message": f"Discovery not supported for connection type '{connection.type}'"
            }

    except Exception as e:
        return {
            "success": False,
            "message": f"Discovery failed: {str(e)}",
            "error": str(e)
        }
