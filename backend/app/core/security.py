from datetime import datetime, timedelta
from jose import JWTError, jwt, ExpiredSignatureError
from passlib.context import CryptContext
from fastapi import HTTPException, status
from app.config import settings
from app.core.errors import InvalidTokenError, ExpiredTokenError

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Create JWT access token

    Args:
        data: Dictionary containing token payload (usually {"sub": username})
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify plain password against hashed password

    Args:
        plain_password: User-provided password
        hashed_password: Stored password hash

    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hash password using bcrypt

    Args:
        password: Plain text password

    Returns:
        Bcrypt hashed password
    """
    return pwd_context.hash(password)

def decode_token(token: str) -> dict:
    """
    Decode and verify JWT token

    Args:
        token: JWT token string

    Returns:
        Decoded token payload

    Raises:
        ExpiredTokenError: If token has expired
        InvalidTokenError: If token is invalid or malformed
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except ExpiredSignatureError:
        raise ExpiredTokenError("Token has expired")
    except JWTError as e:
        raise InvalidTokenError(f"Invalid token: {str(e)}")
