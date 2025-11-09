from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import auth, dashboards, connections, workspaces, health, data_sources, charts
from app.core.workspace_middleware import WorkspaceIsolationMiddleware
from app.core.data_isolation import register_isolation_events
from app.core.invitations import set_secret_key
from app.models.sqlite_models import Base

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware - MUST be added before other middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# NOTE: Workspace isolation middleware disabled - workspace isolation is handled
# at the route level via WorkspaceContextInjector.get_workspace_id() in each endpoint.
# The middleware expects request.state.user and request.state.db which are not set
# because this app uses dependency injection (Depends) instead of middleware for auth.
# Re-enable this only after implementing proper authentication middleware.
# app.add_middleware(WorkspaceIsolationMiddleware)

# CRITICAL: Register data isolation event listeners
register_isolation_events(Base)

# CRITICAL: Initialize invitation token secret key
set_secret_key(settings.SECRET_KEY)

# Register routers
app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(workspaces.router, prefix="/api")
app.include_router(dashboards.router, prefix="/api")
app.include_router(connections.router, prefix="/api")
app.include_router(data_sources.router, prefix="/api")
app.include_router(charts.router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
