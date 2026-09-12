import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Circular Carbon MRV Backend"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./carbon_mrv.db")
    ML_SERVICE_URL: str = os.getenv("ML_SERVICE_URL", "http://127.0.0.1:8001")
    RPC_URL: str = os.getenv("RPC_URL", "http://127.0.0.1:8545")
    CHAIN_ID: int = int(os.getenv("CHAIN_ID", "31337"))
    CONTRACT_ADDRESS: str = os.getenv("CONTRACT_ADDRESS", "0x5FbDB2315678afecb367f032d93F642f64180aa3")
    DEPLOYER_PRIVATE_KEY: str = os.getenv("PRIVATE_KEY", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "circular-carbon-secret-key-super-secure")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours for easy hackathon testing

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
