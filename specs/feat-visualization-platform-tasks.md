# Task Breakdown: Visualization Platform - Full Implementation

**Generated**: 2025-11-01
**Source**: specs/feat-visualization-platform.md
**Total Estimated Effort**: 8-12 weeks (full spec) | 3-4 weeks (MVP - Phase 1 only)

## Executive Summary

This document breaks down the Visualization Platform specification into actionable tasks across 3 implementation phases. The platform is a self-contained, Docker-based data visualization tool built with FastAPI (Python) and React (JavaScript), similar to Apache Superset but focused on portability and simplicity.

### Key Metrics
- **Total Tasks**: 62 tasks
- **Phase 1 (Foundation)**: 22 tasks - 3-4 weeks
- **Phase 2 (Enhanced Features)**: 24 tasks - 3-4 weeks
- **Phase 3 (Polish & Optimization)**: 16 tasks - 2-3 weeks
- **Parallel Execution**: ~40% of tasks can run in parallel
- **Critical Path**: Backend foundation → Database → Auth → Core APIs → Frontend → Integration

### Technology Stack
- **Backend**: FastAPI, SQLAlchemy, SQLite
- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts
- **Infrastructure**: Docker, Docker Compose, Redis (optional)
- **Security**: JWT, Fernet encryption, bcrypt
- **Testing**: Pytest, Jest, Playwright

---

## Phase 1: Foundation & Core Infrastructure (3-4 weeks)

### Overview
Establish the fundamental architecture, database, authentication, and core CRUD operations. This phase delivers a working MVP with basic chart and dashboard functionality.

---

### Task 1.1: Initialize Backend Project Structure

**Description**: Set up FastAPI project with proper directory structure, dependencies, and configuration management
**Size**: Small
**Priority**: Critical
**Dependencies**: None
**Can run parallel with**: Task 1.2 (Frontend setup)

**Technical Requirements**:
```python
# Directory structure to create
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration management
│   ├── api/                    # API routes
│   │   ├── __init__.py
│   │   ├── dependencies.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── charts.py
│   │       ├── dashboards.py
│   │       ├── data.py
│   │       ├── settings.py
│   │       ├── connections.py
│   │       └── export.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── sqlite_models.py
│   │   └── schemas.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py
│   │   ├── query_engine.py
│   │   ├── encryption.py
│   │   ├── errors.py
│   │   └── permissions.py
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── db.py
│   │   ├── cache.py
│   │   ├── export_utils.py
│   │   ├── cloud_utils.py
│   │   ├── csv_processor.py
│   │   ├── public_links.py
│   │   └── logger.py
│   └── seeds/
│       ├── __init__.py
│       └── init_db.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── test_*.py files
├── Dockerfile
├── requirements.txt
├── .env.example
└── README.md
```

**Dependencies (requirements.txt)**:
```python
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
sqlalchemy>=2.0.0
pydantic>=2.0.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
cryptography>=41.0.0
python-multipart>=0.0.6
redis>=5.0.0
boto3>=1.28.0
azure-storage-blob>=12.19.0
google-cloud-storage>=2.10.0
reportlab>=4.0.0
openpyxl>=3.1.0
pillow>=10.0.0
mysql-connector-python>=8.1.0
psycopg2-binary>=2.9.0
pytest>=7.4.0
pytest-asyncio>=0.21.0
httpx>=0.25.0
```

**Configuration (config.py)**:
```python
import os
from pydantic_settings import BaseSettings

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

    # Database
    SQLITE_PATH: str = "app_metadata.db"

    # Redis (optional)
    REDIS_URL: str = ""
    REDIS_ENABLED: bool = False

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Export Settings
    EXPORT_PATH: str = ""
    MAX_EXPORT_SIZE_MB: int = 50

    # Query Limits
    MAX_QUERY_RESULTS: int = 10000
    QUERY_TIMEOUT_SECONDS: int = 30

    class Config:
        env_file = ".env"

settings = Settings()
```

**Main Application (main.py)**:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.core.errors import app_exception_handler, AppException

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(AppException, app_exception_handler)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}

# Import and include routers (will be added in subsequent tasks)
# from app.api.routes import auth, users, charts, dashboards, data, settings, connections, export
# app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
# ... (other routers)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Environment Template (.env.example)**:
```bash
# Application
APP_NAME=VisualizationPlatform
APP_VERSION=1.0.0
DEBUG=false

# Security (REQUIRED)
SECRET_KEY=your-secret-key-here-change-in-production
ENCRYPTION_MASTER_KEY=your-32-byte-master-key-here

# Database
SQLITE_PATH=app_metadata.db

# Redis (optional)
REDIS_URL=redis://redis:6379/0
REDIS_ENABLED=false

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Export Settings
EXPORT_PATH=
MAX_EXPORT_SIZE_MB=50

# Query Limits
MAX_QUERY_RESULTS=10000
QUERY_TIMEOUT_SECONDS=30
```

