"""
Workspace Isolation Middleware

This middleware ensures that every request is properly scoped to a workspace
and that users have permission to access the requested workspace.

CRITICAL SECURITY: This is the first line of defense against cross-workspace data access.
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class WorkspaceIsolationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to enforce workspace isolation on all API requests.

    For each request:
    1. Extract workspace_id from request (header, path, or query)
    2. Validate user has access to the workspace
    3. Inject workspace_id into request state for downstream use
    4. Return 404 (not 403) for unauthorized access to prevent workspace enumeration
    """

    # Routes that don't require workspace isolation
    EXCLUDED_PATHS = {
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/logout',
        '/api/auth/refresh',
        '/api/health',
        '/docs',
        '/openapi.json',
        '/redoc',
    }

    # Routes that should skip workspace validation (use path prefixes)
    EXCLUDED_PATH_PREFIXES = [
        '/api/dashboards/public/',  # Public dashboard sharing
    ]

    async def dispatch(self, request: Request, call_next):
        """
        Process each request to enforce workspace isolation.

        Args:
            request: The incoming HTTP request
            call_next: The next middleware or route handler

        Returns:
            HTTP response
        """
        # Skip excluded paths (public routes)
        if self._should_skip_validation(request):
            return await call_next(request)

        try:
            # Extract user from request (set by auth middleware)
            user = getattr(request.state, 'user', None)
            if not user:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Not authenticated"}
                )

            # Extract workspace_id from request
            workspace_id = self._extract_workspace_id(request)

            if workspace_id is None:
                # No workspace specified - use user's current workspace
                workspace_id = user.current_workspace_id

                if workspace_id is None:
                    return JSONResponse(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        content={"detail": "No workspace context available"}
                    )

            # Validate user has access to this workspace
            db: Session = request.state.db
            has_access = self._validate_workspace_access(db, user.id, workspace_id)

            if not has_access:
                # Return 404 instead of 403 to prevent workspace enumeration
                logger.warning(
                    f"User {user.id} attempted to access workspace {workspace_id} without permission"
                )
                return JSONResponse(
                    status_code=status.HTTP_404_NOT_FOUND,
                    content={"detail": "Resource not found"}
                )

            # Inject workspace_id into request state for downstream use
            request.state.workspace_id = workspace_id

            # Store in context var for data isolation module
            from contextvars import ContextVar
            _workspace_context: ContextVar[int] = ContextVar('workspace_id', default=None)
            _workspace_context.set(workspace_id)

            # Log successful workspace context
            logger.debug(f"Request scoped to workspace {workspace_id} for user {user.id}")

            # Continue to next middleware/handler
            response = await call_next(request)
            return response

        except Exception as e:
            logger.error(f"Workspace middleware error: {e}", exc_info=True)
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "Internal server error"}
            )

    def _should_skip_validation(self, request: Request) -> bool:
        """
        Check if this request should skip workspace validation.

        Args:
            request: The HTTP request

        Returns:
            True if validation should be skipped
        """
        path = request.url.path

        # Check exact matches
        if path in self.EXCLUDED_PATHS:
            return True

        # Check prefixes
        if path.startswith('/static/') or path.startswith('/_'):
            return True

        # Check excluded path prefixes
        for prefix in self.EXCLUDED_PATH_PREFIXES:
            if path.startswith(prefix):
                return True

        return False

    def _extract_workspace_id(self, request: Request) -> Optional[int]:
        """
        Extract workspace_id from request headers, path, or query params.

        Priority:
        1. X-Workspace-ID header
        2. workspace_id path parameter
        3. workspace_id query parameter
        4. None (will use user's current_workspace_id)

        Args:
            request: The HTTP request

        Returns:
            Workspace ID or None
        """
        # Try header first (preferred method)
        workspace_id = request.headers.get('X-Workspace-ID')
        if workspace_id:
            try:
                return int(workspace_id)
            except ValueError:
                logger.warning(f"Invalid workspace_id in header: {workspace_id}")

        # Try path parameter
        workspace_id = request.path_params.get('workspace_id')
        if workspace_id:
            try:
                return int(workspace_id)
            except ValueError:
                logger.warning(f"Invalid workspace_id in path: {workspace_id}")

        # Try query parameter
        workspace_id = request.query_params.get('workspace_id')
        if workspace_id:
            try:
                return int(workspace_id)
            except ValueError:
                logger.warning(f"Invalid workspace_id in query: {workspace_id}")

        return None

    def _validate_workspace_access(
        self,
        db: Session,
        user_id: int,
        workspace_id: int
    ) -> bool:
        """
        Validate that user has access to the specified workspace.

        Args:
            db: Database session
            user_id: ID of the user
            workspace_id: ID of the workspace

        Returns:
            True if user has access, False otherwise
        """
        from app.models.sqlite_models import WorkspaceMember

        # Check if user is a member of this workspace
        member = db.query(WorkspaceMember).filter(
            WorkspaceMember.user_id == user_id,
            WorkspaceMember.workspace_id == workspace_id
        ).first()

        return member is not None


class WorkspaceContextInjector:
    """
    Utility class to manually inject workspace context when middleware isn't used.

    Usage in route handlers:
        workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)
    """

    @staticmethod
    def get_workspace_id(request: Request, current_user=None) -> int:
        """
        Get workspace_id from request state, headers, or current user.

        Priority:
        1. request.state.workspace_id (set by WorkspaceIsolationMiddleware if enabled)
        2. X-Workspace-ID header
        3. current_user.current_workspace_id (fallback)

        Args:
            request: FastAPI request object
            current_user: Current authenticated user (optional)

        Returns:
            Workspace ID

        Raises:
            HTTPException: If no workspace context is available
        """
        # First try to get from request.state (set by middleware if enabled)
        workspace_id = getattr(request.state, 'workspace_id', None)

        # If not in state, try to get from header
        if workspace_id is None:
            workspace_header = request.headers.get('X-Workspace-ID')
            if workspace_header:
                try:
                    workspace_id = int(workspace_header)
                except ValueError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid workspace ID in header"
                    )

        # If still None and current_user provided, use their current workspace
        if workspace_id is None and current_user is not None:
            workspace_id = getattr(current_user, 'current_workspace_id', None)

        # If STILL None, raise error
        if workspace_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No workspace context available. Please select a workspace."
            )

        return workspace_id

    @staticmethod
    def require_role(
        request: Request,
        db: Session,
        required_role: str
    ) -> None:
        """
        Validate that current user has required role in current workspace.

        Args:
            request: FastAPI request object
            db: Database session
            required_role: Required role (admin, editor, viewer)

        Raises:
            HTTPException: If user doesn't have required role
        """
        from app.models.sqlite_models import WorkspaceMember

        user = request.state.user
        workspace_id = WorkspaceContextInjector.get_workspace_id(request)

        member = db.query(WorkspaceMember).filter(
            WorkspaceMember.user_id == user.id,
            WorkspaceMember.workspace_id == workspace_id
        ).first()

        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resource not found"
            )

        # Role hierarchy: admin > editor > viewer
        role_hierarchy = {'admin': 3, 'editor': 2, 'viewer': 1}

        user_role_level = role_hierarchy.get(member.role, 0)
        required_role_level = role_hierarchy.get(required_role, 0)

        if user_role_level < required_role_level:
            # Return 404 instead of 403 to prevent information disclosure
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resource not found"
            )
