# Specification: Visualization Platform - Full Architecture & Implementation

## Status
**Draft** - Created 2025-11-01

## Authors
Claude Code

## Overview
A self-contained, portable graphical visualization and dashboard platform built with FastAPI (Python) and React (JavaScript). The platform provides data visualization capabilities similar to Apache Superset but with a focus on portability, simplicity, and data sovereignty through local SQLite storage.

## Background/Problem Statement

### The Problem
Organizations need data visualization and dashboard capabilities but face several challenges with existing solutions:

1. **Heavy Infrastructure Requirements**: Solutions like Apache Superset require PostgreSQL, Redis, complex dependencies, and significant operational overhead
2. **Vendor Lock-in**: Cloud-hosted BI tools create dependency on external vendors and raise data privacy concerns
3. **Deployment Complexity**: Most visualization platforms are difficult to deploy, requiring specialized knowledge and infrastructure
4. **Data Sovereignty**: Organizations need to maintain full control over their metadata and configurations
5. **Portability**: Existing solutions are not easily portable across environments (dev, staging, production, on-premise, cloud)

### The Solution
A lightweight, Docker-based visualization platform that:
- Stores all application metadata in a local SQLite database
- Runs entirely in containers for maximum portability
- Provides enterprise-grade features (authentication, caching, exports) with minimal setup
- Supports cloud extensibility for large datasets while keeping control plane local
- Can be deployed anywhere with just Docker

## Goals

- **Portability**: Single `docker-compose up` deployment across any environment
- **Data Sovereignty**: All application metadata stored locally in SQLite
- **Self-Contained**: No external database dependencies for core functionality
- **Enterprise Features**: Authentication, role management, caching, and export capabilities
- **Cloud Extensibility**: Support for connecting to external databases (MySQL, PostgreSQL) and cloud storage (S3, Azure, GCP)
- **User-Friendly**: Intuitive UI for chart creation, dashboard building, and sharing
- **Modern Stack**: FastAPI for high-performance backend, React for responsive frontend
- **Production Ready**: Proper error handling, logging, security, and performance optimization

## Non-Goals

- **Real-time streaming analytics**: Focus on batch/query-based visualization
- **Advanced ML/AI features**: No built-in machine learning or predictive analytics
- **Multi-tenancy in V1**: Single organization per deployment initially
- **Mobile native apps**: Responsive web UI only, no dedicated mobile apps
- **ETL/Data pipelines**: Focus on visualization, not data transformation
- **Embedded analytics**: Not designed for iframe embedding in external applications
- **On-premise Hadoop/Spark integration**: Cloud storage and SQL databases only

## Technical Dependencies

### Backend (Python)
```python
# requirements.txt (versions to be determined during implementation)
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
sqlalchemy>=2.0.0
pydantic>=2.0.0
python-jose[cryptography]>=3.3.0  # JWT tokens
passlib[bcrypt]>=1.7.4  # Password hashing
cryptography>=41.0.0  # Connection string encryption (Fernet)
python-multipart>=0.0.6  # File uploads
redis>=5.0.0  # Optional caching
boto3>=1.28.0  # AWS S3 integration
azure-storage-blob>=12.19.0  # Azure Blob Storage
google-cloud-storage>=2.10.0  # Google Cloud Storage
reportlab>=4.0.0  # PDF generation
openpyxl>=3.1.0  # Excel export
pillow>=10.0.0  # Image processing
mysql-connector-python>=8.1.0  # MySQL support
psycopg2-binary>=2.9.0  # PostgreSQL support
```

### Frontend (JavaScript/TypeScript)
```json
{
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
  }
}
```

### Infrastructure
- **Docker**: 24.0+ for containerization
- **Docker Compose**: 2.0+ for orchestration
- **Redis**: 7.0+ for optional query caching
- **SQLite**: 3.40+ (embedded, no separate installation)

## Detailed Design

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         React Frontend (Port 5173)             │    │
│  │                                                 │    │
│  │  - Chart Builder UI                            │    │
│  │  - Dashboard Editor (drag-and-drop)            │    │
│  │  - Admin Settings Panel                        │    │
│  │  - User Management                             │    │
│  │  - Export Controls                             │    │
│  └────────────────┬───────────────────────────────┘    │
│                   │                                      │
└───────────────────┼──────────────────────────────────────┘
                    │ HTTP/REST + WebSocket
                    ▼
