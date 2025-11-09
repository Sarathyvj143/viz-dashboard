# Quick Start: Running Workspace Tests

## Prerequisites
```bash
cd backend
pip install pytest pytest-asyncio httpx PyJWT
```

## Run All Workspace Tests
```bash
pytest tests/test_workspace*.py tests/test_data_isolation.py -v
```

## Run Individual Test Files

### 1. Workspace CRUD Tests
```bash
pytest tests/test_workspaces.py -v
```
Tests: create, list, get, update, delete, switch workspaces

### 2. Permission Tests  
```bash
pytest tests/test_workspace_permissions.py -v
```
Tests: role hierarchy, dashboard permissions, member management

### 3. Invitation Tests
```bash
pytest tests/test_workspace_invitations.py -v
```
Tests: token generation, validation, acceptance, expiration

### 4. Data Isolation Tests
```bash
pytest tests/test_data_isolation.py -v
```
Tests: cross-workspace access prevention, tampering prevention

## Quick Test Examples

### Test workspace creation
```bash
pytest tests/test_workspaces.py::TestWorkspaceCreation::test_create_workspace_success -v
```

### Test permission hierarchy
```bash
pytest tests/test_workspace_permissions.py::TestPermissionHierarchy -v
```

### Test data isolation
```bash
pytest tests/test_data_isolation.py::TestDashboardIsolation -v
```

## Coverage Report
```bash
pytest tests/test_workspace*.py tests/test_data_isolation.py \
    --cov=app.api.routes.workspaces \
    --cov=app.core.permissions \
    --cov=app.core.invitations \
    --cov-report=term-missing
```

## Test Structure

```
tests/
├── conftest.py                      # Fixtures: db_session, admin/editor/viewer users
├── test_workspaces.py               # Workspace CRUD (24 tests)
├── test_workspace_permissions.py    # Permission enforcement (20 tests)
├── test_workspace_invitations.py    # Invitation system (16 tests)
└── test_data_isolation.py           # Cross-workspace isolation (8 tests)
```

## Key Fixtures

- `admin_user` - Admin in their own workspace
- `editor_user` - Editor in admin's workspace
- `viewer_user` - Viewer in admin's workspace
- `separate_workspace_user` - User in different workspace (for isolation tests)

Each returns `(user, workspace, token)` tuple.

## Common Issues

### Import Error: No module named 'jwt'
```bash
pip install PyJWT
```

### Tests fail with 404
Check that workspace routes are mounted in `app/main.py`:
```python
app.include_router(workspaces.router, prefix="/api")
```

### Database errors
Tests use in-memory SQLite - no cleanup needed.
