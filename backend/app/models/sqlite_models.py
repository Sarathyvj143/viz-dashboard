from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, JSON, TIMESTAMP, UniqueConstraint, Index, CheckConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    """User authentication and authorization model"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default='viewer')  # admin, editor, viewer (deprecated - use workspace roles)
    current_workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="SET NULL"))
    email_verified = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(TIMESTAMP, nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    charts = relationship("Chart", back_populates="creator", cascade="all, delete-orphan")
    dashboards = relationship("Dashboard", back_populates="creator", cascade="all, delete-orphan")
    connections = relationship("Connection", back_populates="creator", cascade="all, delete-orphan")
    logs = relationship("Log", back_populates="user")
    current_workspace = relationship("Workspace", foreign_keys=[current_workspace_id])
    created_workspaces = relationship("Workspace", foreign_keys="Workspace.created_by", back_populates="creator")
    workspace_memberships = relationship("WorkspaceMember", foreign_keys="WorkspaceMember.user_id", back_populates="user")

class Chart(Base):
    """Chart configuration model"""
    __tablename__ = "charts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    chart_type = Column(String(50), nullable=False)  # bar, line, pie, scatter, area
    config = Column(JSON, nullable=False)  # ChartConfig JSON
    data_source_id = Column(Integer, ForeignKey('data_sources.id', ondelete='SET NULL'), nullable=True)
    query = Column(Text)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="charts")
    data_source = relationship("DataSource")
    csv_data = relationship("CSVData", back_populates="chart", cascade="all, delete-orphan")
    dashboard_charts = relationship("DashboardChart", back_populates="chart", cascade="all, delete-orphan")

class Dashboard(Base):
    """Dashboard layout model"""
    __tablename__ = "dashboards"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    layout = Column(JSON, nullable=False)  # DashboardLayout JSON
    is_public = Column(Boolean, default=False)
    public_token = Column(String(100), unique=True, nullable=True, index=True)
    public_token_expires_at = Column(TIMESTAMP, nullable=True)
    public_token_created_at = Column(TIMESTAMP, nullable=True)
    public_access_count = Column(Integer, default=0)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="dashboards")
    workspace = relationship("Workspace", back_populates="dashboards")
    dashboard_charts = relationship("DashboardChart", back_populates="dashboard", cascade="all, delete-orphan")

class DashboardChart(Base):
    """Dashboard-Chart many-to-many relationship"""
    __tablename__ = "dashboard_charts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dashboard_id = Column(Integer, ForeignKey('dashboards.id', ondelete='CASCADE'), nullable=False)
    chart_id = Column(Integer, ForeignKey('charts.id', ondelete='CASCADE'), nullable=False)
    position = Column(JSON, nullable=False)  # {x, y, w, h} grid position

    # Relationships
    dashboard = relationship("Dashboard", back_populates="dashboard_charts")
    chart = relationship("Chart", back_populates="dashboard_charts")

    # Constraints
    __table_args__ = (
        UniqueConstraint('dashboard_id', 'chart_id', name='uq_dashboard_chart'),
    )

class Connection(Base):
    """External database/storage connection model"""
    __tablename__ = "connections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # mysql, postgresql, s3, azure_blob, gcs
    config = Column(JSON, nullable=False)  # Encrypted ConnectionConfig JSON (host, port, user, password for DB; credentials for cloud)
    is_active = Column(Boolean, default=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="connections")
    data_sources = relationship("DataSource", back_populates="connection", cascade="all, delete-orphan")
    permissions = relationship("ConnectionPermission", back_populates="connection", cascade="all, delete-orphan")

class DataSource(Base):
    """
    Specific database or folder within a connection
    One Connection can have multiple DataSources (e.g., MySQL server -> multiple databases)
    """
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    connection_id = Column(Integer, ForeignKey('connections.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # Display name
    source_type = Column(String(50), nullable=False)  # 'database' for DB, 'folder' for cloud storage
    source_identifier = Column(String(500), nullable=False)  # database name for DB, folder path for cloud (e.g., 'my_database' or 's3://bucket/path/')
    is_active = Column(Boolean, default=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    connection = relationship("Connection", back_populates="data_sources")
    creator = relationship("User")

    # Constraints
    __table_args__ = (
        UniqueConstraint('connection_id', 'source_identifier', name='uq_connection_source'),
        Index('idx_datasource_workspace', 'workspace_id'),
    )

class Setting(Base):
    """Application settings key-value store"""
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(JSON, nullable=False)
    description = Column(Text)
    updated_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    updater = relationship("User")

class Log(Base):
    """Activity logging and audit trail"""
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="SET NULL"), index=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50))  # chart, dashboard, user, etc.
    resource_id = Column(Integer)
    details = Column(JSON)
    ip_address = Column(String(45))
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="logs")

class CSVData(Base):
    """CSV uploaded data storage"""
    __tablename__ = "csv_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    chart_id = Column(Integer, ForeignKey('charts.id', ondelete='CASCADE'), nullable=False)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    data = Column(JSON, nullable=False)  # Array of row objects
    column_types = Column(JSON, nullable=False)  # Column name -> type mapping
    row_count = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    chart = relationship("Chart", back_populates="csv_data")

class Workspace(Base):
    """Multi-tenant workspace model"""
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete='RESTRICT'), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_workspaces")
    members = relationship("WorkspaceMember", back_populates="workspace", cascade="all, delete-orphan")
    dashboards = relationship("Dashboard", back_populates="workspace", cascade="all, delete-orphan")
    settings = relationship("WorkspaceSettings", back_populates="workspace", uselist=False, cascade="all, delete-orphan")

class WorkspaceMember(Base):
    """Workspace membership and role assignment"""
    __tablename__ = "workspace_members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # 'admin', 'editor', 'viewer'
    invited_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    joined_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Composite unique constraint and check constraint
    __table_args__ = (
        UniqueConstraint('workspace_id', 'user_id', name='uq_workspace_user'),
        CheckConstraint("role IN ('admin', 'editor', 'viewer')", name='check_valid_role'),
        Index('idx_workspace_members_composite', 'user_id', 'workspace_id'),
    )

    # Relationships
    workspace = relationship("Workspace", back_populates="members")
    user = relationship("User", foreign_keys=[user_id], back_populates="workspace_memberships")
    inviter = relationship("User", foreign_keys=[invited_by])

class WorkspaceSettings(Base):
    """Workspace-specific settings and configurations"""
    __tablename__ = "workspace_settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Strongly-typed settings (NO key-value store)
    redis_enabled = Column(Boolean, default=False)
    redis_host = Column(String(255), default='localhost')
    redis_port = Column(Integer, default=6379)
    redis_password = Column(Text)  # Encrypted
    max_dashboards = Column(Integer, default=1000)
    max_members = Column(Integer, default=100)

    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace", back_populates="settings")
    updater = relationship("User")

class ConnectionPermission(Base):
    """Connection-level permissions for fine-grained access control"""
    __tablename__ = "connection_permissions"
    __table_args__ = (
        UniqueConstraint('connection_id', 'user_id', name='unique_connection_user'),
        CheckConstraint("permission_level IN ('owner', 'editor', 'viewer')", name='valid_permission_level'),
        Index('ix_connection_permissions_connection_id', 'connection_id'),
        Index('ix_connection_permissions_user_id', 'user_id'),
        Index('ix_connection_permissions_user_connection', 'user_id', 'connection_id'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    connection_id = Column(Integer, ForeignKey("connections.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    permission_level = Column(String(20), nullable=False)  # owner, editor, viewer
    granted_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    granted_at = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)

    # Relationships
    connection = relationship("Connection", back_populates="permissions")
    user = relationship("User", foreign_keys=[user_id])
    granter = relationship("User", foreign_keys=[granted_by])
