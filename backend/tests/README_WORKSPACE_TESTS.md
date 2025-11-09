# Workspace Multi-Tenancy Test Suite

This directory contains comprehensive tests for the multi-tenant workspace implementation in the FastAPI backend.

## Test Files Created

### 1. `test_workspaces.py` (215 lines)
Tests for workspace CRUD operations and lifecycle management.

**Test Coverage:**
- ✅ Workspace creation with auto-generated slugs
- ✅ Duplicate slug handling with numeric suffixes  
- ✅ Workspace listing (users only see their workspaces)
- ✅ Workspace retrieval with membership checks
- ✅ Workspace updates (admin-only)
- ✅ Workspace deletion (creator-only) with CASCADE
- ✅ Workspace switching for multi-workspace users
- ✅ Auto-creation of default workspace on registration
- ✅ Creator automatically becomes admin member

**Key Test Classes:**
- `TestWorkspaceCreation` - 6 tests
- `TestWorkspaceListing` - 3 tests
- `TestWorkspaceRetrieval` - 4 tests
- `TestWorkspaceUpdate` - 4 tests
- `TestWorkspaceDeletion` - 4 tests
- `TestWorkspaceSwitching` - 3 tests

### 2. `test_workspace_permissions.py` (196 lines)
Tests for role-based access control and permission enforcement.

**Test Coverage:**
- ✅ Role hierarchy (admin > editor > viewer)
- ✅ Permission checks for different operations
- ✅ Viewers can only read (cannot create/edit)
- ✅ Editors can create/modify own resources
- ✅ Editors cannot modify others' resources
- ✅ Admins can manage everything in workspace
- ✅ Non-members have no permissions
- ✅ Permission denial returns 404 (not 403) for security
- ✅ Member management permissions (invite/remove/role changes)
- ✅ Cannot change own role
- ✅ Cannot remove workspace creator

**Key Test Classes:**
- `TestPermissionHierarchy` - 4 tests
- `TestDashboardPermissions` - 6 tests
- `TestMemberManagementPermissions` - 7 tests
- `TestWorkspaceSettingsPermissions` - 3 tests

### 3. `test_workspace_invitations.py` (117 lines)
Tests for the JWT-based invitation token system.

**Test Coverage:**
- ✅ Invitation token generation with correct payload
- ✅ Email normalization to lowercase
- ✅ Token validation and decoding
- ✅ Expired token rejection
- ✅ Invalid token handling
- ✅ Email validation (invitation can only be accepted by intended email)
- ✅ Duplicate membership prevention
- ✅ Role assignment on acceptance
- ✅ Admin-only invitation sending
- ✅ Invalid role rejection

**Key Test Classes:**
- `TestInvitationTokenGeneration` - 4 tests
- `TestInvitationTokenValidation` - 4 tests
- `TestInvitationEndpoint` - 4 tests
- `TestInvitationAcceptance` - 4 tests

### 4. `test_data_isolation.py` (175 lines)
Tests for cross-workspace data isolation and security.

**Test Coverage:**
- ✅ Dashboard listing is workspace-scoped
- ✅ Users cannot access dashboards from other workspaces
- ✅ Users cannot update dashboards from other workspaces
- ✅ Users cannot delete dashboards from other workspaces
- ✅ workspace_id tampering prevention
- ✅ Member lists are workspace-scoped
- ✅ Cannot list members of other workspaces
- ✅ Data scope changes correctly when switching workspaces

**Key Test Classes:**
- `TestDashboardIsolation` - 4 tests
- `TestWorkspaceIdTamperingPrevention` - 1 test
- `TestMemberListIsolation` - 2 tests
- `TestDataIsolationAfterWorkspaceSwitch` - 1 test

## Test Fixtures (`conftest.py`)

The test suite uses pytest fixtures for clean test isolation:

### Database Fixtures
- `db_session` - Fresh in-memory SQLite database for each test
- Automatically creates and drops all tables
- Complete isolation between tests

