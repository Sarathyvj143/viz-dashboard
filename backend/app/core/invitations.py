"""
Workspace Invitation Token System

This module provides stateless JWT-based invitation tokens for workspace members.
No database storage required - all invitation data is encoded in the token.

Token payload:
- workspace_id: Target workspace
- email: Invitee email address
- role: Role to assign (admin, editor, viewer)
- invited_by: User ID who sent the invitation
- exp: Token expiration (7 days)
"""

import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)


# Token configuration
INVITATION_TOKEN_EXPIRE_DAYS = 7
INVITATION_SECRET_KEY = None  # Will be set from config


class InvitationError(Exception):
    """Base exception for invitation-related errors"""
    pass


class InvitationTokenExpired(InvitationError):
    """Raised when invitation token has expired"""
    pass


class InvitationTokenInvalid(InvitationError):
    """Raised when invitation token is invalid"""
    pass


def set_secret_key(secret_key: str) -> None:
    """
    Set the secret key for JWT signing.
    Should be called during application startup.

    Args:
        secret_key: Secret key from configuration
    """
    global INVITATION_SECRET_KEY
    INVITATION_SECRET_KEY = secret_key


def create_invitation_token(
    workspace_id: int,
    email: str,
    role: str,
    invited_by: int
) -> str:
    """
    Create a stateless invitation token.

    Args:
        workspace_id: ID of the workspace
        email: Email address of invitee
        role: Role to assign (admin, editor, viewer)
        invited_by: User ID who sent invitation

    Returns:
        JWT token string

    Raises:
        InvitationError: If secret key not configured
    """
    if INVITATION_SECRET_KEY is None:
        raise InvitationError("Invitation secret key not configured")

    # Validate role
    valid_roles = ['admin', 'editor', 'viewer']
    if role not in valid_roles:
        raise InvitationError(f"Invalid role: {role}. Must be one of {valid_roles}")

    # Create token payload
    now = datetime.utcnow()
    expiration = now + timedelta(days=INVITATION_TOKEN_EXPIRE_DAYS)

    payload = {
        'type': 'workspace_invitation',
        'workspace_id': workspace_id,
        'email': email.lower(),  # Normalize email to lowercase
        'role': role,
        'invited_by': invited_by,
        'iat': now,
        'exp': expiration
    }

    # Sign and encode token
    token = jwt.encode(payload, INVITATION_SECRET_KEY, algorithm='HS256')

    logger.info(
        f"Created invitation token for {email} to workspace {workspace_id} "
        f"with role {role} (expires in {INVITATION_TOKEN_EXPIRE_DAYS} days)"
    )

    return token


