import os
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "VisualizationPlatform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ENCRYPTION_MASTER_KEY: str
    ENCRYPTION_SALT: str

    # Database
    SQLITE_PATH: str = "app_metadata.db"

    # Redis (optional)
    REDIS_URL: str = ""
    REDIS_ENABLED: bool = False

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Frontend Configuration
    FRONTEND_BASE_URL: str = "http://localhost:5173"

    # Export Settings
    EXPORT_PATH: str = ""
    MAX_EXPORT_SIZE_MB: int = 50

    # Query Limits
    MAX_QUERY_RESULTS: int = 10000
    QUERY_TIMEOUT_SECONDS: int = 30

    @field_validator('SECRET_KEY')
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Validate SECRET_KEY meets minimum security requirements"""
        if not v or len(v) < 32:
            raise ValueError(
                "SECRET_KEY must be at least 32 characters. "
                "Generate one using: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )
        if v in ['your-secret-key-here-change-in-production', 'changeme', 'secret']:
            raise ValueError("SECRET_KEY is using a default/insecure value. Please change it.")
        return v

    @field_validator('ENCRYPTION_MASTER_KEY')
    @classmethod
    def validate_encryption_key(cls, v: str) -> str:
        """Validate ENCRYPTION_MASTER_KEY meets minimum requirements"""
        if not v or len(v) < 32:
            raise ValueError(
                "ENCRYPTION_MASTER_KEY must be at least 32 characters. "
                "Generate one using: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )
        return v

    @field_validator('ENCRYPTION_SALT')
    @classmethod
    def validate_encryption_salt(cls, v: str) -> str:
        """Validate ENCRYPTION_SALT is set"""
        if not v or len(v) < 16:
            raise ValueError(
                "ENCRYPTION_SALT must be at least 16 characters. "
                "Generate one using: python -c 'import secrets; print(secrets.token_urlsafe(16))'"
            )
        return v

    class Config:
        env_file = ".env"


settings = Settings()
