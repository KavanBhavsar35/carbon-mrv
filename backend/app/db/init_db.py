import logging
from app.db.session import engine, Base
import app.models  # Ensure models are imported so Base metadata is populated

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db() -> None:
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully.")

if __name__ == "__main__":
    init_db()
