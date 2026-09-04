import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.product import Product, ProductImage

CROP_IMAGES = {
    "Tomato": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=400",
    "Potato": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=400",
    "Onion": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?q=80&w=400",
    "Cauliflower": "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?q=80&w=400",
    "Spinach": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=400",
    "Green Chilli": "https://images.unsplash.com/photo-1588079079944-9d56965be2f6?q=80&w=400",
    "Brinjal": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=400",
    "Carrot": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=400",
    "Capsicum": "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?q=80&w=400",
    "Cabbage": "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?q=80&w=400",
    "Bitter Gourd": "https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?q=80&w=400",
    "Okra (Bhindi)": "https://images.unsplash.com/photo-1606131731446-5568d87113aa?q=80&w=400",
    "Peas": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=400",
    "Drumstick": "https://images.unsplash.com/photo-1582294440071-b0db43026dd1?q=80&w=400",
    "Coriander": "https://images.unsplash.com/photo-1589133157297-b9c1d68a9840?q=80&w=400",
    "Rice": "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?q=80&w=400",
    "Wheat": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=400",
    "Mango": "https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=400",
    "Banana": "https://images.unsplash.com/photo-1603833665858-e61d17a86224?q=80&w=400",
    "Watermelon": "https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?q=80&w=400",
}
DEFAULT_IMAGE = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400"

def fix_images():
    db = SessionLocal()
    try:
        products = db.query(Product).all()
        added_count = 0
        for p in products:
            if not p.images:
                img_url = CROP_IMAGES.get(p.name, DEFAULT_IMAGE)
                pi = ProductImage(product_id=p.id, image_url=img_url, is_primary=True)
                db.add(pi)
                added_count += 1
        db.commit()
        print(f"Added images for {added_count} products.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_images()
