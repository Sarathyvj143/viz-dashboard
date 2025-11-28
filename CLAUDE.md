# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A multi-tenant data visualization platform with FastAPI backend and React/TypeScript frontend. Users create workspaces, connect to external databases (MySQL, PostgreSQL) or cloud storage (S3, Azure Blob, GCS), build charts from SQL queries or CSV uploads, and compose interactive dashboards with drag-and-drop layouts.

## Development Commands

### Frontend (React + Vite + TypeScript)
```bash
cd frontend
npm install                    # Install dependencies
npm run dev                    # Start dev server (http://localhost:5173)
npm run build                  # Build for production (runs TypeScript check first)
npm run preview                # Preview production build
npm test                       # Run Vitest tests
npm run lint                   # Run ESLint
```

### Backend (FastAPI + SQLAlchemy + Python 3.11)
```bash
cd backend
pip install -r requirements.txt   # Install dependencies
python -m uvicorn app.main:app --reload --port 8000  # Start dev server
pytest                            # Run tests
pytest tests/test_specific.py    # Run single test file
python -m pytest -v tests/        # Run tests with verbose output

# Database migrations (Alembic)
alembic revision --autogenerate -m "description"  # Generate migration
alembic upgrade head              # Apply migrations
alembic downgrade -1              # Rollback one migration
alembic current                   # Show current revision
alembic history                   # Show migration history
```

### Environment Setup
Backend requires `.env` file with:
- `SECRET_KEY` (≥32 chars): JWT token signing
- `ENCRYPTION_MASTER_KEY` (≥32 chars): Encrypts database credentials in `connections.config`
- `ENCRYPTION_SALT` (≥16 chars): Encryption salt
- `SQLITE_PATH`: Path to SQLite metadata database (default: `app_metadata.db`)
- `FRONTEND_BASE_URL`: Frontend URL for CORS and invitation links

Generate secure keys:
```bash
python -c 'import secrets; print(secrets.token_urlsafe(32))'
```

Frontend uses `.env` file with:
- `VITE_API_URL`: Backend API URL (default: `http://localhost:8000/api`)

## Architecture

### Multi-Tenancy & Workspace Isolation

**Critical Security Pattern**: All data is workspace-scoped. This is enforced at three layers:

1. **Route-level**: `WorkspaceContextInjector.get_workspace_id(request, current_user)` in each endpoint extracts workspace from `X-Workspace-ID` header or `current_user.current_workspace_id`

2. **SQLAlchemy Event Listeners** (`backend/app/core/data_isolation.py`):
   - `before_insert`: Validates `workspace_id` is set on all workspace-scoped models (Dashboard, Chart, Connection, CSVData, Log)
   - `before_update`: Prevents changing `workspace_id` after creation
   - These fire on EVERY database write operation

3. **Database Schema**: All workspace-scoped tables have `workspace_id` columns with foreign key constraints and indexes

**Important**: The `WorkspaceIsolationMiddleware` (in `workspace_middleware.py`) is currently DISABLED because it expects `request.state.user` and `request.state.db` which aren't set (this app uses dependency injection). Workspace isolation is handled at the route level instead.

### Backend Structure

```
backend/app/
├── main.py                 # FastAPI app initialization, registers routes
├── config.py              # Pydantic Settings with validation
├── models/
│   ├── sqlite_models.py   # SQLAlchemy ORM models (metadata DB)
│   └── schemas.py         # Pydantic request/response schemas
├── api/
│   ├── dependencies.py    # Dependency injection (get_db, get_current_user)
│   └── routes/            # API endpoints (auth, dashboards, charts, etc.)
├── core/
│   ├── security.py        # Password hashing, JWT tokens
│   ├── encryption.py      # Fernet encryption for connection credentials
│   ├── data_isolation.py  # SQLAlchemy event listeners for workspace isolation
│   ├── workspace_middleware.py  # Workspace context injection (currently disabled)
│   ├── permissions.py     # Workspace role checking (admin > editor > viewer)
│   ├── connection_permissions.py  # Connection-level permissions
│   └── query_engine.py    # SQL query execution against external databases
├── services/
│   ├── connection_tester.py   # Test DB connections
│   └── connection_inspector.py  # Introspect DB schemas
└── utils/
    ├── db.py              # Database session management
    ├── cache.py           # Redis caching (optional)
    ├── encryption.py      # Credential encryption utilities
    └── export_utils.py    # Dashboard export (PDF/PNG via reportlab)
```

### Frontend Structure

