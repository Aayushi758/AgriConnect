from app.database import SessionLocal
from app.seed.seed_data import generate_price_history, generate_demand_history, generate_weather_data

def main():
    print("Seeding ML data...")
    db = SessionLocal()
    try:
        from app.models.market_data import PriceHistory
        if db.query(PriceHistory).first() is None:
            print("Generating price history...")
            generate_price_history(db)
            print("Generating demand history...")
            generate_demand_history(db)
            print("Generating weather data...")
            generate_weather_data(db)
            print("Done seeding ML data.")
        else:
            print("ML data already seeded.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