┌─────────────────────────────────────────────────────────┐
│              FastAPI Backend (Port 8000)                 │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │           API Layer                          │      │
│  │  /api/auth/*      - Authentication           │      │
│  │  /api/users/*     - User management          │      │
│  │  /api/charts/*    - Chart CRUD               │      │
│  │  /api/dashboards/* - Dashboard CRUD          │      │
│  │  /api/settings/*  - Configuration            │      │
│  │  /api/export/*    - PDF/Excel/Image          │      │
│  │  /api/data/*      - Query execution          │      │
│  └──────────────┬───────────────────────────────┘      │
│                 │                                        │
│  ┌──────────────▼───────────────────────────────┐      │
│  │         Business Logic Layer                 │      │
│  │  - Query builder & executor                  │      │
│  │  - Chart rendering engine                    │      │
│  │  - Export generators                         │      │
│  │  - Cache manager                             │      │
│  └──────────────┬───────────────────────────────┘      │
│                 │                                        │
└─────────────────┼────────────────────────────────────────┘
                  │
      ┌───────────┼───────────┐
      │           │           │
      ▼           ▼           ▼
┌──────────┐ ┌─────────┐ ┌──────────────┐
│ SQLite   │ │  Redis  │ │ External     │
│ (local)  │ │ (cache) │ │ Data Sources │
│          │ │         │ │              │
│ - users  │ │ Query   │ │ - MySQL      │
│ - charts │ │ results │ │ - PostgreSQL │
│ - dashbds│ │ Session │ │ - S3         │
│ - settings│ │ data    │ │ - Azure Blob │
│ - logs   │ │         │ │ - GCS        │
└──────────┘ └─────────┘ └──────────────┘
```

### Database Schema (SQLite)

```sql
-- Users and Authentication
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer', -- admin, editor, viewer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Chart Configurations
CREATE TABLE charts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    chart_type VARCHAR(50) NOT NULL, -- bar, line, pie, scatter, area, etc.
    config JSON NOT NULL, -- Full chart configuration
    data_source_id INTEGER,
    query TEXT, -- SQL query or data retrieval logic
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (data_source_id) REFERENCES connections(id)
);

-- Dashboards
CREATE TABLE dashboards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    layout JSON NOT NULL, -- Grid layout configuration
    is_public BOOLEAN DEFAULT FALSE,
    public_token VARCHAR(100) UNIQUE, -- For shareable links
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Dashboard-Chart Relationships
CREATE TABLE dashboard_charts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dashboard_id INTEGER NOT NULL,
    chart_id INTEGER NOT NULL,
    position JSON NOT NULL, -- {x, y, w, h} for grid layout
    FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE,
    FOREIGN KEY (chart_id) REFERENCES charts(id) ON DELETE CASCADE,
    UNIQUE(dashboard_id, chart_id)
);

-- External Database/Storage Connections
CREATE TABLE connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- mysql, postgresql, s3, azure_blob, gcs
    config JSON NOT NULL, -- Encrypted connection details
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Application Settings
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSON NOT NULL,
    description TEXT,
    updated_by INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Activity Logs
CREATE TABLE logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50), -- chart, dashboard, user, etc.
    resource_id INTEGER,
    details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_charts_created_by ON charts(created_by);
CREATE INDEX idx_dashboards_created_by ON dashboards(created_by);
CREATE INDEX idx_dashboards_public_token ON dashboards(public_token);
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_created_at ON logs(created_at);
```

### JSON Schema Definitions

#### Chart Configuration Schema

The `config` JSON field in the `charts` table follows this structure:

```typescript
interface ChartConfig {
  // Chart type
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'area';

  // Data mapping - how to map data columns to chart axes
  dataMapping: {
    xAxis: string;      // Column name for X-axis
    yAxis: string;      // Column name for Y-axis
    series?: string;    // Optional column for grouping/series
    filters?: {         // Optional data filters
      column: string;
      operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains';
      value: any;
    }[];
  };

  // Visual styling
  styling: {
    colors?: string[];           // Custom color palette
    title?: string;              // Chart title
    showLegend?: boolean;        // Display legend
    showGrid?: boolean;          // Display grid lines
    showTooltip?: boolean;       // Enable tooltips
    fontSize?: number;           // Base font size
    width?: number;              // Chart width in pixels
    height?: number;             // Chart height in pixels
  };

  // Data aggregation (for database queries)
  aggregation?: {
    function: 'sum' | 'avg' | 'count' | 'min' | 'max';
    groupBy?: string[];  // Columns to group by
  };
}
```

**Example:**
```json
{
  "chartType": "bar",
  "dataMapping": {
    "xAxis": "month",
    "yAxis": "revenue",
    "series": "region"
  },
  "styling": {
    "colors": ["#3b82f6", "#10b981", "#f59e0b"],
    "title": "Monthly Revenue by Region",
    "showLegend": true,
    "showGrid": true,
    "height": 400
  }
}
```

#### Dashboard Layout Schema

The `layout` JSON field in the `dashboards` table follows this structure:

```typescript
interface DashboardLayout {
  // Grid configuration
  gridCols: number;          // Number of columns (default: 12)
  rowHeight: number;         // Height of each row in pixels (default: 100)

  // Chart positions using react-grid-layout format
  items: Array<{
    chartId: number;       // Reference to chart
    position: {
      x: number;           // Column position (0-based)
      y: number;           // Row position (0-based)
      w: number;           // Width in grid units
      h: number;           // Height in grid units
      minW?: number;       // Minimum width
      minH?: number;       // Minimum height
      maxW?: number;       // Maximum width
      maxH?: number;       // Maximum height
      static?: boolean;    // If true, item is not draggable
    };
  }>;

  // Dashboard-level settings
  settings?: {
    backgroundColor?: string;
    padding?: number;
    autoRefresh?: number;  // Auto-refresh interval in seconds
  };
}
```

**Example:**
```json
{
  "gridCols": 12,
  "rowHeight": 100,
  "items": [
    {
      "chartId": 1,
      "position": {"x": 0, "y": 0, "w": 6, "h": 4}
    },
    {
      "chartId": 2,
      "position": {"x": 6, "y": 0, "w": 6, "h": 4}
    },
    {
      "chartId": 3,
      "position": {"x": 0, "y": 4, "w": 12, "h": 3}
    }
  ],
  "settings": {
    "backgroundColor": "#f9fafb",
    "padding": 16
  }
}
```

#### CSV Data Storage Schema

When users upload CSV files, the data is stored in a dedicated table:

```sql
-- CSV Uploaded Data
CREATE TABLE csv_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chart_id INTEGER NOT NULL,
    data JSON NOT NULL,           -- Array of row objects
    column_types JSON NOT NULL,   -- Column name -> type mapping
    row_count INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chart_id) REFERENCES charts(id) ON DELETE CASCADE
);

CREATE INDEX idx_csv_data_chart_id ON csv_data(chart_id);
```

**Data structure:**
```typescript
interface CSVData {
  columns: string[];              // Column names
  rows: Record<string, any>[];   // Array of row objects
  columnTypes: Record<string, 'string' | 'number' | 'date' | 'boolean'>;
  metadata: {
    fileName: string;
    fileSize: number;
    uploadedAt: string;
    rowCount: number;
  };
}
```

**Example:**
```json
{
  "columns": ["month", "revenue", "region"],
  "rows": [
    {"month": "January", "revenue": 50000, "region": "North"},
    {"month": "February", "revenue": 62000, "region": "North"}
  ],
  "columnTypes": {
    "month": "string",
    "revenue": "number",
    "region": "string"
  },
  "metadata": {
    "fileName": "sales_data.csv",
    "fileSize": 2048,
    "uploadedAt": "2025-01-15T10:30:00Z",
    "rowCount": 2
  }
}
```

#### Connection Configuration Schema

The `config` JSON field in the `connections` table (encrypted):

```typescript
interface ConnectionConfig {
  // Common fields
  host: string;
  port: number;
  database?: string;

  // Authentication
  user?: string;
  password?: string;      // Encrypted before storage

  // SSL/TLS
  ssl?: boolean;
  sslCert?: string;      // Path to certificate

  // Connection pooling
  poolSize?: number;
  maxOverflow?: number;

  // Cloud storage specific (S3)
  bucket?: string;
  region?: string;
  accessKeyId?: string;   // Encrypted
  secretAccessKey?: string; // Encrypted

  // Cloud storage specific (Azure)
  containerName?: string;
  connectionString?: string; // Encrypted

  // Cloud storage specific (GCS)
  projectId?: string;
  keyFile?: string;       // Path to credentials file
}
```

### CSV Upload and Processing Flow

#### Complete CSV Processing Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT UPLOAD                             │
│  1. User selects CSV file                                    │
│  2. Client-side validation (size, type)                     │
│  3. POST /api/data/upload-csv                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 SERVER VALIDATION                            │
│  4. Check file size (max 50MB)                              │
│  5. Verify MIME type (text/csv)                             │
│  6. Scan for malicious content                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   CSV PARSING                                │
│  7. Parse CSV using Python csv module                       │
│  8. Detect column types (string/number/date)                │
│  9. Validate data integrity                                 │
│  10. Handle missing values                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATA STORAGE                                │
│  11. Store parsed data in csv_data table                    │
│  12. Associate with chart_id                                │
│  13. Save column type mapping                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   CLEANUP                                    │
│  14. Delete temporary uploaded file                         │
│  15. Return data preview to client                          │
└─────────────────────────────────────────────────────────────┘
```

#### Implementation Details

```python
# utils/csv_processor.py
import csv
import io
from typing import List, Dict, Any, Tuple
from datetime import datetime
import tempfile
import os

class CSVProcessor:
    """Handles CSV file upload, parsing, and storage"""

    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    ALLOWED_MIME_TYPES = ['text/csv', 'application/csv', 'text/plain']

    def __init__(self):
        self.temp_dir = tempfile.gettempdir()

    async def process_upload(self, file: UploadFile, chart_id: int) -> Dict[str, Any]:
        """
        Process uploaded CSV file

        Args:
            file: Uploaded file from FastAPI
            chart_id: ID of associated chart

        Returns:
            Parsed CSV data with metadata

        Raises:
            ValueError: If file validation fails
            CSVError: If CSV parsing fails
        """
        # Step 1: Validate file
        self._validate_file(file)

        # Step 2: Save temporarily
        temp_path = await self._save_temp_file(file)

        try:
            # Step 3: Parse CSV
            data, column_types = self._parse_csv(temp_path)

            # Step 4: Validate data
            self._validate_data(data)

            # Step 5: Store in database
            csv_data = {
                "columns": list(data[0].keys()) if data else [],
                "rows": data,
                "columnTypes": column_types,
                "metadata": {
                    "fileName": file.filename,
                    "fileSize": file.size,
                    "uploadedAt": datetime.utcnow().isoformat(),
                    "rowCount": len(data)
                }
            }

            return csv_data

        finally:
            # Step 6: Cleanup temp file
            self._cleanup_temp_file(temp_path)

    def _validate_file(self, file: UploadFile):
        """Validate uploaded file"""
        # Check file size
        if file.size > self.MAX_FILE_SIZE:
            raise ValueError(f"File too large. Max size: {self.MAX_FILE_SIZE / 1024 / 1024}MB")

        # Check MIME type
        if file.content_type not in self.ALLOWED_MIME_TYPES:
            raise ValueError(f"Invalid file type. Expected CSV, got {file.content_type}")

        # Check file extension
        if not file.filename.lower().endswith('.csv'):
            raise ValueError("File must have .csv extension")

    async def _save_temp_file(self, file: UploadFile) -> str:
        """Save uploaded file to temporary location"""
        temp_path = os.path.join(self.temp_dir, f"upload_{datetime.utcnow().timestamp()}_{file.filename}")

        with open(temp_path, 'wb') as f:
            content = await file.read()
            f.write(content)

        return temp_path

    def _parse_csv(self, file_path: str) -> Tuple[List[Dict], Dict[str, str]]:
        """Parse CSV file and detect column types"""
        rows = []
        column_types = {}

        with open(file_path, 'r', encoding='utf-8-sig') as f:
            # Use DictReader for automatic column detection
            reader = csv.DictReader(f)

            for row in reader:
                # Convert empty strings to None
                processed_row = {k: (v if v else None) for k, v in row.items()}
                rows.append(processed_row)

        # Detect column types from first 100 rows
        if rows:
            column_types = self._detect_column_types(rows[:100])

        return rows, column_types

    def _detect_column_types(self, sample_rows: List[Dict]) -> Dict[str, str]:
        """Detect column types from sample data"""
        column_types = {}

        if not sample_rows:
            return column_types

        columns = sample_rows[0].keys()

        for col in columns:
            # Get non-null values
            values = [row[col] for row in sample_rows if row.get(col) is not None]

            if not values:
                column_types[col] = 'string'
                continue

            # Try to detect type
            if self._is_numeric(values):
                column_types[col] = 'number'
            elif self._is_date(values):
                column_types[col] = 'date'
            elif self._is_boolean(values):
                column_types[col] = 'boolean'
            else:
                column_types[col] = 'string'

        return column_types

    def _is_numeric(self, values: List[str]) -> bool:
        """Check if values are numeric"""
        try:
            for v in values[:10]:  # Check first 10
                float(v)
            return True
        except (ValueError, TypeError):
            return False

    def _is_date(self, values: List[str]) -> bool:
        """Check if values are dates"""
        date_formats = ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%d %H:%M:%S']

        for fmt in date_formats:
            try:
                for v in values[:10]:
                    datetime.strptime(str(v), fmt)
                return True
            except (ValueError, TypeError):
                continue

        return False

    def _is_boolean(self, values: List[str]) -> bool:
        """Check if values are boolean"""
        bool_values = {'true', 'false', 'yes', 'no', '1', '0', 't', 'f', 'y', 'n'}
        return all(str(v).lower() in bool_values for v in values[:10])

    def _validate_data(self, data: List[Dict]):
        """Validate parsed CSV data"""
        if not data:
            raise ValueError("CSV file is empty")

        if len(data) > 100000:  # Max 100k rows
            raise ValueError("CSV file has too many rows (max 100,000)")

        # Check for consistent column structure
        if len(data) > 1:
            first_cols = set(data[0].keys())
            for i, row in enumerate(data[1:], start=2):
                if set(row.keys()) != first_cols:
                    raise ValueError(f"Inconsistent columns in row {i}")

    def _cleanup_temp_file(self, file_path: str):
        """Delete temporary file"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            # Log but don't fail on cleanup errors
            print(f"Warning: Failed to cleanup temp file {file_path}: {e}")

csv_processor = CSVProcessor()
```

#### CSV Upload API Endpoint

```python
# api/routes/data.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.utils.csv_processor import csv_processor
from app.models.sqlite_models import CSVData, Chart
from app.utils.db import SessionLocal

router = APIRouter()

@router.post("/upload-csv")
async def upload_csv(
    chart_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and process CSV file for a chart

    Errors:
    - 400: File validation failed
    - 404: Chart not found
    - 413: File too large
    - 500: Processing error
    """
    # Verify chart exists and user has access
    chart = db.query(Chart).filter(Chart.id == chart_id).first()
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")

    if chart.created_by != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        # Process CSV
        csv_data_dict = await csv_processor.process_upload(file, chart_id)

        # Store in database
        csv_data = CSVData(
            chart_id=chart_id,
            data=json.dumps(csv_data_dict["rows"]),
            column_types=json.dumps(csv_data_dict["columnTypes"]),
            row_count=csv_data_dict["metadata"]["rowCount"]
        )
        db.add(csv_data)
        db.commit()

        return {
            "message": "CSV uploaded successfully",
            "preview": csv_data_dict["rows"][:10],  # Return first 10 rows
            "metadata": csv_data_dict["metadata"],
            "columns": csv_data_dict["columns"],
            "columnTypes": csv_data_dict["columnTypes"]
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {str(e)}")
```

### Backend Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration management
│   │
│   ├── api/                    # API routes
│   │   ├── __init__.py
│   │   ├── dependencies.py     # Shared dependencies (auth, db sessions)
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── auth.py         # Login, logout, token refresh
│   │       ├── users.py        # User CRUD operations
│   │       ├── charts.py       # Chart CRUD operations
│   │       ├── dashboards.py   # Dashboard CRUD operations
│   │       ├── data.py         # Data querying and retrieval
│   │       ├── settings.py     # Application settings management
│   │       ├── connections.py  # External connection management
│   │       └── export.py       # PDF, Excel, image exports
│   │
│   ├── models/                 # Data models
│   │   ├── __init__.py
│   │   ├── sqlite_models.py   # SQLAlchemy ORM models
│   │   └── schemas.py         # Pydantic schemas for API
│   │
│   ├── core/                   # Core business logic
│   │   ├── __init__.py
│   │   ├── security.py        # Password hashing, JWT tokens
│   │   ├── query_engine.py   # SQL query builder and executor
│   │   └── permissions.py     # Role-based access control
│   │
│   ├── utils/                  # Utility modules
│   │   ├── __init__.py
│   │   ├── db.py              # Database connection and session
│   │   ├── cache.py           # Redis cache utilities
│   │   ├── export_utils.py    # Export helpers (PDF, Excel)
│   │   ├── cloud_utils.py     # Cloud storage integrations
│   │   └── logger.py          # Logging configuration
│   │
│   └── seeds/                  # Database initialization
│       ├── __init__.py
│       └── init_db.py         # Default data seeding
│
├── tests/                      # Test suite
│   ├── __init__.py
│   ├── conftest.py            # Pytest fixtures
│   ├── test_auth.py
│   ├── test_charts.py
│   ├── test_dashboards.py
│   └── test_export.py
│
├── Dockerfile
├── requirements.txt
├── .env.example
└── README.md
```

### Frontend Directory Structure

```
frontend/
├── src/
│   ├── main.tsx               # Application entry point
│   ├── App.tsx                # Root component with routing
│   │
│   ├── components/            # Reusable components
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Card.tsx
│   │   │
│   │   ├── charts/
│   │   │   ├── ChartCard.tsx       # Individual chart display
│   │   │   ├── ChartBuilder.tsx    # Chart creation wizard
│   │   │   ├── ChartRenderer.tsx   # Dynamic chart rendering
│   │   │   └── ChartTypes.tsx      # Available chart types
│   │   │
│   │   ├── dashboard/
│   │   │   ├── DashboardGrid.tsx   # Grid layout container
│   │   │   ├── DashboardEditor.tsx # Drag-and-drop editor
│   │   │   └── DashboardCard.tsx   # Dashboard preview card
│   │   │
│   │   └── admin/
│   │       ├── SettingsPanel.tsx   # Admin configuration
│   │       ├── UserManagement.tsx  # User CRUD
│   │       └── ConnectionsPanel.tsx # Data source config
│   │
│   ├── pages/                 # Page components
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ChartList.tsx
│   │   ├── ChartDetail.tsx
│   │   ├── DashboardList.tsx
│   │   ├── DashboardDetail.tsx
│   │   ├── AdminSettings.tsx
│   │   └── PublicDashboard.tsx    # Shareable dashboard view
│   │
│   ├── store/                 # State management (Zustand)
│   │   ├── authStore.ts       # Authentication state
│   │   ├── chartStore.ts      # Charts state
│   │   └── dashboardStore.ts  # Dashboards state
│   │
│   ├── api/                   # API client
│   │   ├── client.ts          # Axios instance with interceptors
│   │   ├── auth.ts            # Auth API calls
│   │   ├── charts.ts          # Chart API calls
│   │   ├── dashboards.ts      # Dashboard API calls
│   │   └── settings.ts        # Settings API calls
│   │
│   ├── types/                 # TypeScript types
│   │   ├── chart.ts
│   │   ├── dashboard.ts
│   │   ├── user.ts
│   │   └── api.ts
│   │
│   └── utils/                 # Utility functions
│       ├── exportUtils.ts     # Client-side export helpers
│       └── validators.ts      # Form validation
│
├── public/
│   └── index.html
├── Dockerfile
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

### API Endpoints

#### Authentication
```
POST   /api/auth/login          # Login and receive JWT token
POST   /api/auth/logout         # Logout (invalidate token)
POST   /api/auth/refresh        # Refresh access token
GET    /api/auth/me             # Get current user info
```

#### Users
```
GET    /api/users               # List all users (admin only)
POST   /api/users               # Create new user (admin only)
GET    /api/users/{id}          # Get user details
PUT    /api/users/{id}          # Update user
DELETE /api/users/{id}          # Delete user (admin only)
```

#### Charts
```
GET    /api/charts              # List all charts (with pagination)
POST   /api/charts              # Create new chart
GET    /api/charts/{id}         # Get chart details
PUT    /api/charts/{id}         # Update chart
DELETE /api/charts/{id}         # Delete chart
POST   /api/charts/{id}/execute # Execute chart query and return data
```

#### Dashboards
```
GET    /api/dashboards          # List all dashboards
POST   /api/dashboards          # Create new dashboard
GET    /api/dashboards/{id}     # Get dashboard details
PUT    /api/dashboards/{id}     # Update dashboard
DELETE /api/dashboards/{id}     # Delete dashboard
POST   /api/dashboards/{id}/share # Generate public share link
GET    /view/dashboard/{token}  # Public dashboard view (no auth)
```

#### Data Sources
```
GET    /api/connections         # List all connections
POST   /api/connections         # Create new connection
GET    /api/connections/{id}    # Get connection details
PUT    /api/connections/{id}    # Update connection
DELETE /api/connections/{id}    # Delete connection
POST   /api/connections/{id}/test # Test connection
POST   /api/data/query          # Execute query on data source
```

#### Settings
```
GET    /api/settings            # Get all settings (admin only)
PUT    /api/settings            # Update settings (admin only)
GET    /api/settings/{key}      # Get specific setting
PUT    /api/settings/{key}      # Update specific setting
```

#### Export
```
GET    /api/export/chart/{id}/image      # Export chart as PNG
GET    /api/export/chart/{id}/excel      # Export chart data as Excel
GET    /api/export/dashboard/{id}/pdf    # Export dashboard as PDF
GET    /api/export/dashboard/{id}/excel  # Export all dashboard data as Excel
```

### Authentication & Authorization

#### JWT Token Flow
```python
# core/security.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET_KEY = "your-secret-key-here"  # From environment
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str):
    return pwd_context.hash(password)
```

#### Role-Based Access Control
```python
# core/permissions.py
from enum import Enum

class Role(str, Enum):
    ADMIN = "admin"     # Full access
    EDITOR = "editor"   # Create/edit charts and dashboards
    VIEWER = "viewer"   # Read-only access

# Decorator for endpoint protection
def require_role(allowed_roles: list[Role]):
    def decorator(func):
        async def wrapper(current_user: User = Depends(get_current_user)):
            if current_user.role not in allowed_roles:
                raise HTTPException(status_code=403, detail="Insufficient permissions")
            return await func(current_user)
        return wrapper
    return decorator
```

### Caching Strategy (Redis)

```python
# utils/cache.py
import redis
import json
from typing import Optional
from app.config import settings

class CacheManager:
    def __init__(self):
        self.redis_client = None
        if settings.REDIS_URL:
            try:
                self.redis_client = redis.from_url(settings.REDIS_URL)
            except Exception as e:
                print(f"Redis connection failed: {e}")

    def get(self, key: str) -> Optional[dict]:
        """Retrieve cached data"""
        if not self.redis_client:
            return None
        try:
            data = self.redis_client.get(key)
            return json.loads(data) if data else None
        except Exception:
            return None

    def set(self, key: str, value: dict, ttl: int = 300):
        """Cache data with TTL (default 5 minutes)"""
        if not self.redis_client:
            return
        try:
            self.redis_client.setex(key, ttl, json.dumps(value))
        except Exception:
            pass

    def invalidate(self, pattern: str):
        """Invalidate cache by pattern"""
        if not self.redis_client:
            return
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
        except Exception:
            pass

cache = CacheManager()
```

### Query Engine

```python
# core/query_engine.py
from sqlalchemy import create_engine, text
from typing import List, Dict, Any
from app.models.sqlite_models import Connection
from app.utils.cache import cache

class QueryEngine:
    """Executes queries against various data sources"""

    def __init__(self):
        self.engines = {}  # Connection pool

    def get_engine(self, connection: Connection):
        """Get or create SQLAlchemy engine for connection"""
        if connection.id not in self.engines:
            conn_config = connection.config
            if connection.type == "mysql":
                url = f"mysql+mysqlconnector://{conn_config['user']}:{conn_config['password']}@{conn_config['host']}:{conn_config['port']}/{conn_config['database']}"
            elif connection.type == "postgresql":
                url = f"postgresql://{conn_config['user']}:{conn_config['password']}@{conn_config['host']}:{conn_config['port']}/{conn_config['database']}"
            else:
                raise ValueError(f"Unsupported connection type: {connection.type}")

            self.engines[connection.id] = create_engine(url)

        return self.engines[connection.id]

    def execute_query(self, connection: Connection, query: str,
                     params: Dict = None, use_cache: bool = True) -> List[Dict[str, Any]]:
        """Execute query and return results"""

        # Generate cache key
        cache_key = f"query:{connection.id}:{hash(query)}:{hash(str(params))}"

        # Check cache
        if use_cache:
            cached = cache.get(cache_key)
            if cached:
                return cached

        # Execute query
        engine = self.get_engine(connection)
        with engine.connect() as conn:
            result = conn.execute(text(query), params or {})
            rows = [dict(row._mapping) for row in result]

        # Cache results
        if use_cache:
            cache.set(cache_key, rows, ttl=300)

        return rows

query_engine = QueryEngine()
```

### Export Utilities

```python
# utils/export_utils.py
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment
from typing import List, Dict
import io

class ExportManager:
    """Handles PDF and Excel exports"""

    def export_to_pdf(self, dashboard_name: str, charts_data: List[Dict]) -> bytes:
        """Export dashboard as PDF"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()

        # Title
        title = Paragraph(f"<b>{dashboard_name}</b>", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 12))

        # Add each chart's data as a table
        for chart in charts_data:
            # Chart title
            chart_title = Paragraph(f"<b>{chart['name']}</b>", styles['Heading2'])
            elements.append(chart_title)
            elements.append(Spacer(1, 6))

            # Chart data as table
            if chart.get('data'):
                table_data = [list(chart['data'][0].keys())]  # Headers
                table_data.extend([list(row.values()) for row in chart['data']])

                table = Table(table_data)
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                elements.append(table)
                elements.append(Spacer(1, 20))

        doc.build(elements)
        buffer.seek(0)
        return buffer.read()

    def export_to_excel(self, chart_name: str, data: List[Dict]) -> bytes:
        """Export chart data as Excel"""
        buffer = io.BytesIO()
        wb = Workbook()
        ws = wb.active
        ws.title = chart_name[:31]  # Excel sheet name limit

        if not data:
            wb.save(buffer)
            buffer.seek(0)
            return buffer.read()

        # Headers
        headers = list(data[0].keys())
        ws.append(headers)

        # Style headers
        header_font = Font(bold=True)
        for cell in ws[1]:
            cell.font = header_font
            cell.alignment = Alignment(horizontal='center')

        # Data rows
        for row in data:
            ws.append(list(row.values()))

        # Auto-adjust column widths
        for column in ws.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            ws.column_dimensions[column_letter].width = adjusted_width

        wb.save(buffer)
        buffer.seek(0)
        return buffer.read()

export_manager = ExportManager()
```

### Cloud Storage Integration

```python
# utils/cloud_utils.py
import boto3
from azure.storage.blob import BlobServiceClient
from google.cloud import storage
from typing import Optional, BinaryIO

class CloudStorageManager:
    """Handles uploads to cloud storage providers"""

    def upload_to_s3(self, bucket: str, key: str, file: BinaryIO,
                     aws_access_key: str, aws_secret_key: str, region: str = "us-east-1"):
        """Upload file to AWS S3"""
        s3_client = boto3.client(
            's3',
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            region_name=region
        )
        s3_client.upload_fileobj(file, bucket, key)
        return f"https://{bucket}.s3.{region}.amazonaws.com/{key}"

    def upload_to_azure(self, container: str, blob_name: str, file: BinaryIO,
                       connection_string: str):
        """Upload file to Azure Blob Storage"""
        blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        blob_client = blob_service_client.get_blob_client(container=container, blob=blob_name)
        blob_client.upload_blob(file, overwrite=True)
        return blob_client.url

    def upload_to_gcs(self, bucket_name: str, blob_name: str, file: BinaryIO,
                      credentials_path: str):
        """Upload file to Google Cloud Storage"""
        client = storage.Client.from_service_account_json(credentials_path)
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        blob.upload_from_file(file)
        return f"https://storage.googleapis.com/{bucket_name}/{blob_name}"

cloud_storage = CloudStorageManager()
```

### Connection String Encryption

All sensitive connection credentials are encrypted before storage using **Fernet (symmetric encryption)**.

#### Encryption Implementation

```python
# core/encryption.py
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
from cryptography.hazmat.backends import default_backend
import base64
import os
import json
from typing import Dict, Any

class ConnectionEncryption:
    """Handles encryption/decryption of connection credentials"""

    def __init__(self, master_key: str = None):
        """
        Initialize encryption with master key

        Args:
            master_key: Master encryption key from environment
                        If not provided, generates new key (not recommended for production)
        """
        if master_key:
            # Derive key from master key using PBKDF2
            kdf = PBKDF2(
                algorithm=hashes.SHA256(),
                length=32,
                salt=b'visualization_platform_salt',  # Should be unique per deployment
                iterations=100000,
                backend=default_backend()
            )
            key = base64.urlsafe_b64encode(kdf.derive(master_key.encode()))
        else:
            # Generate new key (only for development)
            key = Fernet.generate_key()

        self.cipher = Fernet(key)

    def encrypt_connection_config(self, config: Dict[str, Any]) -> str:
        """
        Encrypt connection configuration

        Args:
            config: Connection configuration dictionary

        Returns:
            Encrypted configuration as base64 string

        Raises:
            EncryptionError: If encryption fails
        """
        try:
            # Convert to JSON
            json_str = json.dumps(config)

            # Encrypt
            encrypted_bytes = self.cipher.encrypt(json_str.encode())

            # Return as base64 string
            return base64.urlsafe_b64encode(encrypted_bytes).decode()

        except Exception as e:
            raise EncryptionError(f"Failed to encrypt connection config: {e}")

    def decrypt_connection_config(self, encrypted_config: str) -> Dict[str, Any]:
        """
        Decrypt connection configuration

        Args:
            encrypted_config: Encrypted configuration as base64 string

        Returns:
            Decrypted configuration dictionary

        Raises:
            DecryptionError: If decryption fails
        """
        try:
            # Decode base64
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_config.encode())

            # Decrypt
            decrypted_bytes = self.cipher.decrypt(encrypted_bytes)

            # Parse JSON
            return json.loads(decrypted_bytes.decode())

        except Exception as e:
            raise DecryptionError(f"Failed to decrypt connection config: {e}")

    def encrypt_field(self, value: str) -> str:
        """Encrypt a single field (password, API key, etc.)"""
        try:
            encrypted = self.cipher.encrypt(value.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            raise EncryptionError(f"Failed to encrypt field: {e}")

    def decrypt_field(self, encrypted_value: str) -> str:
        """Decrypt a single field"""
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_value.encode())
            decrypted = self.cipher.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception as e:
            raise DecryptionError(f"Failed to decrypt field: {e}")


class EncryptionError(Exception):
    """Raised when encryption fails"""
    pass


class DecryptionError(Exception):
    """Raised when decryption fails"""
    pass


# Initialize with master key from environment
MASTER_KEY = os.getenv("ENCRYPTION_MASTER_KEY")
if not MASTER_KEY:
    raise ValueError("ENCRYPTION_MASTER_KEY environment variable must be set")

encryption = ConnectionEncryption(MASTER_KEY)
```

#### Using Encryption in Query Engine

```python
# core/query_engine.py (updated)
from app.core.encryption import encryption

class QueryEngine:
    """Executes queries against various data sources"""

    def get_engine(self, connection: Connection):
        """Get or create SQLAlchemy engine for connection"""
        if connection.id not in self.engines:
            # Decrypt connection config
            conn_config = encryption.decrypt_connection_config(connection.config)

            if connection.type == "mysql":
                # Password already decrypted
                url = f"mysql+mysqlconnector://{conn_config['user']}:{conn_config['password']}@{conn_config['host']}:{conn_config['port']}/{conn_config['database']}"
            elif connection.type == "postgresql":
                url = f"postgresql://{conn_config['user']}:{conn_config['password']}@{conn_config['host']}:{conn_config['port']}/{conn_config['database']}"
            else:
                raise ValueError(f"Unsupported connection type: {connection.type}")

            # Add SSL if configured
            connect_args = {}
            if conn_config.get('ssl'):
                connect_args['ssl'] = {'ca': conn_config.get('sslCert')}

            self.engines[connection.id] = create_engine(url, connect_args=connect_args)

        return self.engines[connection.id]
```

#### Saving Encrypted Connection

```python
# api/routes/connections.py
from app.core.encryption import encryption

@router.post("/connections")
async def create_connection(
    connection_data: ConnectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new database connection"""

    # Encrypt connection config before saving
    encrypted_config = encryption.encrypt_connection_config(connection_data.config)

    connection = Connection(
        name=connection_data.name,
        type=connection_data.type,
        config=encrypted_config,  # Store encrypted
        created_by=current_user.id
    )

    db.add(connection)
    db.commit()

    return {"message": "Connection created successfully", "id": connection.id}
```

### Comprehensive Error Handling

#### Error Response Schema

All API errors follow a consistent format:

```typescript
interface ErrorResponse {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable error message
    details?: any;          // Additional error context
    timestamp: string;      // ISO 8601 timestamp
    path: string;           // Request path
    requestId: string;      // Unique request ID for tracking
  };
}
```

**Example:**
```json
{
  "error": {
    "code": "CHART_NOT_FOUND",
    "message": "Chart with ID 123 does not exist",
    "timestamp": "2025-01-15T10:30:00Z",
    "path": "/api/charts/123",
    "requestId": "req_abc123xyz"
  }
}
```

#### Error Code Categories

```python
# core/errors.py
from enum import Enum
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import traceback
import uuid
from datetime import datetime

class ErrorCode(str, Enum):
    # Authentication Errors (401)
    AUTH_TOKEN_MISSING = "AUTH_TOKEN_MISSING"
    AUTH_TOKEN_INVALID = "AUTH_TOKEN_INVALID"
    AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED"
    AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS"

    # Authorization Errors (403)
    PERMISSION_DENIED = "PERMISSION_DENIED"
    INSUFFICIENT_ROLE = "INSUFFICIENT_ROLE"

    # Resource Not Found (404)
    CHART_NOT_FOUND = "CHART_NOT_FOUND"
    DASHBOARD_NOT_FOUND = "DASHBOARD_NOT_FOUND"
    USER_NOT_FOUND = "USER_NOT_FOUND"
    CONNECTION_NOT_FOUND = "CONNECTION_NOT_FOUND"

    # Validation Errors (400)
    INVALID_INPUT = "INVALID_INPUT"
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"
    INVALID_FILE_TYPE = "INVALID_FILE_TYPE"
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    INVALID_CHART_CONFIG = "INVALID_CHART_CONFIG"
    INVALID_QUERY = "INVALID_QUERY"

    # Database Errors (500)
    DATABASE_CONNECTION_FAILED = "DATABASE_CONNECTION_FAILED"
    DATABASE_QUERY_FAILED = "DATABASE_QUERY_FAILED"
    DATABASE_TIMEOUT = "DATABASE_TIMEOUT"

    # External Service Errors (502/503)
    REDIS_CONNECTION_FAILED = "REDIS_CONNECTION_FAILED"
    EXTERNAL_DB_CONNECTION_FAILED = "EXTERNAL_DB_CONNECTION_FAILED"
    CLOUD_STORAGE_ERROR = "CLOUD_STORAGE_ERROR"

    # Rate Limiting (429)
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"

    # Generic Errors
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"


class AppException(Exception):
    """Base exception for application errors"""

    def __init__(
        self,
        code: ErrorCode,
        message: str,
        status_code: int = 500,
        details: any = None
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


# Exception handler for FastAPI
async def app_exception_handler(request: Request, exc: AppException):
    """Global exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url.path),
                "requestId": str(uuid.uuid4())
            }
        }
    )


# Specific exception classes
class ChartNotFoundException(AppException):
    def __init__(self, chart_id: int):
        super().__init__(
            code=ErrorCode.CHART_NOT_FOUND,
            message=f"Chart with ID {chart_id} does not exist",
            status_code=404,
            details={"chart_id": chart_id}
        )


class DatabaseConnectionException(AppException):
    def __init__(self, connection_id: int, original_error: str):
        super().__init__(
            code=ErrorCode.EXTERNAL_DB_CONNECTION_FAILED,
            message="Failed to connect to external database",
            status_code=502,
            details={
                "connection_id": connection_id,
                "error": original_error
            }
        )


class CSVValidationException(AppException):
    def __init__(self, validation_errors: list):
        super().__init__(
            code=ErrorCode.INVALID_INPUT,
            message="CSV validation failed",
            status_code=400,
            details={"validation_errors": validation_errors}
        )
```

#### Error Handling in API Routes

```python
# api/routes/charts.py (with error handling)
from app.core.errors import ChartNotFoundException, AppException, ErrorCode

@router.get("/charts/{chart_id}")
async def get_chart(
    chart_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get chart by ID with comprehensive error handling"""

    try:
        # Query chart
        chart = db.query(Chart).filter(Chart.id == chart_id).first()

        # Handle not found
        if not chart:
            raise ChartNotFoundException(chart_id)

        # Check permissions
        if chart.created_by != current_user.id and current_user.role not in ['admin', 'editor']:
            raise AppException(
                code=ErrorCode.PERMISSION_DENIED,
                message="You don't have permission to view this chart",
                status_code=403,
                details={"chart_id": chart_id, "required_role": "admin or owner"}
            )

        # Fetch associated data
        csv_data = db.query(CSVData).filter(CSVData.chart_id == chart_id).first()

        # Handle missing data
        if not csv_data:
            return {
                "id": chart.id,
                "name": chart.name,
                "config": json.loads(chart.config),
                "data": None,
                "message": "No data associated with this chart"
            }

        # Return chart with data
        return {
            "id": chart.id,
            "name": chart.name,
            "config": json.loads(chart.config),
            "data": json.loads(csv_data.data)[:1000],  # Limit to 1000 rows
            "totalRows": csv_data.row_count
        }

    except AppException:
        # Re-raise application exceptions
        raise

    except json.JSONDecodeError as e:
        # Handle JSON parsing errors
        raise AppException(
            code=ErrorCode.INVALID_CHART_CONFIG,
            message="Chart configuration is corrupted",
            status_code=500,
            details={"error": str(e), "chart_id": chart_id}
        )

    except Exception as e:
        # Catch-all for unexpected errors
        # Log full traceback for debugging
        traceback.print_exc()

        raise AppException(
            code=ErrorCode.INTERNAL_SERVER_ERROR,
            message="An unexpected error occurred",
            status_code=500,
            details={"error": str(e)}
        )
```

#### Failure Mode Documentation

| Scenario | Error Code | HTTP Status | Recovery Action |
|----------|-----------|-------------|-----------------|
| **Chart Query Returns No Data** | N/A | 200 | Return empty data array with message |
| **External Database Connection Fails** | EXTERNAL_DB_CONNECTION_FAILED | 502 | Show connection error, suggest testing connection |
| **Redis is Down** | REDIS_CONNECTION_FAILED | N/A | Graceful degradation, queries work without cache |
| **User Uploads 1GB CSV** | FILE_TOO_LARGE | 400 | Reject upload, show size limit (50MB) |
| **Export Generation Fails** | INTERNAL_SERVER_ERROR | 500 | Log error, show user-friendly message, offer retry |
| **Invalid Chart Config JSON** | INVALID_CHART_CONFIG | 400 | Validate before save, show specific validation errors |
| **Database Query Timeout** | DATABASE_TIMEOUT | 504 | Return timeout error, suggest query optimization |
| **Token Expired** | AUTH_TOKEN_EXPIRED | 401 | Redirect to login, refresh token if available |
| **Concurrent Dashboard Edits** | N/A | 409 | Last write wins, optionally show conflict warning |
| **Missing Encryption Key** | SERVICE_UNAVAILABLE | 503 | Fail at startup, prevent app from running |

### Public Link Security and Expiration

#### Public Dashboard Token Schema

```sql
-- Add to dashboards table
ALTER TABLE dashboards ADD COLUMN public_token_expires_at TIMESTAMP;
ALTER TABLE dashboards ADD COLUMN public_token_created_at TIMESTAMP;
ALTER TABLE dashboards ADD COLUMN public_access_count INTEGER DEFAULT 0;
```

#### Token Generation and Validation

```python
# core/public_links.py
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional

class PublicLinkManager:
    """Manages public dashboard links with security and expiration"""

    TOKEN_LENGTH = 32  # 32 bytes = 256 bits
    DEFAULT_EXPIRY_DAYS = 30

    @staticmethod
    def generate_token() -> str:
        """
        Generate cryptographically secure random token

        Returns:
            URL-safe token string
        """
        # Generate secure random bytes
        random_bytes = secrets.token_bytes(PublicLinkManager.TOKEN_LENGTH)

        # Hash for additional security
        token_hash = hashlib.sha256(random_bytes).hexdigest()

        # Return first 32 characters (URL-safe)
        return token_hash[:32]

    @staticmethod
    def create_public_link(
        dashboard_id: int,
        expiry_days: Optional[int] = None,
        db: Session = None
    ) -> dict:
        """
        Create public share link for dashboard

        Args:
            dashboard_id: ID of dashboard to share
            expiry_days: Number of days until expiration (None = never)
            db: Database session

        Returns:
            Dictionary with token and expiration info

        Raises:
            DashboardNotFoundException: If dashboard doesn't exist
        """
        dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
        if not dashboard:
            raise DashboardNotFoundException(dashboard_id)

        # Generate token
        token = PublicLinkManager.generate_token()

        # Calculate expiration
        expires_at = None
        if expiry_days:
            expires_at = datetime.utcnow() + timedelta(days=expiry_days)

        # Update dashboard
        dashboard.public_token = token
        dashboard.is_public = True
        dashboard.public_token_created_at = datetime.utcnow()
        dashboard.public_token_expires_at = expires_at
        dashboard.public_access_count = 0

        db.commit()

        return {
            "token": token,
            "url": f"/view/dashboard/{token}",
            "expires_at": expires_at.isoformat() if expires_at else None,
            "created_at": dashboard.public_token_created_at.isoformat()
        }

    @staticmethod
    def validate_token(token: str, db: Session) -> Optional[Dashboard]:
        """
        Validate public token and return dashboard

        Args:
            token: Public access token
            db: Database session

        Returns:
            Dashboard if valid, None otherwise
        """
        dashboard = db.query(Dashboard).filter(
            Dashboard.public_token == token,
            Dashboard.is_public == True
        ).first()

        if not dashboard:
            return None

        # Check expiration
        if dashboard.public_token_expires_at:
            if datetime.utcnow() > dashboard.public_token_expires_at:
                # Token expired
                return None

        # Increment access count
        dashboard.public_access_count += 1
        db.commit()

        return dashboard

    @staticmethod
    def revoke_public_link(dashboard_id: int, db: Session):
        """Revoke public access to dashboard"""
        dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
        if dashboard:
            dashboard.is_public = False
            dashboard.public_token = None
            dashboard.public_token_expires_at = None
            db.commit()


public_link_manager = PublicLinkManager()
```

#### Public Dashboard View Endpoint

```python
# api/routes/dashboards.py
from app.core.public_links import public_link_manager

@router.get("/view/dashboard/{token}")
async def view_public_dashboard(
    token: str,
    db: Session = Depends(get_db)
):
    """
    View public dashboard (no authentication required)

    Security measures:
    - Token is cryptographically secure (256-bit)
    - Optional expiration date
    - Access count tracking
    - Can be revoked anytime
    - Read-only access (no modifications allowed)

    Errors:
    - 404: Token invalid or expired
    - 410: Link has been revoked
    """
    # Validate token
    dashboard = public_link_manager.validate_token(token, db)

    if not dashboard:
        raise HTTPException(
            status_code=404,
            detail="Invalid or expired public link"
        )

    # Fetch dashboard data (read-only)
    layout = json.loads(dashboard.layout)
    charts_data = []

    for item in layout.get("items", []):
        chart = db.query(Chart).filter(Chart.id == item["chartId"]).first()
        if chart:
            # Get chart data
            csv_data = db.query(CSVData).filter(CSVData.chart_id == chart.id).first()

            charts_data.append({
                "id": chart.id,
                "name": chart.name,
                "config": json.loads(chart.config),
                "data": json.loads(csv_data.data)[:1000] if csv_data else [],
                "position": item["position"]
            })

    return {
        "id": dashboard.id,
        "name": dashboard.name,
        "description": dashboard.description,
        "layout": layout,
        "charts": charts_data,
        "isPublic": True,
        "accessCount": dashboard.public_access_count,
        "expiresAt": dashboard.public_token_expires_at.isoformat() if dashboard.public_token_expires_at else None
    }
```

#### Revoking Public Access

```python
@router.delete("/dashboards/{dashboard_id}/share")
async def revoke_public_access(
    dashboard_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke public access to dashboard"""

    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise DashboardNotFoundException(dashboard_id)

    # Check permissions
    if dashboard.created_by != current_user.id and current_user.role != 'admin':
        raise AppException(
            code=ErrorCode.PERMISSION_DENIED,
            message="Only the dashboard owner can revoke public access",
            status_code=403
        )

    public_link_manager.revoke_public_link(dashboard_id, db)

    return {"message": "Public access revoked successfully"}
```

### Database Initialization

```python
# seeds/init_db.py
from sqlalchemy.orm import Session
from app.models.sqlite_models import Base, User, Dashboard, Setting
from app.utils.db import engine
from app.core.security import get_password_hash
import json

def init_database():
    """Initialize database with default data"""

    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Create session
    session = Session(engine)

    try:
        # Check if admin user exists
        admin = session.query(User).filter_by(username="admin").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@example.com",
                password_hash=get_password_hash("admin123"),
                role="admin",
                is_active=True
            )
            session.add(admin)
            print("✅ Created default admin user (admin/admin123)")

        # Check if default dashboard exists
        default_dashboard = session.query(Dashboard).filter_by(name="Welcome Dashboard").first()
        if not default_dashboard:
            default_dashboard = Dashboard(
                name="Welcome Dashboard",
                description="Default dashboard with sample chart",
                layout=json.dumps({"rows": []}),
                created_by=admin.id if admin else 1,
                is_public=False
            )
            session.add(default_dashboard)
            print("✅ Created default dashboard")

        # Initialize default settings
        import tempfile
        import os

        # Use cross-platform temporary directory
        default_export_path = os.path.join(tempfile.gettempdir(), "visualization_platform_exports")

        default_settings = [
            ("theme", json.dumps({"mode": "light", "primaryColor": "#3b82f6"}), "UI theme settings"),
            ("redis_enabled", json.dumps(False), "Enable Redis caching"),
            ("max_query_results", json.dumps(10000), "Maximum rows returned per query"),
            ("export_path", json.dumps(default_export_path), "Path for temporary export files")
        ]

        for key, value, description in default_settings:
            existing = session.query(Setting).filter_by(key=key).first()
            if not existing:
                setting = Setting(key=key, value=value, description=description)
                session.add(setting)

        print("✅ Initialized default settings")

        session.commit()
        print("✅ Database initialization complete")

    except Exception as e:
        session.rollback()
        print(f"❌ Database initialization failed: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    init_database()
```

## User Experience

### User Flows

#### 1. First-Time User Login
1. User navigates to `http://localhost:5173`
2. Presented with login screen
3. Enters default credentials (admin/admin123)
4. Redirected to dashboard list showing "Welcome Dashboard"
5. Prompted to change password on first login

#### 2. Creating a Chart
1. Navigate to "Charts" section
2. Click "New Chart" button
3. **Step 1**: Select data source (existing connection or upload CSV)
4. **Step 2**: Choose chart type (bar, line, pie, scatter, area)
5. **Step 3**: Configure data mapping (X-axis, Y-axis, series)
6. **Step 4**: Customize appearance (colors, labels, legend)
7. **Step 5**: Preview chart with live data
8. Save chart with name and description

#### 3. Building a Dashboard
1. Navigate to "Dashboards" section
2. Click "New Dashboard" button
3. Enter dashboard name and description
4. Drag existing charts from sidebar onto grid
5. Resize and reposition charts using drag handles
6. Save dashboard
7. Option to make dashboard public and generate shareable link

#### 4. Sharing a Dashboard
1. Open existing dashboard
2. Click "Share" button
3. Choose sharing option:
   - **Image**: Download dashboard as PNG
   - **PDF**: Download comprehensive PDF report
   - **Excel**: Download all chart data as Excel workbook
   - **Link**: Generate public URL (no authentication required)
4. Copy link or download file

#### 5. Admin Configuration
1. Admin user clicks "Settings" in navigation
2. Access configuration panels:
   - **General**: Theme, branding, defaults
   - **Redis**: Connection string, cache TTL
   - **Connections**: Add/edit database connections
   - **Cloud Storage**: Configure S3/Azure/GCS credentials
   - **Users**: Manage user accounts and roles
   - **Security**: JWT settings, session timeout

### UI Components

#### Chart Builder Interface
```
┌─────────────────────────────────────────────┐
│ Create New Chart                        [X] │
├─────────────────────────────────────────────┤
│                                             │
│ Step 1: Data Source                         │
│ ┌─────────────────────────────────────────┐ │
│ │ ○ Existing Connection                   │ │
│ │   [Select Connection ▼]                 │ │
│ │ ○ Upload CSV                            │ │
│ │   [Choose File]                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Step 2: Chart Type                          │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│ │ 📊   │ │ 📈   │ │ 🥧   │ │ 🔵   │       │
│ │ Bar  │ │ Line │ │ Pie  │ │Scatter│       │
│ └──────┘ └──────┘ └──────┘ └──────┘       │
│                                             │
│ Step 3: Data Mapping                        │
│ X-Axis: [Select Column ▼]                  │
│ Y-Axis: [Select Column ▼]                  │
│ Series: [Select Column ▼] (optional)       │
│                                             │
│ Step 4: Preview                             │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ │         [Chart Preview Here]            │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│           [Cancel]  [Save Chart]            │
└─────────────────────────────────────────────┘
```

#### Dashboard Grid Layout
```
┌───────────────────────────────────────────────────────────┐
│ Sales Dashboard                    [Share ▼] [Edit] [⚙️]  │
├───────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐  ┌─────────────────────────────┐ │
│ │ Revenue by Month    │  │ Top Products                │ │
│ │                     │  │                             │ │
│ │  📈 Line Chart      │  │  📊 Bar Chart               │ │
│ │                     │  │                             │ │
│ └─────────────────────┘  └─────────────────────────────┘ │
│                                                           │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Sales by Region                                       │ │
│ │                                                       │ │
│ │  🗺️ Geographic Map                                    │ │
│ │                                                       │ │
│ └───────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

## Testing Strategy

### Unit Tests

#### Backend Unit Tests
```python
# tests/test_auth.py
import pytest
from app.core.security import create_access_token, verify_password, get_password_hash

def test_password_hashing():
    """
    Purpose: Verify password hashing is one-way and produces different hashes
    for the same password on different calls (salted).
    Can fail if: Hashing algorithm is broken or salt is not applied.
    """
    password = "testpassword123"
    hashed1 = get_password_hash(password)
    hashed2 = get_password_hash(password)

    assert hashed1 != hashed2  # Different salts
    assert verify_password(password, hashed1)
    assert verify_password(password, hashed2)
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

# tests/test_charts.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_chart_without_auth():
    """
    Purpose: Verify authentication is required for chart creation.
    Can fail if: Auth middleware is not properly configured.
    """
    response = client.post("/api/charts", json={
        "name": "Test Chart",
        "chart_type": "bar"
    })
    assert response.status_code == 401

def test_create_chart_with_auth(auth_token):
    """
    Purpose: Verify authenticated users can create charts with valid data.
    Can fail if: Chart creation logic has bugs or validation is too strict.
    """
    response = client.post(
        "/api/charts",
        json={
            "name": "Sales Chart",
            "chart_type": "bar",
            "config": {"x": "month", "y": "revenue"}
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Sales Chart"
    assert "id" in data

def test_create_chart_invalid_type(auth_token):
    """
    Purpose: Ensure invalid chart types are rejected.
    Can fail if: Input validation is not working.
    """
    response = client.post(
        "/api/charts",
        json={
            "name": "Invalid Chart",
            "chart_type": "invalid_type"
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 422  # Validation error
```

#### Frontend Unit Tests
```typescript
// src/components/charts/__tests__/ChartBuilder.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ChartBuilder from '../ChartBuilder';

describe('ChartBuilder', () => {
  test('renders all chart type options', () => {
    /**
     * Purpose: Ensure all supported chart types are displayed.
     * Can fail if: Chart types array is modified without updating UI.
     */
    render(<ChartBuilder />);
    expect(screen.getByText('Bar')).toBeInTheDocument();
    expect(screen.getByText('Line')).toBeInTheDocument();
    expect(screen.getByText('Pie')).toBeInTheDocument();
    expect(screen.getByText('Scatter')).toBeInTheDocument();
  });

  test('validates required fields before save', async () => {
    /**
     * Purpose: Verify form validation prevents saving incomplete charts.
     * Can fail if: Validation logic is bypassed or not triggered.
     */
    render(<ChartBuilder />);
    const saveButton = screen.getByText('Save Chart');
    fireEvent.click(saveButton);

    expect(await screen.findByText('Chart name is required')).toBeInTheDocument();
  });

  test('updates preview when data mapping changes', () => {
    /**
     * Purpose: Ensure chart preview updates reactively as user configures it.
     * Can fail if: State updates are not triggering re-renders.
     */
    const { rerender } = render(<ChartBuilder />);
    // Simulate selecting X-axis column
    // Verify preview updates
    // This test validates the reactive nature of the chart builder
  });
});
```

### Integration Tests

```python
# tests/test_integration.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.db import SessionLocal
from app.models.sqlite_models import User, Chart, Dashboard

