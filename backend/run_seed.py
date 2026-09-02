import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base, SessionLocal
import app.models  # Import all models to register them with Base
from app.seed.seed_data import seed_database

print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Tables created.")

print("Seeding database...")
db = SessionLocal()
try:
    result = seed_database(db)
    print(result)
finally:
    db.close()
