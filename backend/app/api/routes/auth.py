"""
Authentication routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import re

from app.models.schemas import LoginRequest, LoginResponse, UserResponse, UserCreate
from app.models.sqlite_models import User, Workspace, WorkspaceMember, WorkspaceSettings
from app.core.security import verify_password, create_access_token, get_password_hash
from app.api.dependencies import get_db, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login endpoint - returns user info and JWT token
    """
    # Find user by username
    user = db.query(User).filter(User.username == credentials.username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    # Generate JWT token
    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    return LoginResponse(
        user=UserResponse.from_orm(user),
        token=token
    )


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user and create their default workspace.

    This endpoint:
    1. Creates a new user account
    2. Creates a default workspace for the user
    3. Adds user as admin of the workspace
    4. Returns JWT token for immediate login
    """
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role='admin',  # Keep for backward compatibility
        is_active=True,
        created_at=datetime.utcnow()
    )

    db.add(user)
    db.flush()  # Get user ID

    # Create default workspace using factory
    from app.core.workspace_factory import WorkspaceFactory

    workspace, member, settings = WorkspaceFactory.create_workspace(
        db=db,
        name=f"{user_data.username}'s Workspace",
        created_by_id=user.id
    )

    # Set as current workspace
    user.current_workspace_id = workspace.id

    db.commit()
    db.refresh(user)

    # Generate JWT token
    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    return LoginResponse(
        user=UserResponse.from_orm(user),
        token=token
    )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout endpoint - token invalidation happens client-side
    """
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current user information from JWT token
    """
    return UserResponse.from_orm(current_user)