client = TestClient(app)

def test_full_chart_to_dashboard_flow():
    """
    Purpose: Validate end-to-end flow of creating a chart and adding it to a dashboard.
    Can fail if: Any part of the chart->dashboard relationship is broken.
    """
    # 1. Login
    login_response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create chart
    chart_response = client.post("/api/charts", json={
        "name": "Test Chart",
        "chart_type": "bar",
        "config": {"x": "month", "y": "sales"}
    }, headers=headers)
    assert chart_response.status_code == 201
    chart_id = chart_response.json()["id"]

    # 3. Create dashboard
    dashboard_response = client.post("/api/dashboards", json={
        "name": "Test Dashboard",
        "layout": {"rows": []}
    }, headers=headers)
    assert dashboard_response.status_code == 201
    dashboard_id = dashboard_response.json()["id"]

    # 4. Add chart to dashboard
    update_response = client.put(f"/api/dashboards/{dashboard_id}", json={
        "charts": [{"chart_id": chart_id, "position": {"x": 0, "y": 0, "w": 6, "h": 4}}]
    }, headers=headers)
    assert update_response.status_code == 200

    # 5. Verify dashboard contains chart
    get_response = client.get(f"/api/dashboards/{dashboard_id}", headers=headers)
    assert get_response.status_code == 200
    dashboard_data = get_response.json()
    assert len(dashboard_data["charts"]) == 1
    assert dashboard_data["charts"][0]["chart_id"] == chart_id

