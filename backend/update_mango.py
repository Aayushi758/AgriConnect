from sqlalchemy import create_engine, text

def main():
    engine = create_engine('sqlite:///c:/KissanYojna/backend/kisansetu.db')
    with engine.begin() as conn:
        conn.execute(text("UPDATE products SET primary_image = 'https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=400' WHERE name = 'Mango'"))
    print("Updated Mango images in the database.")

if __name__ == "__main__":
    main()
