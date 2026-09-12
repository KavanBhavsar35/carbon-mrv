from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine, Base

# Import all models to ensure metadata is populated
from app import models as _models  # noqa: F401

# Create all tables on startup (SQLite dev; Alembic handles prod migrations)
Base.metadata.create_all(bind=engine)

from app.routers.auth import router as auth_router
from app.routers.projects import router as projects_router
from app.routers.users import router as users_router
from app.routers.iot_devices import router as iot_devices_router
from app.routers.measurements import router as measurements_router
from app.routers.ml import router as ml_router
from app.routers.carbon_credits import router as carbon_credits_router

app = FastAPI(
    title="Carbon MRV Backend",
    version="0.1.0",
    description="Circular Carbon Ecosystem — Verifiable Carbon Credit & Offset Tracking System",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers (prefixes are defined inside each router module)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(projects_router)
app.include_router(iot_devices_router)
app.include_router(measurements_router)
app.include_router(ml_router)
app.include_router(carbon_credits_router)
