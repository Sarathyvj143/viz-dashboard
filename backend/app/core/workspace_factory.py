"""
Centralized workspace creation logic.

Provides a consistent factory pattern for creating workspaces with proper
settings, membership, and slug generation.
"""

from sqlalchemy.orm import Session
from app.models.sqlite_models import Workspace, WorkspaceMember, WorkspaceSettings, User
from datetime import datetime
from typing import Optional, Tuple, Dict, Any
import re
import logging

logger = logging.getLogger(__name__)


class WorkspaceFactory:
    """Factory for creating workspaces with consistent settings."""

    @staticmethod
    def create_workspace(
        db: Session,
        name: str,
        created_by_id: int,
        slug: Optional[str] = None,
        settings_overrides: Optional[Dict[str, Any]] = None
    ) -> Tuple[Workspace, WorkspaceMember, WorkspaceSettings]:
        """
        Create a workspace with member and settings.

        Args:
            db: Database session
            name: Workspace name
            created_by_id: User ID of creator
            slug: Optional custom slug (auto-generated if not provided)
            settings_overrides: Optional dict of setting overrides

        Returns:
            Tuple of (workspace, member, settings)

        Raises:
            ValueError: If creator user doesn't exist
        """
        # Validate creator exists
        creator = db.query(User).filter(User.id == created_by_id).first()
        if not creator:
            raise ValueError(f"User {created_by_id} not found")

        # Generate slug if not provided
        if slug is None:
            slug = WorkspaceFactory._generate_unique_slug(db, name)

        # Create workspace
        workspace = Workspace(
            name=name,
            slug=slug,
            created_by=created_by_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(workspace)
        db.flush()  # Get ID

        logger.info(f"Created workspace: {name} (slug: {slug}, ID: {workspace.id})")

        # Add creator as admin member
        member = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=created_by_id,
            role='admin',
            invited_by=created_by_id,
            joined_at=datetime.utcnow()
        )
        db.add(member)

        # Create default settings (with overrides)
        default_settings = {
            'redis_enabled': False,
            'redis_host': 'localhost',
            'redis_port': 6379,
            'max_dashboards': 1000,
            'max_members': 100
        }
        if settings_overrides:
            default_settings.update(settings_overrides)

        settings = WorkspaceSettings(
            workspace_id=workspace.id,
            **default_settings
        )
        db.add(settings)

        logger.info(f"Created workspace settings and added creator as admin")

        return workspace, member, settings

    @staticmethod
    def _generate_unique_slug(db: Session, name: str) -> str:
        """
        Generate unique slug from workspace name.

        Args:
            db: Database session
            name: Workspace name

        Returns:
            Unique slug string
        """
        # Clean name to create base slug
        base_slug = re.sub(r'[^a-z0-9-]', '', name.lower().replace(' ', '-'))
        base_slug = re.sub(r'-+', '-', base_slug).strip('-') or 'workspace'

        # Ensure uniqueness by appending counter if needed
        slug = base_slug
        counter = 1
        while db.query(Workspace).filter(Workspace.slug == slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        return slug

    @staticmethod
    def create_default_workspace(
        db: Session,
        created_by_id: Optional[int] = None
    ) -> Tuple[Workspace, WorkspaceMember, WorkspaceSettings]:
        """
        Create the default workspace for migration scenarios.

        This is a specialized factory method for creating the "Default Workspace"
        during database migrations or system initialization.

        Args:
            db: Database session
            created_by_id: Optional user ID of creator (uses first active user if not provided)

        Returns:
            Tuple of (workspace, member, settings)

        Raises:
            ValueError: If no active users found and created_by_id not provided
        """
        # Get creator (first active user if not provided)
        if created_by_id is None:
            creator = db.query(User).filter(User.is_active == True).first()
            if not creator:
                raise ValueError("No active users found. Cannot create default workspace.")
            created_by_id = creator.id

        # Check if default workspace already exists
        existing = db.query(Workspace).filter(Workspace.slug == 'default').first()
        if existing:
            logger.info(f"Default workspace already exists: '{existing.name}' (ID: {existing.id})")
            # Get existing member and settings
            member = db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == existing.id,
                WorkspaceMember.user_id == created_by_id
            ).first()
            settings = db.query(WorkspaceSettings).filter(
                WorkspaceSettings.workspace_id == existing.id
            ).first()
            return existing, member, settings

        # Create new default workspace with fixed slug
        return WorkspaceFactory.create_workspace(
            db=db,
            name='Default Workspace',
            created_by_id=created_by_id,
            slug='default'
        )
