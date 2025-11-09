import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Set test environment variables
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only-change-in-production-very-long-secret"
os.environ["ENCRYPTION_MASTER_KEY"] = "test-encryption-master-key-32bytes-very-secure"
os.environ["ENCRYPTION_SALT"] = "test-encryption-salt-16bytes"
os.environ["SQLITE_PATH"] = ":memory:"  # Use in-memory database for tests
os.environ["DEBUG"] = "True"


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """
    Create a fresh database session for each test.
    Uses in-memory SQLite database for isolation.
    """
    from app.models.sqlite_models import Base
    from app.core.invitations import set_secret_key

    # Create in-memory database
    engine = create_engine("sqlite:///:memory:", echo=False)

    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Set invitation secret key
    set_secret_key(os.environ["SECRET_KEY"])

    # Create session factory
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session: Session):
    """
    Create FastAPI test client with test database.
    """
    from app.main import app
    from app.api.dependencies import get_db

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db_session: Session):
    """
    Create a test admin user with workspace.

    Returns:
        Tuple of (user, workspace, token)
    """
    from app.models.sqlite_models import User, Workspace, WorkspaceMember, WorkspaceSettings
    from app.core.security import get_password_hash, create_access_token
    from datetime import datetime

    # Create user
    user = User(
        username="admin_test",
        email="admin@test.com",
        password_hash=get_password_hash("testpassword123"),
        role="admin",
        is_active=True,
        created_at=datetime.utcnow()
    )
    db_session.add(user)
    db_session.flush()

    # Create workspace
    workspace = Workspace(
        name="Admin's Workspace",
        slug="admin-workspace",
        created_by=user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db_session.add(workspace)
    db_session.flush()

    # Add user as admin member
    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=user.id,
        role='admin',
        invited_by=user.id,
        joined_at=datetime.utcnow()
    )
    db_session.add(member)

    # Create workspace settings
    settings = WorkspaceSettings(
        workspace_id=workspace.id,
        redis_enabled=False,
        max_dashboards=1000,
        max_members=100
    )
    db_session.add(settings)

    # Set current workspace
    user.current_workspace_id = workspace.id

    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(workspace)

    # Generate token
    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    return user, workspace, token


@pytest.fixture
def editor_user(db_session: Session, admin_user):
    """
    Create a test editor user in the same workspace as admin.

    Returns:
        Tuple of (user, workspace, token)
    """
    from app.models.sqlite_models import User, WorkspaceMember
    from app.core.security import get_password_hash, create_access_token
    from datetime import datetime

    admin, workspace, _ = admin_user

    # Create user
    user = User(
        username="editor_test",
        email="editor@test.com",
        password_hash=get_password_hash("testpassword123"),
        role="editor",
        is_active=True,
        current_workspace_id=workspace.id,
        created_at=datetime.utcnow()
    )
    db_session.add(user)
    db_session.flush()

    # Add as editor member
    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=user.id,
        role='editor',
        invited_by=admin.id,
        joined_at=datetime.utcnow()
    )
    db_session.add(member)

    db_session.commit()
    db_session.refresh(user)

    # Generate token
    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    return user, workspace, token


@pytest.fixture
def viewer_user(db_session: Session, admin_user):
    """
    Create a test viewer user in the same workspace as admin.

    Returns:
        Tuple of (user, workspace, token)
    """
    from app.models.sqlite_models import User, WorkspaceMember
    from app.core.security import get_password_hash, create_access_token
    from datetime import datetime

    admin, workspace, _ = admin_user

    # Create user
    user = User(
        username="viewer_test",
        email="viewer@test.com",
        password_hash=get_password_hash("testpassword123"),
        role="viewer",
        is_active=True,
        current_workspace_id=workspace.id,
        created_at=datetime.utcnow()
    )
    db_session.add(user)
    db_session.flush()

    # Add as viewer member
    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=user.id,
        role='viewer',
        invited_by=admin.id,
        joined_at=datetime.utcnow()
    )
    db_session.add(member)

    db_session.commit()
    db_session.refresh(user)

    # Generate token
    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    return user, workspace, token


@pytest.fixture
def separate_workspace_user(db_session: Session):
    """
    Create a user in a completely separate workspace.
    Used for testing data isolation.

    Returns:
        Tuple of (user, workspace, token)
    """
    from app.models.sqlite_models import User, Workspace, WorkspaceMember, WorkspaceSettings
    from app.core.security import get_password_hash, create_access_token
    from datetime import datetime

    # Create user
    user = User(
        username="separate_user",
        email="separate@test.com",
        password_hash=get_password_hash("testpassword123"),
        role="admin",
        is_active=True,
        created_at=datetime.utcnow()
    )
    db_session.add(user)
    db_session.flush()

    # Create separate workspace
    workspace = Workspace(
        name="Separate Workspace",
        slug="separate-workspace",
        created_by=user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db_session.add(workspace)
    db_session.flush()

    # Add user as admin member
    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=user.id,
        role='admin',
        invited_by=user.id,
        joined_at=datetime.utcnow()
    )
    db_session.add(member)

    # Create workspace settings
    settings = WorkspaceSettings(
        workspace_id=workspace.id,
        redis_enabled=False,
        max_dashboards=1000,
        max_members=100
    )
    db_session.add(settings)

    # Set current workspace
    user.current_workspace_id = workspace.id

    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(workspace)

    # Generate token
    token = create_access_token(data={"sub": str(user.id), "role": user.role})

    return user, workspace, token