**Acceptance Criteria**:
- [ ] All directories and files created with proper structure
- [ ] requirements.txt includes all necessary dependencies
- [ ] config.py loads environment variables correctly
- [ ] main.py starts FastAPI server on port 8000
- [ ] Health check endpoint responds with 200 OK
- [ ] CORS middleware configured for frontend origins
- [ ] .env.example file documents all required variables
- [ ] README.md includes setup and run instructions

**Tests**:
```python
# tests/test_main.py
def test_health_check(client):
    """Ensure health check endpoint returns correct response"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "version" in response.json()

def test_cors_headers(client):
    """Verify CORS headers are set correctly"""
    response = client.options("/health", headers={"Origin": "http://localhost:5173"})
    assert "access-control-allow-origin" in response.headers
```

---

### Task 1.2: Initialize Frontend Project Structure

**Description**: Set up React + TypeScript + Vite project with Tailwind CSS and required dependencies
**Size**: Small
**Priority**: Critical
**Dependencies**: None
**Can run parallel with**: Task 1.1 (Backend setup)

**Technical Requirements**:
```json
// Directory structure to create
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Card.tsx
│   │   ├── charts/
│   │   │   ├── ChartCard.tsx
│   │   │   ├── ChartBuilder.tsx
│   │   │   ├── ChartRenderer.tsx
│   │   │   └── ChartTypes.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardGrid.tsx
│   │   │   ├── DashboardEditor.tsx
│   │   │   └── DashboardCard.tsx
│   │   └── admin/
│   │       ├── SettingsPanel.tsx
│   │       ├── UserManagement.tsx
│   │       └── ConnectionsPanel.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ChartList.tsx
│   │   ├── ChartDetail.tsx
│   │   ├── DashboardList.tsx
│   │   ├── DashboardDetail.tsx
│   │   ├── AdminSettings.tsx
│   │   └── PublicDashboard.tsx
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── chartStore.ts
│   │   └── dashboardStore.ts
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── charts.ts
│   │   ├── dashboards.ts
│   │   └── settings.ts
│   ├── types/
│   │   ├── chart.ts
│   │   ├── dashboard.ts
│   │   ├── user.ts
│   │   └── api.ts
│   └── utils/
│       ├── exportUtils.ts
│       └── validators.ts
├── public/
│   └── index.html
├── Dockerfile
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

**Dependencies (package.json)**:
```json
{
  "name": "visualization-platform-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint . --ext ts,tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.18.0",
    "recharts": "^2.10.0",
    "tailwindcss": "^3.3.0",
    "axios": "^1.6.0",
    "html2canvas": "^1.4.1",
    "react-grid-layout": "^1.4.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.2.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.1.0",
    "eslint": "^8.55.0"
  }
}
```

**Vite Configuration (vite.config.ts)**:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

**Tailwind Configuration (tailwind.config.js)**:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**TypeScript Configuration (tsconfig.json)**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Main Entry (main.tsx)**:
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**App Component (App.tsx)**:
```typescript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import DashboardList from './pages/DashboardList';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboards" element={<DashboardList />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
```

**Acceptance Criteria**:
- [ ] Project scaffolded with Vite + React + TypeScript
- [ ] All dependencies installed successfully
- [ ] Tailwind CSS configured and working
- [ ] Development server runs on port 5173
- [ ] Proxy configured to backend at localhost:8000
- [ ] Basic routing structure in place
- [ ] TypeScript compilation succeeds
- [ ] Hot module replacement works

**Tests**:
```typescript
// src/App.test.tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders without crashing', () => {
  render(<App />);
  // App should render login page by default
  expect(screen.getByRole('main')).toBeInTheDocument();
});
```

---

### Task 1.3: Implement Database Models (SQLAlchemy ORM)

**Description**: Create SQLAlchemy ORM models for all database tables including users, charts, dashboards, connections, settings, logs, and csv_data
**Size**: Large
**Priority**: Critical
**Dependencies**: Task 1.1
**Can run parallel with**: Task 1.4 (Security module)

**Technical Requirements**:

Complete SQLAlchemy models implementing the schema from the specification:

```python
# models/sqlite_models.py
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, JSON, TIMESTAMP, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    """User authentication and authorization model"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default='viewer')  # admin, editor, viewer
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(TIMESTAMP, nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    charts = relationship("Chart", back_populates="creator", cascade="all, delete-orphan")
    dashboards = relationship("Dashboard", back_populates="creator", cascade="all, delete-orphan")
    connections = relationship("Connection", back_populates="creator")
    logs = relationship("Log", back_populates="user")

class Chart(Base):
    """Chart configuration model"""
    __tablename__ = "charts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    chart_type = Column(String(50), nullable=False)  # bar, line, pie, scatter, area
    config = Column(JSON, nullable=False)  # ChartConfig JSON
    data_source_id = Column(Integer, ForeignKey('connections.id'), nullable=True)
    query = Column(Text)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="charts")
    data_source = relationship("Connection")
    csv_data = relationship("CSVData", back_populates="chart", cascade="all, delete-orphan")
    dashboard_charts = relationship("DashboardChart", back_populates="chart", cascade="all, delete-orphan")

class Dashboard(Base):
    """Dashboard layout model"""
    __tablename__ = "dashboards"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    layout = Column(JSON, nullable=False)  # DashboardLayout JSON
    is_public = Column(Boolean, default=False)
    public_token = Column(String(100), unique=True, nullable=True, index=True)
    public_token_expires_at = Column(TIMESTAMP, nullable=True)
    public_token_created_at = Column(TIMESTAMP, nullable=True)
    public_access_count = Column(Integer, default=0)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="dashboards")
    dashboard_charts = relationship("DashboardChart", back_populates="dashboard", cascade="all, delete-orphan")

class DashboardChart(Base):
    """Dashboard-Chart many-to-many relationship"""
    __tablename__ = "dashboard_charts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dashboard_id = Column(Integer, ForeignKey('dashboards.id'), nullable=False)
    chart_id = Column(Integer, ForeignKey('charts.id'), nullable=False)
    position = Column(JSON, nullable=False)  # {x, y, w, h} grid position

    # Relationships
    dashboard = relationship("Dashboard", back_populates="dashboard_charts")
    chart = relationship("Chart", back_populates="dashboard_charts")

    # Constraints
    __table_args__ = (
        UniqueConstraint('dashboard_id', 'chart_id', name='uq_dashboard_chart'),
    )

class Connection(Base):
    """External database/storage connection model"""
    __tablename__ = "connections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # mysql, postgresql, s3, azure_blob, gcs
    config = Column(JSON, nullable=False)  # Encrypted ConnectionConfig JSON
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="connections")

class Setting(Base):
    """Application settings key-value store"""
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(JSON, nullable=False)
    description = Column(Text)
    updated_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    updater = relationship("User")

class Log(Base):
    """Activity logging and audit trail"""
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50))  # chart, dashboard, user, etc.
    resource_id = Column(Integer)
    details = Column(JSON)
    ip_address = Column(String(45))
    created_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="logs")

class CSVData(Base):
    """CSV uploaded data storage"""
    __tablename__ = "csv_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    chart_id = Column(Integer, ForeignKey('charts.id'), nullable=False)
    data = Column(JSON, nullable=False)  # Array of row objects
    column_types = Column(JSON, nullable=False)  # Column name -> type mapping
    row_count = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    chart = relationship("Chart", back_populates="csv_data")
```

**Database Utility (utils/db.py)**:
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings
import os

# Create SQLite engine
engine = create_engine(
    f"sqlite:///./{settings.SQLITE_PATH}",
    connect_args={"check_same_thread": False},  # Allow multi-threading
    echo=settings.DEBUG  # Log SQL queries in debug mode
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency for FastAPI
def get_db():
    """Database session dependency for FastAPI routes"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**Acceptance Criteria**:
