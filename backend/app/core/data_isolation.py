"""
Data Isolation Enforcement Module

This module provides SQLAlchemy event listeners and validation to prevent data leaks
by ensuring workspace_id is always present in queries for workspace-scoped models.

CRITICAL SECURITY: This is the safety net that prevents cross-workspace data exposure.
"""

from sqlalchemy import event, inspect
from sqlalchemy.orm import Session
from sqlalchemy.orm.query import Query
from typing import Set, Type
import logging

logger = logging.getLogger(__name__)


# Models that require workspace isolation
WORKSPACE_SCOPED_MODELS: Set[str] = {
    'Dashboard',
    'Chart',
    'Connection',
    'Log',
    'CSVData'
}


class WorkspaceIsolationError(Exception):
    """Raised when a query attempts to access data without workspace_id filter"""
    pass


def validate_workspace_filter(query: Query, model_name: str) -> None:
    """
    Validate that a query for a workspace-scoped model includes workspace_id filter.

    Args:
        query: SQLAlchemy query object
        model_name: Name of the model being queried

    Raises:
        WorkspaceIsolationError: If workspace_id filter is missing
    """
    # Skip validation for certain system operations
    # Check if query has workspace_id in WHERE clause
    query_str = str(query.statement.compile(compile_kwargs={"literal_binds": True}))

    if 'workspace_id' not in query_str.lower():
        error_msg = (
            f"SECURITY VIOLATION: Query for {model_name} missing workspace_id filter. "
            f"This could expose data across workspaces. Query: {query_str[:200]}"
        )
        logger.error(error_msg)
        raise WorkspaceIsolationError(error_msg)


def validate_workspace_id_on_insert(mapper, connection, target):
    """
    SQLAlchemy event listener to ensure workspace_id is set before INSERT.

    Args:
        mapper: The mapper which is the target of the event
        connection: The database connection
        target: The mapped instance being persisted
    """
    model_name = target.__class__.__name__

    if model_name in WORKSPACE_SCOPED_MODELS:
        if not hasattr(target, 'workspace_id') or target.workspace_id is None:
            error_msg = (
                f"SECURITY VIOLATION: Attempted to insert {model_name} "
                f"without workspace_id. This would create orphaned data."
            )
            logger.error(error_msg)
            raise WorkspaceIsolationError(error_msg)


def validate_workspace_id_on_update(mapper, connection, target):
    """
    SQLAlchemy event listener to prevent changing workspace_id after creation.

    Args:
        mapper: The mapper which is the target of the event (unused, required by SQLAlchemy)
        connection: The database connection (unused, required by SQLAlchemy)
        target: The mapped instance being updated
    """
    model_name = target.__class__.__name__

    if model_name in WORKSPACE_SCOPED_MODELS:
        # Get the original workspace_id from history using inspect
        insp = inspect(target)
        history = insp.attrs.workspace_id.history

        if history.has_changes():
            # Get old value from history.deleted (populated in cross-session updates)
            old_id = history.deleted[0] if history.deleted else None

            # Defense-in-depth: Fallback to committed_state if deleted is empty
            if old_id is None and hasattr(insp, 'committed_state') and insp.committed_state:
                from sqlalchemy.orm.state import NO_VALUE
                committed_value = insp.committed_state.get('workspace_id')
                if committed_value is not NO_VALUE:
                    old_id = committed_value

            new_id = target.workspace_id

            # Only raise if we have an old value and it's different
            if old_id is not None and old_id != new_id:
                error_msg = (
                    f"SECURITY VIOLATION: Attempted to change workspace_id "
                    f"for {model_name} from {old_id} to {new_id}. "
                    f"This could be a data exfiltration attempt."
                )
                logger.error(error_msg)
                raise WorkspaceIsolationError(error_msg)


def register_isolation_events(Base) -> None:
    """
    Register SQLAlchemy event listeners for all workspace-scoped models.

    This should be called once during application startup after all models are defined.

    Args:
        Base: SQLAlchemy declarative base class
    """
    from sqlalchemy.orm import class_mapper

    for model_name in WORKSPACE_SCOPED_MODELS:
        try:
            # Get the model class from Base
            model_class = None
            for mapper in Base.registry.mappers:
                if mapper.class_.__name__ == model_name:
                    model_class = mapper.class_
                    break

            if model_class is None:
                logger.warning(f"Model {model_name} not found in registry. Skipping event registration.")
                continue

            # Register before_insert event
            event.listen(
                model_class,
                'before_insert',
                validate_workspace_id_on_insert,
                propagate=True
            )

            # Register before_update event
            event.listen(
                model_class,
                'before_update',
                validate_workspace_id_on_update,
                propagate=True
            )

            logger.info(f"Registered data isolation events for {model_name}")

        except Exception as e:
            logger.error(f"Failed to register isolation events for {model_name}: {e}")
            raise


class WorkspaceFilter:
    """
    Context manager for automatically adding workspace_id filter to queries.

    Usage:
        with WorkspaceFilter(session, workspace_id=1):
            dashboards = session.query(Dashboard).all()  # Auto-filtered
    """

    def __init__(self, session: Session, workspace_id: int):
        self.session = session
        self.workspace_id = workspace_id
        self._original_query = None

    def __enter__(self):
        """Set up automatic workspace filtering"""
        # Store original query method
        self._original_query = self.session.query

        # Create wrapper that adds workspace_id filter
        def filtered_query(*args, **kwargs):
            query = self._original_query(*args, **kwargs)

            # Check if querying a workspace-scoped model
            if args and hasattr(args[0], '__name__'):
                model_name = args[0].__name__
                if model_name in WORKSPACE_SCOPED_MODELS:
                    query = query.filter_by(workspace_id=self.workspace_id)

            return query

        # Replace session.query with filtered version
        self.session.query = filtered_query
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Restore original query method"""
        if self._original_query:
            self.session.query = self._original_query


def get_workspace_from_context() -> int:
    """
    Get current workspace_id from request context.

    This should be set by authentication middleware.

    Returns:
        Workspace ID from current context

    Raises:
        WorkspaceIsolationError: If no workspace context is set
    """
    from contextvars import ContextVar

    # This will be set by middleware
    _workspace_context: ContextVar[int] = ContextVar('workspace_id', default=None)

    workspace_id = _workspace_context.get()
    if workspace_id is None:
        raise WorkspaceIsolationError(
            "No workspace context set. Ensure authentication middleware is running."
        )

    return workspace_id


# Utility function for manual validation in critical paths
def require_workspace_id(workspace_id: int | None, operation: str) -> int:
    """
    Validate that workspace_id is present, or raise exception.

    Args:
        workspace_id: The workspace ID to validate
        operation: Description of the operation (for error message)

    Returns:
        The validated workspace_id

    Raises:
        WorkspaceIsolationError: If workspace_id is None
    """
    if workspace_id is None:
        error_msg = f"SECURITY VIOLATION: {operation} attempted without workspace_id"
        logger.error(error_msg)
        raise WorkspaceIsolationError(error_msg)

    return workspace_id
