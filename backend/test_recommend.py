from app.database import SessionLocal
from app.ml.crop_recommendation import recommend_crops

def main():
    db = SessionLocal()
    res = recommend_crops(db)
    print("Recommendations:", res)
    db.close()

if __name__ == "__main__":
    main()