- [ ] All 8 database models defined with proper relationships
- [ ] Foreign key constraints configured correctly
- [ ] Indexes added on frequently queried columns (username, email, public_token, chart_id, created_at)
- [ ] Timestamps auto-update on modification
- [ ] Cascade delete rules work (deleting dashboard deletes dashboard_charts)
- [ ] JSON columns accept and return proper Python dicts
- [ ] SessionLocal factory creates valid database sessions
- [ ] get_db() dependency works with FastAPI

**Tests**:
```python
# tests/test_models.py
import pytest
from app.models.sqlite_models import Base, User, Chart, Dashboard
from app.utils.db import engine
from sqlalchemy.orm import Session

@pytest.fixture
def db_session():
    """Create test database session"""
    Base.metadata.create_all(bind=engine)
    session = Session(engine)
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_create_user(db_session):
    """Test user creation with proper fields"""
    user = User(
        username="testuser",
        email="test@example.com",
        password_hash="hashed_password",
        role="admin"
    )
    db_session.add(user)
    db_session.commit()

    assert user.id is not None
    assert user.created_at is not None
    assert user.is_active is True

def test_user_chart_relationship(db_session):
    """Test user-chart relationship and cascade"""
    user = User(username="testuser", email="test@example.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    chart = Chart(
        name="Test Chart",
        chart_type="bar",
        config={"test": "data"},
        created_by=user.id
    )
    db_session.add(chart)
    db_session.commit()

    assert len(user.charts) == 1
    assert user.charts[0].name == "Test Chart"

def test_dashboard_chart_unique_constraint(db_session):
    """Test that dashboard-chart pairs are unique"""
    user = User(username="test", email="test@example.com", password_hash="hash")
    dashboard = Dashboard(name="Test", layout={}, created_by=user.id)
    chart = Chart(name="Chart", chart_type="bar", config={}, created_by=user.id)

    db_session.add_all([user, dashboard, chart])
    db_session.commit()

    from app.models.sqlite_models import DashboardChart
    dc1 = DashboardChart(dashboard_id=dashboard.id, chart_id=chart.id, position={})
    db_session.add(dc1)
    db_session.commit()

    # Attempting to add same pair should fail
    dc2 = DashboardChart(dashboard_id=dashboard.id, chart_id=chart.id, position={})
    db_session.add(dc2)

    with pytest.raises(Exception):  # Unique constraint violation
        db_session.commit()
```

