import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.models.models import User, Project, ProjectEvidence
from backend.app.services.auth_service import get_password_hash
from shared.schemas.models import UserRole, ProjectType
from backend.app.routers import auth, projects, claims, auditor, credits, dashboards, verify

# Create database tables
Base.metadata.create_all(bind=engine)

from contextlib import asynccontextmanager

# Startup seeding for demo users
def seed_demo_data():
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            users_to_seed = [
                User(
                    email="issuer@circularcarbon.org",
                    hashed_password=get_password_hash("issuer123"),
                    name="Sundarbans Eco Trust",
                    role=UserRole.ISSUER,
                    organization="Sundarbans Marine Conservation",
                    wallet_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                ),
                User(
                    email="auditor@verra-audit.org",
                    hashed_password=get_password_hash("auditor123"),
                    name="Dr. Elena Vance (Lead Auditor)",
                    role=UserRole.AUDITOR,
                    organization="Global Carbon Standards Institute",
                    wallet_address="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
                ),
                User(
                    email="buyer@microsoft-esg.com",
                    hashed_password=get_password_hash("buyer123"),
                    name="Global ESG Carbon Procurement",
                    role=UserRole.BUYER,
                    organization="Tech Zero Consortium",
                    wallet_address="0x90F79bf6EB2c4f870365E785982E1f101E93b906"
                ),
                User(
                    email="regulator@unfccc-registry.int",
                    hashed_password=get_password_hash("regulator123"),
                    name="International Carbon Inspectorate",
                    role=UserRole.REGULATOR,
                    organization="UNFCCC Article 6 Supervisory Body",
                    wallet_address="0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
                ),
            ]
            db.add_all(users_to_seed)
            db.commit()
    finally:
        db.close()

# Seed database immediately upon initialization
seed_demo_data()

@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_demo_data()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Verifiable Carbon Credit & Offset Tracking Backend API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(claims.router, prefix="/api")
app.include_router(auditor.router, prefix="/api")
app.include_router(credits.router, prefix="/api")
app.include_router(dashboards.router, prefix="/api")
app.include_router(verify.router, prefix="/api")

@app.get("/api/health", tags=["Health"])
def health():
    return {
        "status": "healthy",
        "service": "circular-carbon-backend",
        "database": "sqlite",
        "smart_contract": settings.CONTRACT_ADDRESS
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=True)
