"""
API dependencies for authentication and database access
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Generator
from app.utils.db import SessionLocal
from app.core.security import decode_token
from app.core.errors import AuthenticationError
from app.models.sqlite_models import User

security = HTTPBearer()


def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency
    Yields a database session and ensures it's closed after use
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token

    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials

    try:
        payload = decode_token(token)
        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
    except AuthenticationError:
        # Catch specific authentication errors (InvalidTokenError, ExpiredTokenError)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    # Let other unexpected exceptions propagate for proper error tracking

    user = db.query(User).filter(User.id == user_id).first()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    return user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Verify current user has admin role

    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user


async def get_current_editor_or_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Verify current user has editor or admin role

    Raises:
        HTTPException: If user is only a viewer
    """
    if current_user.role not in ["editor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Editor or admin access required"
        )

    return current_user