```
frontend/src/
├── main.tsx               # React entry point
├── App.tsx                # Root component with React Router
├── components/
│   ├── common/           # Reusable UI (Button, Input, Toast, ErrorBoundary)
│   ├── charts/           # ChartBuilder, ChartRenderer (Recharts wrapper)
│   ├── dashboard/        # Dashboard components (React Grid Layout)
│   ├── admin/            # Admin panel (UserManagement, WorkspaceInvitations)
│   ├── layout/           # MainLayout, Header, Sidebar
│   └── theme/            # ThemeProvider, ThemeSelector
├── pages/                # Page components (Login, DashboardList, UsersPage)
├── store/                # Zustand state management
│   └── dashboardStore.ts # Dashboard CRUD operations
├── api/                  # Axios API clients
│   ├── client.ts         # Axios instance with auth interceptor
│   └── dashboards.ts     # Dashboard API calls
├── types/                # TypeScript type definitions
└── utils/                # Helper functions (colorHelpers, uiHelpers)
```

### State Management

- **Frontend**: Zustand stores for dashboards, charts, users
- **Backend**: SQLAlchemy session per request (dependency injection via `get_db()`)

### Authentication Flow

1. User logs in → backend returns JWT access token
2. Frontend stores token in `localStorage`
3. Axios interceptor adds `Authorization: Bearer <token>` header to all requests
4. Backend `get_current_user` dependency validates token and returns User object
5. Routes extract `workspace_id` via `WorkspaceContextInjector.get_workspace_id(request, current_user)`

### Database Connections

External database credentials are encrypted using Fernet (symmetric encryption) before storing in `connections.config` JSON column. The `ENCRYPTION_MASTER_KEY` and `ENCRYPTION_SALT` from `.env` are used to derive the encryption key.

Connection types: `mysql`, `postgresql`, `s3`, `azure_blob`, `gcs`

### Data Sources

A `Connection` represents a database server or cloud storage account. A `DataSource` represents a specific database within that connection (for databases) or a folder path (for cloud storage). This separation allows multiple databases/folders per connection.

### Chart System

Charts can use:
1. **SQL Query**: Execute against a DataSource's external database
2. **CSV Upload**: Store data in `csv_data` table (JSON column)

Chart types: `bar`, `line`, `pie`, `scatter`, `area` (rendered via Recharts)

### Dashboard Layout

Dashboards use React Grid Layout for drag-and-drop positioning. The `layout` JSON column stores grid positions: `{x, y, w, h}` for each chart.

Public sharing: Generate time-limited `public_token` for unauthenticated access.

## Testing Patterns

### Backend Tests
- Use `pytest` with `conftest.py` for fixtures
- `tests/test_workspaces.py`: Workspace CRUD and isolation
- `tests/test_workspace_permissions.py`: Role-based access control
- `tests/test_data_isolation.py`: Validates workspace_id enforcement
- Mock database sessions for unit tests

### Frontend Tests
- Vitest + Testing Library for component tests
- Test user interactions, form validation, API error handling

## Common Patterns

### Adding a New API Endpoint

1. Define Pydantic schemas in `backend/app/models/schemas.py`
2. Add route handler in `backend/app/api/routes/`
3. Use dependencies: `current_user: User = Depends(get_current_user)`, `db: Session = Depends(get_db)`
4. Extract workspace: `workspace_id = WorkspaceContextInjector.get_workspace_id(request, current_user)`
5. Filter queries by workspace_id: `db.query(Model).filter(Model.workspace_id == workspace_id)`
6. Register router in `backend/app/main.py`

### Adding a New Frontend Page

1. Create page component in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx` (use `ProtectedRoute` wrapper for auth)
3. Create Zustand store in `frontend/src/store/` if needed
4. Create API client in `frontend/src/api/`
5. Define TypeScript types in `frontend/src/types/`

### Working with Themes

The platform supports custom themes. User theme preferences are stored in `users.theme_preference` (light, dark, auto, ocean, forest, sunset, custom) and `users.custom_theme_colors` (JSON string of ThemeColors). The `ThemeProvider` component in `frontend/src/components/theme/` manages theme state.

## Security Considerations

- **Never bypass workspace_id filters**: Always filter by `workspace_id` in queries for workspace-scoped models
- **Return 404 instead of 403**: Prevents workspace enumeration attacks
- **Encrypt sensitive config**: Database passwords in `connections.config` must be encrypted via `app.core.encryption`
- **Validate JWT tokens**: All protected routes use `get_current_user` dependency
- **SQL injection prevention**: Use SQLAlchemy parameterized queries, never string concatenation
- **Connection permissions**: Check user has permission to access a connection before running queries

## Migration Notes

When adding workspace_id to existing tables:
1. Add nullable `workspace_id` column
2. Migrate existing rows to default workspace (see `002_migrate_to_default_workspace.py`)
3. Make column non-nullable with foreign key constraint
4. Add index on `workspace_id` for query performance

## Known Issues

- Workspace isolation middleware is disabled (see `main.py` line 28-33)
- Test files (`test_*.py`) are gitignored but remain in backend directory
- The `User.role` column is deprecated in favor of `WorkspaceMember.role`