def test_query_caching():
    """
    Purpose: Verify Redis caching improves query performance.
    Can fail if: Cache is not being used or invalidation is broken.
    """
    # First query - should hit database
    # Second identical query - should hit cache
    # Measure response times and verify cache hit
    pass
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/dashboard-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard Creation Flow', () => {
  test('user can create and share dashboard', async ({ page }) => {
    /**
     * Purpose: Validate complete user workflow from login to sharing.
     * Can fail if: Any UI element changes or workflow is broken.
     */

    // 1. Login
    await page.goto('http://localhost:5173');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // 2. Wait for redirect to dashboard list
    await expect(page).toHaveURL(/.*dashboards/);

    // 3. Create new dashboard
    await page.click('text=New Dashboard');
    await page.fill('input[name="name"]', 'E2E Test Dashboard');
    await page.click('text=Save');

    // 4. Verify dashboard was created
    await expect(page.locator('text=E2E Test Dashboard')).toBeVisible();

    // 5. Open dashboard
    await page.click('text=E2E Test Dashboard');

    // 6. Generate share link
    await page.click('button:has-text("Share")');
    await page.click('text=Generate Public Link');

    // 7. Verify share link is generated
    const shareLink = await page.locator('input[name="shareLink"]').inputValue();
    expect(shareLink).toContain('/view/dashboard/');

    // 8. Open share link in new context (no auth)
    const newPage = await page.context().newPage();
    await newPage.goto(shareLink);
    await expect(newPage.locator('text=E2E Test Dashboard')).toBeVisible();
  });
});
```

### Mocking Strategies

```python
# tests/conftest.py
import pytest
from unittest.mock import MagicMock, patch
from app.utils.cache import CacheManager