def decode_invitation_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate invitation token.

    Args:
        token: JWT token string

    Returns:
        Decoded token payload

    Raises:
        InvitationTokenExpired: If token has expired
        InvitationTokenInvalid: If token is invalid
        InvitationError: If secret key not configured
    """
    if INVITATION_SECRET_KEY is None:
        raise InvitationError("Invitation secret key not configured")

    try:
        # Decode and verify token
        payload = jwt.decode(
            token,
            INVITATION_SECRET_KEY,
            algorithms=['HS256']
        )

        # Validate token type
        if payload.get('type') != 'workspace_invitation':
            raise InvitationTokenInvalid("Invalid token type")

        # Validate required fields
        required_fields = ['workspace_id', 'email', 'role', 'invited_by']
        for field in required_fields:
            if field not in payload:
                raise InvitationTokenInvalid(f"Missing required field: {field}")

        logger.info(f"Successfully decoded invitation token for {payload['email']}")

        return payload

    except jwt.ExpiredSignatureError:
        logger.warning("Attempted to use expired invitation token")
        raise InvitationTokenExpired("Invitation link has expired")

    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid invitation token: {e}")
        raise InvitationTokenInvalid("Invalid invitation link")


def validate_invitation_token(
    token: str,
    email: str
) -> Dict[str, Any]:
    """
    Validate invitation token and check email match.

    Args:
        token: JWT token string
        email: Email address of user accepting invitation

    Returns:
        Decoded token payload

    Raises:
        HTTPException: If validation fails
    """
    try:
        payload = decode_invitation_token(token)

        # Check if email matches (case-insensitive)
        if payload['email'].lower() != email.lower():
            logger.warning(
                f"Email mismatch in invitation token: "
                f"expected {payload['email']}, got {email}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invitation is for a different email address"
            )

        return payload

    except InvitationTokenExpired:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation link has expired"
        )

    except InvitationTokenInvalid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invitation link"
        )

    except InvitationError as e:
        logger.error(f"Invitation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


def generate_invitation_link(
    base_url: str,
    token: str
) -> str:
    """
    Generate full invitation link URL.

    Args:
        base_url: Base URL of frontend application
        token: Invitation token

    Returns:
        Full invitation URL

    Example:
        https://app.example.com/accept-invite?token=eyJ0eXAi...
    """
    # Remove trailing slash from base_url
    base_url = base_url.rstrip('/')

    return f"{base_url}/accept-invite?token={token}"


def check_existing_membership(
    db,
    user_id: int,
    workspace_id: int
) -> bool:
    """
    Check if user is already a member of workspace.

    Args:
        db: Database session
        user_id: User ID
        workspace_id: Workspace ID

    Returns:
        True if user is already a member, False otherwise
    """
    from app.models.sqlite_models import WorkspaceMember

    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.user_id == user_id,
        WorkspaceMember.workspace_id == workspace_id
    ).first()

    return member is not None


def accept_invitation(
    db,
    token: str,
    user_id: int,
    email: str
) -> Dict[str, Any]:
    """
    Accept workspace invitation and add user as member.

    Args:
        db: Database session
        token: Invitation token
        user_id: ID of user accepting invitation
        email: Email of user accepting invitation

    Returns:
        Dictionary with workspace and role information

    Raises:
        HTTPException: If validation fails or user already a member
    """
    from app.models.sqlite_models import WorkspaceMember, Workspace

    # Validate token
    payload = validate_invitation_token(token, email)

    workspace_id = payload['workspace_id']
    role = payload['role']
    invited_by = payload['invited_by']

    # Check if user is already a member
    if check_existing_membership(db, user_id, workspace_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this workspace"
        )

    # Verify workspace exists
    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id
    ).first()

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    # Create workspace membership
    member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=user_id,
        role=role,
        invited_by=invited_by,
        joined_at=datetime.utcnow()
    )

    db.add(member)
    db.commit()
    db.refresh(member)

    logger.info(
        f"User {user_id} accepted invitation to workspace {workspace_id} "
        f"with role {role}"
    )

    return {
        'workspace_id': workspace_id,
        'workspace_name': workspace.name,
        'workspace_slug': workspace.slug,
        'role': role,
        'joined_at': member.joined_at
    }


def send_invitation_email(
    email: str,
    workspace_name: str,
    invited_by_name: str,
    invitation_link: str
) -> None:
    """
    Send invitation email to user.

    For MVP: This just logs to console.
    In production: Integrate with email service (SendGrid, SES, etc.)

    Args:
        email: Recipient email address
        workspace_name: Name of workspace
        invited_by_name: Name of user who sent invitation
        invitation_link: Full invitation URL
    """
    # MVP: Console logging only
    email_content = f"""
    ============================================================
    WORKSPACE INVITATION
    ============================================================

    To: {email}

    {invited_by_name} has invited you to join the workspace "{workspace_name}".

    Click the link below to accept the invitation:
    {invitation_link}

    This invitation will expire in {INVITATION_TOKEN_EXPIRE_DAYS} days.

    If you didn't expect this invitation, you can safely ignore this email.

    ============================================================
    """

    logger.info(f"[EMAIL] Invitation sent to {email}")
    print(email_content)

    # TODO: In production, integrate with email service:
    # import sendgrid
    # sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
    # ...