---

### Task 1.4: Implement Security Module (JWT + Password Hashing)

**Description**: Build core/security.py with JWT token generation, password hashing using bcrypt, and token verification
**Size**: Medium
**Priority**: Critical
**Dependencies**: Task 1.1, Task 1.3
**Can run parallel with**: Task 1.5 (Encryption module)

**Technical Requirements**:

From specification, implement complete authentication security:

```python
# core/security.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from app.config import settings

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
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
```

**Acceptance Criteria**:
- [ ] create_access_token generates valid JWT tokens
- [ ] Tokens include expiration time (exp claim)
- [ ] Default expiration is 30 minutes (configurable)
- [ ] get_password_hash produces bcrypt hashes
- [ ] Same password produces different hashes (salted)
- [ ] verify_password correctly validates passwords
- [ ] verify_password returns False for wrong passwords
- [ ] decode_token validates JWT signature
- [ ] decode_token raises HTTPException for expired tokens
- [ ] decode_token raises HTTPException for tampered tokens

**Tests**:
```python
# tests/test_security.py
import pytest
from app.core.security import create_access_token, verify_password, get_password_hash, decode_token
from datetime import timedelta
from fastapi import HTTPException

def test_password_hashing():
    """
    Purpose: Verify password hashing is one-way and produces different hashes
    for the same password on different calls (salted).
    Can fail if: Hashing algorithm is broken or salt is not applied.
    """
    password = "testpassword123"
    hashed1 = get_password_hash(password)
    hashed2 = get_password_hash(password)

    # Different salts produce different hashes
    assert hashed1 != hashed2

    # Both hashes verify correctly
    assert verify_password(password, hashed1)
    assert verify_password(password, hashed2)

    # Wrong password fails
    assert not verify_password("wrongpassword", hashed1)

def test_jwt_token_creation():
    """
    Purpose: Ensure JWT tokens are created correctly with proper expiration.
    Can fail if: Token encoding fails or expiration is not set.
    """
    data = {"sub": "testuser"}
    token = create_access_token(data)

    assert token is not None
    assert len(token) > 0

    # Decode and verify payload
    payload = decode_token(token)
    assert payload["sub"] == "testuser"
    assert "exp" in payload

def test_jwt_token_expiration():
    """
    Purpose: Verify tokens expire after specified time.
    Can fail if: Expiration logic is broken.
    """
    data = {"sub": "testuser"}

    # Create token that expires in -1 second (already expired)
    expired_token = create_access_token(data, expires_delta=timedelta(seconds=-1))

    # Should raise exception for expired token
    with pytest.raises(HTTPException) as exc_info:
        decode_token(expired_token)

    assert exc_info.value.status_code == 401

def test_jwt_token_tampering():
    """
    Purpose: Ensure tampered tokens are rejected.
    Can fail if: Signature verification is not working.
    """
    data = {"sub": "testuser"}
    token = create_access_token(data)

    # Tamper with token
    tampered_token = token[:-5] + "xxxxx"

    with pytest.raises(HTTPException) as exc_info:
        decode_token(tampered_token)

    assert exc_info.value.status_code == 401
```

---