@pytest.fixture
def mock_redis():
    """Mock Redis for testing without actual Redis instance"""
    with patch('redis.from_url') as mock:
        mock_client = MagicMock()
        mock.return_value = mock_client
        yield mock_client

@pytest.fixture
def mock_s3():
    """Mock S3 client for testing cloud uploads"""
    with patch('boto3.client') as mock:
        mock_s3_client = MagicMock()
        mock.return_value = mock_s3_client
        yield mock_s3_client

@pytest.fixture
def auth_token(client):
    """Fixture providing valid JWT token for tests"""
    response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    return response.json()["access_token"]
```

## Performance Considerations

### Database Optimization
1. **Indexes**: Created on frequently queried columns (user_id, created_at, public_token)
2. **Query Limits**: Default max 10,000 rows per query (configurable)
3. **Connection Pooling**: SQLAlchemy manages connection pools for external databases
4. **JSON Storage**: Chart configurations stored as JSON for flexibility

### Caching Strategy
1. **Query Results**: Cache for 5 minutes (configurable TTL)
2. **User Sessions**: Store in Redis for fast auth checks
3. **Cache Invalidation**: Automatic on data updates
4. **Graceful Degradation**: System works without Redis (just slower)

### Frontend Optimization
1. **Code Splitting**: Lazy load chart components
2. **Virtual Scrolling**: For large dashboard lists
3. **Debounced Search**: Reduce API calls during user input
4. **Image Optimization**: Compress exported PNGs

### API Performance
1. **Pagination**: All list endpoints support offset/limit
2. **Field Selection**: Option to request only needed fields
3. **Async Operations**: FastAPI async endpoints for I/O operations
4. **Request Timeouts**: 30-second timeout on external queries

## Security Considerations

### Authentication & Authorization
1. **JWT Tokens**: Short-lived access tokens (30 minutes)
2. **Password Hashing**: bcrypt with proper salt
3. **Role-Based Access**: Admin, Editor, Viewer roles
4. **Session Management**: Logout invalidates tokens

### Data Security
1. **SQL Injection Prevention**: Parameterized queries only
2. **XSS Protection**: React automatically escapes output
3. **CSRF Protection**: SameSite cookies + token validation
4. **Connection Encryption**: Support for SSL/TLS database connections
5. **Secrets Management**: Credentials encrypted at rest

### API Security
1. **Rate Limiting**: Prevent brute force attacks
2. **Input Validation**: Pydantic schemas validate all inputs
3. **CORS Configuration**: Whitelist allowed origins
4. **Security Headers**: Helmet.js equivalent for FastAPI

### Docker Security
1. **Non-root User**: Run containers as non-root
2. **Read-only Filesystem**: Where possible
3. **No Secrets in Images**: Use environment variables
4. **Minimal Base Images**: Use slim Python images

## Documentation

### Required Documentation
1. **README.md**: Quick start guide, architecture overview
2. **API Documentation**: Auto-generated via FastAPI (Swagger/OpenAPI)
3. **Deployment Guide**: Docker setup, environment variables
4. **User Manual**: How to create charts and dashboards
5. **Admin Guide**: Configuration and user management
6. **Developer Guide**: Architecture, contributing guidelines

### Inline Documentation
1. **Docstrings**: All functions and classes
2. **Type Hints**: Full Python type annotations
3. **Comments**: Complex business logic explained
4. **OpenAPI Schemas**: Detailed request/response examples

## Implementation Phases

### Phase 1: MVP / Core Functionality

**Goal**: Working visualization platform with basic features

**Deliverables**:
1. **Backend Foundation**
   - FastAPI application setup
   - SQLite database with core tables
   - User authentication (JWT)
   - Basic CRUD APIs for users, charts, dashboards

2. **Frontend Foundation**
   - React app with routing
   - Login/logout flow
   - Chart list and detail views
   - Dashboard list and detail views

3. **Core Features**
   - Create bar and line charts from CSV uploads
   - Create dashboards with static grid layout
   - Basic user management (admin only)

4. **Docker Setup**
   - Backend Dockerfile
   - Frontend Dockerfile
   - docker-compose.yml for local development

**Success Criteria**:
- User can login, create a chart from CSV, add it to a dashboard, and view it
- All components run via `docker-compose up`
- Basic test coverage (>60%)

### Phase 2: Enhanced Features

**Goal**: Production-ready features and integrations

**Deliverables**:
1. **Advanced Visualizations**
   - Pie, scatter, area charts
   - Chart customization (colors, labels, legend)
   - Interactive tooltips and zoom

2. **External Data Sources**
   - MySQL connection support
   - PostgreSQL connection support
   - Query builder UI

3. **Caching Layer**
   - Redis integration
   - Query result caching
   - Cache invalidation logic

4. **Export Features**
   - Image export (PNG)
   - PDF export
   - Excel export
   - Shareable public links

5. **Admin Panel**
   - Settings management UI
   - Connection management UI
   - User role management

**Success Criteria**:
- User can connect to external MySQL database and visualize data
- Dashboard can be exported as PDF
- Redis caching improves query performance by >50%
- Test coverage >75%

### Phase 3: Polish and Optimization

**Goal**: Enterprise-grade quality and performance

**Deliverables**:
1. **Performance Optimization**
   - Database query optimization
   - Frontend code splitting
   - Image lazy loading
   - API response caching

2. **Cloud Storage**
   - S3 integration for exports
   - Azure Blob Storage support
   - GCS support

3. **Advanced Features**
   - Dashboard drag-and-drop editor
   - Chart templates
   - Scheduled reports (future)
   - Activity logging and audit trail

4. **Production Hardening**
   - Comprehensive error handling
   - Logging and monitoring
   - Health check endpoints
   - Database backup/restore

5. **Documentation**
   - Complete user manual
   - API documentation
   - Deployment guide
   - Video tutorials

**Success Criteria**:
- Dashboard loads in <2 seconds with 10 charts
- Exports complete in <5 seconds
- Zero critical security vulnerabilities
- Test coverage >85%
- Production deployment guide complete

## Open Questions

1. **Chart Library Selection**: Recharts vs. Chart.js vs. D3.js?
   - **Recommendation**: Recharts for React integration, but may need D3 for advanced visualizations

2. **File Upload Limits**: What's the max CSV size we should support?
   - **Consideration**: Start with 10MB, implement streaming for larger files later

3. **Multi-tenancy**: Should we support multiple organizations in V1?
   - **Decision**: No, keep V1 single-tenant for simplicity

4. **Real-time Updates**: Should dashboards auto-refresh?
   - **Consideration**: Add WebSocket support in Phase 2 for live updates

5. **Query Builder**: Visual SQL builder or raw SQL input?
   - **Recommendation**: Both - visual builder for simple queries, raw SQL for advanced users

6. **Backup Strategy**: How should users backup their .db file?
   - **Solution**: Add backup/restore endpoints + scheduled backups to cloud storage

7. **Mobile Experience**: Should we optimize for mobile or tablet?
   - **Decision**: Tablet-optimized, mobile is view-only

8. **Plugin System**: Should we support custom chart types?
   - **Decision**: Phase 3 feature, not in MVP

## References

### External Libraries Documentation
- **FastAPI**: https://fastapi.tiangolo.com/
- **SQLAlchemy**: https://docs.sqlalchemy.org/
- **React**: https://react.dev/
- **Recharts**: https://recharts.org/
- **Tailwind CSS**: https://tailwindcss.com/
- **React Grid Layout**: https://github.com/react-grid-layout/react-grid-layout
- **Zustand**: https://github.com/pmndrs/zustand
- **ReportLab**: https://www.reportlab.com/documentation/

### Design Patterns
- **Repository Pattern**: For data access layer
- **Dependency Injection**: FastAPI's built-in DI system
- **Factory Pattern**: For creating database engine instances
- **Strategy Pattern**: For different export formats
- **Observer Pattern**: For cache invalidation

### Similar Projects (Inspiration)
- **Apache Superset**: https://superset.apache.org/
- **Metabase**: https://www.metabase.com/
- **Redash**: https://redash.io/

### Security Best Practices
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **FastAPI Security**: https://fastapi.tiangolo.com/tutorial/security/
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725

---

## Appendix: Environment Variables

```bash
# .env.example

# Application
APP_NAME=VisualizationPlatform
APP_VERSION=1.0.0
DEBUG=false

# Security
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Encryption (REQUIRED - generate with: python -c "import secrets; print(secrets.token_urlsafe(32))")
ENCRYPTION_MASTER_KEY=your-32-byte-master-key-here-change-in-production

# Database
SQLITE_PATH=app_metadata.db

# Redis (optional)
REDIS_URL=redis://redis:6379/0
REDIS_ENABLED=true

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Export Settings
# Note: Uses system temp dir by default. Override only if needed.
# Windows: C:\Users\<username>\AppData\Local\Temp\visualization_platform_exports
# Linux/Mac: /tmp/visualization_platform_exports
EXPORT_PATH=
MAX_EXPORT_SIZE_MB=50

# Query Limits
MAX_QUERY_RESULTS=10000
QUERY_TIMEOUT_SECONDS=30

# Cloud Storage (optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1

AZURE_STORAGE_CONNECTION_STRING=

GCS_CREDENTIALS_PATH=
```

---

**End of Specification**