### User Fixtures
- `admin_user` - User with admin role in their own workspace
- `editor_user` - User with editor role in admin's workspace
- `viewer_user` - User with viewer role in admin's workspace  
- `separate_workspace_user` - User in completely separate workspace (for isolation tests)

All fixtures return tuples of `(user, workspace, token)` for easy testing.

### Client Fixture
- `client` - FastAPI TestClient with database override
- Automatically uses test database for all requests

## Running the Tests

### Run all workspace tests
```bash
cd backend
python -m pytest tests/test_workspace*.py tests/test_data_isolation.py -v
```

### Run specific test file
```bash
python -m pytest tests/test_workspaces.py -v
python -m pytest tests/test_workspace_permissions.py -v
python -m pytest tests/test_workspace_invitations.py -v
python -m pytest tests/test_data_isolation.py -v
```

### Run specific test class
```bash
python -m pytest tests/test_workspaces.py::TestWorkspaceCreation -v
python -m pytest tests/test_workspace_permissions.py::TestPermissionHierarchy -v
```

### Run specific test
```bash
python -m pytest tests/test_workspaces.py::TestWorkspaceCreation::test_create_workspace_success -v
```

### Run with coverage
```bash
python -m pytest tests/test_workspace*.py tests/test_data_isolation.py --cov=app.api.routes.workspaces --cov=app.core.permissions --cov=app.core.invitations --cov=app.core.data_isolation --cov-report=html
```

## Test Statistics

| Metric | Count |
|--------|-------|
| Total Test Files | 4 |
| Total Lines of Test Code | ~700 |
| Total Test Cases | ~40 |
| Test Coverage Areas | 8 |

### Coverage by Feature

| Feature | Test File | Tests |
|---------|-----------|-------|
| Workspace CRUD | `test_workspaces.py` | 24 |
| Permissions & Roles | `test_workspace_permissions.py` | 20 |
| Invitations | `test_workspace_invitations.py` | 16 |
| Data Isolation | `test_data_isolation.py` | 8 |

## Security Tests

The test suite includes specific security-focused tests:

1. **Data Isolation**
   - Cross-workspace data access prevention
   - workspace_id tampering prevention
   - 404 responses (not 403) to prevent enumeration

2. **Permission Enforcement**
   - Role hierarchy enforcement
   - Operation-specific permission checks
   - Owner/creator restrictions

3. **Invitation Security**
   - Token expiration validation
   - Email validation on acceptance
   - Duplicate membership prevention

## Test Design Principles

1. **Isolation** - Each test uses fresh database (in-memory SQLite)
2. **Clarity** - Descriptive test names and docstrings
3. **Coverage** - Tests cover happy paths, edge cases, and security scenarios
4. **Maintainability** - DRY principles with reusable fixtures
5. **Security-First** - Tests verify both functionality AND security

## Future Test Additions

Consider adding tests for:
- [ ] Concurrent workspace operations
- [ ] Workspace resource limits enforcement
- [ ] Bulk member operations
- [ ] Workspace export/import
- [ ] Chart and connection isolation (similar to dashboards)
- [ ] Performance tests for large workspaces
- [ ] Webhook/notification tests for invitations

## Dependencies

Tests require:
- `pytest` >= 7.4.0
- `pytest-asyncio` >= 0.21.0  
- `httpx` >= 0.25.0 (for TestClient)
- `PyJWT` for invitation token tests
- All application dependencies (FastAPI, SQLAlchemy, etc.)

## Troubleshooting

### ModuleNotFoundError for jwt
```bash
pip install PyJWT
```

### Database locked errors
- Tests use in-memory SQLite (`:memory:`)
- No cleanup needed between runs

### Import errors
- Ensure `PYTHONPATH` includes backend directory
- Or run from `backend/` directory

### 404 errors in tests
- Check that routes are properly mounted in `app/main.py`
- Verify middleware is configured correctly
- Check workspace context injection
