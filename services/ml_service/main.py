import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.ml_service.routes.analysis import router as analysis_router
from services.ml_service.routes.carbon import router as carbon_router
from services.ml_service.routes.verification import router as verification_router
from services.ml_service.services.ml_engine import ml_engine

app = FastAPI(
    title="Circular Carbon ML Service",
    description="Remote Sensing Analysis, Carbon Estimation, and Anomaly Detection Microservice",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ml/health", tags=["Health"])
async def health():
    return {
        "status": "healthy",
        "service": "circular-carbon-ml-service",
        "models_loaded": ml_engine.is_initialized
    }

# Include ML subrouters with /ml prefix
app.include_router(analysis_router, prefix="/ml")
app.include_router(carbon_router, prefix="/ml")
app.include_router(verification_router, prefix="/ml")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("ML_PORT", "8001"))
    uvicorn.run("services.ml_service.main:app", host="0.0.0.0", port=port, reload=True)
