from app.database import SessionLocal
from app.models.market_data import DemandHistory
from sqlalchemy import func

def main():
    db = SessionLocal()
    avg = db.query(func.avg(DemandHistory.demand_quantity)).filter(DemandHistory.crop_name == "Tomato").scalar()
    print("Avg Demand for Tomato:", avg)
    db.close()

if __name__ == "__main__":
    main()
