"""
Pydantic schemas for API request/response validation
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# Auth Schemas
class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, description="Username")
    password: str = Field(..., min_length=6, description="Password")


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    user: UserResponse
    token: str


# User Management Schemas
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(default="viewer", pattern="^(admin|editor|viewer)$")


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = Field(None, pattern="^(admin|editor|viewer)$")
    is_active: Optional[bool] = None


# Connection Test Schemas
class ConnectionTestResult(BaseModel):
    success: bool
    message: str
    details: Optional[dict] = None

    class Config:
        from_attributes = True


# Connection Schemas
class ConnectionBase(BaseModel):
    name: str = Field(..., max_length=100)
    type: str = Field(..., pattern="^(mysql|postgresql|s3|azure_blob|gcs)$")
    config: dict


class ConnectionCreate(ConnectionBase):
    pass


class ConnectionUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    config: Optional[dict] = None
    is_active: Optional[bool] = None


class ConnectionResponse(ConnectionBase):
    id: int
    is_active: bool
    created_at: datetime
    created_by: int

    class Config:
        from_attributes = True


# DataSource Schemas
class DataSourceBase(BaseModel):
    connection_id: int
    name: str = Field(..., max_length=100)
    source_type: str = Field(..., pattern="^(database|folder)$")
    source_identifier: str = Field(..., max_length=500)  # database name or folder path


class DataSourceCreate(DataSourceBase):
    pass


class DataSourceUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    source_identifier: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class DataSourceResponse(DataSourceBase):
    id: int
    is_active: bool
    workspace_id: int
    created_at: datetime
    created_by: int

    class Config:
        from_attributes = True


# Chart Schemas
class ChartBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    chart_type: str = Field(..., pattern="^(bar|line|pie|scatter|area)$")
    config: dict
    data_source_id: Optional[int] = None
    query: Optional[str] = None


class ChartCreate(ChartBase):
    pass


class ChartUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    chart_type: Optional[str] = Field(None, pattern="^(bar|line|pie|scatter|area)$")
    config: Optional[dict] = None
    data_source_id: Optional[int] = None
    query: Optional[str] = None


class ChartResponse(ChartBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Dashboard Schemas
class DashboardBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    layout: dict
    is_public: bool = False


class DashboardCreate(DashboardBase):
    pass


class DashboardUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    layout: Optional[dict] = None
    is_public: Optional[bool] = None


class DashboardResponse(DashboardBase):
    id: int
    public_token: Optional[str] = None
    public_token_expires_at: Optional[datetime] = None
    public_access_count: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Workspace Schemas
class WorkspaceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Workspace name")


class WorkspaceCreate(WorkspaceBase):
    """Create workspace request - slug is auto-generated"""
    pass


class WorkspaceUpdate(BaseModel):
    """Update workspace request - only name can be updated"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)


class WorkspaceResponse(WorkspaceBase):
    """Workspace response with all fields"""
    id: int
    slug: str
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Workspace Member Schemas
class WorkspaceMemberResponse(BaseModel):
    """Workspace member details"""
    id: int
    workspace_id: int
    user_id: int
    role: str = Field(..., pattern="^(admin|editor|viewer)$")
    invited_by: Optional[int] = None
    joined_at: datetime

    class Config:
        from_attributes = True


class InviteMemberRequest(BaseModel):
    """Invite member to workspace"""
    email: EmailStr = Field(..., description="Email address of user to invite")
    role: str = Field(..., pattern="^(admin|editor|viewer)$", description="Role: admin, editor, or viewer")


class UpdateMemberRoleRequest(BaseModel):
    """Update member role"""
    role: str = Field(..., pattern="^(admin|editor|viewer)$", description="New role: admin, editor, or viewer")


# Workspace Settings Schemas
class WorkspaceSettingsBase(BaseModel):
    redis_enabled: bool = False
    redis_host: str = "localhost"
    redis_port: int = Field(default=6379, ge=1, le=65535)
    redis_password: Optional[str] = None
    max_dashboards: int = Field(default=1000, ge=1, le=10000)
    max_members: int = Field(default=100, ge=1, le=1000)


class WorkspaceSettingsUpdate(BaseModel):
    """Update workspace settings - all fields optional"""
    redis_enabled: Optional[bool] = None
    redis_host: Optional[str] = None
    redis_port: Optional[int] = Field(None, ge=1, le=65535)
    redis_password: Optional[str] = None
    max_dashboards: Optional[int] = Field(None, ge=1, le=10000)
    max_members: Optional[int] = Field(None, ge=1, le=1000)


class WorkspaceSettingsResponse(WorkspaceSettingsBase):
    """Workspace settings response"""
    id: int
    workspace_id: int
    updated_by: Optional[int] = None
    updated_at: datetime

    class Config:
        from_attributes = True


# Invitation Schemas
class AcceptInvitationRequest(BaseModel):
    """Accept workspace invitation with token"""
    token: str = Field(..., description="Invitation token from email")


# Connection Permission Schemas
class ConnectionPermissionBase(BaseModel):
    """Base schema for connection permissions"""
    permission_level: str = Field(..., pattern="^(owner|editor|viewer)$", description="Permission level for the connection")


class ConnectionPermissionCreate(ConnectionPermissionBase):
    """Create connection permission request"""
    user_id: int = Field(..., description="User ID to grant permission to")


class ConnectionPermissionUpdate(BaseModel):
    """Update connection permission request"""
    permission_level: str = Field(..., pattern="^(owner|editor|viewer)$", description="New permission level")


class ConnectionPermissionResponse(ConnectionPermissionBase):
    """Connection permission response"""
    id: int
    connection_id: int
    user_id: int
    username: Optional[str] = None
    email: Optional[str] = None
    granted_by: int
    granted_at: datetime

    class Config:
        from_attributes = True


# Enhanced User Management Schemas
class UserListItem(BaseModel):
    """User item for list view"""
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    workspace_count: int = 0

    class Config:
        from_attributes = True


class UserWorkspaceMembership(BaseModel):
    """User's workspace membership info"""
    workspace_id: int
    workspace_name: str
    role: str
    joined_at: datetime

    class Config:
        from_attributes = True


class UserDetailResponse(UserResponse):
    """Detailed user information with workspace memberships"""
    email_verified: bool
    current_workspace_id: Optional[int] = None
    workspaces: list[UserWorkspaceMembership] = []

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Paginated user list response"""
    users: list[UserListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class PasswordChangeRequest(BaseModel):
    """Request to change user password"""
    current_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)


class AdminPasswordResetRequest(BaseModel):
    """Admin request to reset user password"""
    new_password: str = Field(..., min_length=6)


class ThemePreferenceUpdate(BaseModel):
    """Request to update user theme preference"""
    theme: str = Field(..., pattern="^(light|dark|auto|ocean|forest|sunset|custom)$", description="Theme preference")
    custom_colors: Optional[dict] = Field(None, description="Custom theme colors (required when theme is 'custom')")