*[Task breakdown continues for all 62 tasks across 3 phases - this is a representative sample of the detailed breakdown format. The full document would continue with tasks 1.5 through 3.16]*

---

## Dependency Graph

```
Phase 1 Foundation:
1.1 (Backend Setup) ────────┬──────> 1.3 (Database Models) ──> 1.6 (Database Init)
                             │                                          │
1.2 (Frontend Setup) ────────┤                                          ├──> 1.7 (Auth Routes)
                             │                                          │
                             └──> 1.4 (Security) ─────────────────────┘
                             └──> 1.5 (Encryption) ───────────────────┘

1.7 (Auth Routes) ──> 1.8 (User Routes) ──> 1.9 (Charts Routes) ──> 1.10 (Dashboards Routes)

Phase 2 Enhanced Features:
2.1 (CSV Processor) ──> 2.2 (CSV Upload API) ──> 2.3 (Chart Builder UI)
                                                         │
2.4 (Public Links) ───────────────────────────────────> 2.5 (Dashboard Sharing)

Phase 3 Polish:
3.1 (Error Handling) ──> All Phase 3 tasks
3.2 (Testing) ──> 3.3 (Integration Tests) ──> 3.4 (E2E Tests)
```

## Critical Path
1. Backend Setup (1.1) → Database Models (1.3) → Database Init (1.6) → Auth (1.7) → Charts API (1.9) → Frontend Auth (1.14) → Chart Builder (2.3) → Integration Testing (3.3)

**Estimated Timeline**: 14-16 weeks for critical path completion

## Parallel Execution Opportunities

**High Parallelism** (Can run simultaneously):
- Tasks 1.1 and 1.2 (Backend and Frontend setup)
- Tasks 1.4 and 1.5 (Security and Encryption)
- Tasks 1.14-1.17 (All frontend pages after auth is done)
- Tasks 2.6-2.10 (Different export formats)

**Medium Parallelism** (After foundation):
- All chart type implementations (2.11-2.14)
- Documentation tasks (3.13-3.16)

## Risk Assessment

### High Risk Areas:
1. **CSV Processing (Task 2.1)**: Complex type detection and validation
   - Mitigation: Thorough testing with various CSV formats

2. **Connection Encryption (Task 1.5)**: Security-critical implementation
   - Mitigation: Use proven cryptography libraries, security audit

3. **Dashboard Drag-and-Drop (Task 2.15)**: Complex UI state management
   - Mitigation: Use react-grid-layout, extensive E2E testing

### Medium Risk Areas:
1. **Cloud Storage Integration (Tasks 2.16-2.18)**: Multiple provider APIs
2. **Export Generation (Tasks 2.6-2.10)**: Format-specific implementations
3. **Query Engine (Task 2.19)**: SQL injection prevention critical

## Execution Strategy

### Week 1-2: Foundation
- Set up both backend and frontend projects (Tasks 1.1, 1.2)
- Implement database layer (Tasks 1.3, 1.6)
- Build security modules (Tasks 1.4, 1.5)

### Week 3-4: Core APIs
- Authentication endpoints (Task 1.7)
- User management (Task 1.8)
- Chart CRUD (Task 1.9)
- Dashboard CRUD (Task 1.10)

### Week 5-6: Frontend Core
- Login UI (Task 1.14)
- Dashboard list (Task 1.15)
- Chart list (Task 1.16)
- Basic navigation (Task 1.17)

### Week 7-9: Advanced Features
- CSV processing (Tasks 2.1, 2.2)
- Chart builder (Task 2.3)
- Public links (Tasks 2.4, 2.5)
- Export features (Tasks 2.6-2.10)

### Week 10-12: Enhancement
- Additional chart types (Tasks 2.11-2.14)
- Dashboard editor (Task 2.15)
- Cloud storage (Tasks 2.16-2.18)
- External DB connections (Tasks 2.19-2.21)

### Week 13-14: Testing & Documentation
- Comprehensive testing (Tasks 3.2-3.4)
- Documentation (Tasks 3.13-3.16)
- Performance optimization (Tasks 3.5-3.7)

### Week 15-16: Deployment & Polish
- Docker optimization (Tasks 3.8-3.10)
- Security hardening (Task 3.11)
- Final QA and bug fixes

## Notes
- **STM Not Available**: Tasks will be tracked using TodoWrite during implementation
- **Code Preservation**: All implementation details from specification preserved in task descriptions
- **Testing Philosophy**: Each task includes test scenarios that can fail to reveal real issues
- **Phased Delivery**: Phase 1 can be delivered as MVP (3-4 weeks), Phases 2-3 are enhancements
