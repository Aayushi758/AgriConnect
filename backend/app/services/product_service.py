"""Product service - CRUD operations for products."""
import os
import uuid
import shutil
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from fastapi import UploadFile, HTTPException

from app.config import get_settings
from app.models.product import Product, ProductImage, ProductStatus, Category
from app.models.inventory import Inventory
from app.models.user import FarmerProfile
from app.schemas.product import ProductCreate, ProductUpdate

settings = get_settings()


def get_categories(db: Session) -> List[Category]:
    return db.query(Category).order_by(Category.name).all()


def create_product(db: Session, farmer_id: int, product_data: ProductCreate) -> Product:
    product = Product(
        farmer_id=farmer_id,
        name=product_data.name,
        category_id=product_data.category_id,
        description=product_data.description,
        price=product_data.price,
        unit=product_data.unit,
        available_quantity=product_data.available_quantity,
        min_order_quantity=product_data.min_order_quantity,
        harvest_date=product_data.harvest_date,
        availability_date=product_data.availability_date,
        location=product_data.location,
        quality_grade=product_data.quality_grade,
        is_organic=product_data.is_organic,
        status=ProductStatus.ACTIVE if product_data.available_quantity > 0 else ProductStatus.OUT_OF_STOCK,
    )
    db.add(product)
    db.flush()

    # Create inventory record
    inventory = Inventory(
        product_id=product.id,
        current_stock=product_data.available_quantity,
        total_added=product_data.available_quantity,
    )
    db.add(inventory)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product_id: int, farmer_id: int, product_data: ProductUpdate) -> Product:
    product = db.query(Product).filter(
        Product.id == product_id, Product.farmer_id == farmer_id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    # Auto-update status based on quantity
    if product.available_quantity <= 0:
        product.status = ProductStatus.OUT_OF_STOCK

    product.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int, farmer_id: int):
    product = db.query(Product).filter(
        Product.id == product_id, Product.farmer_id == farmer_id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()


def get_farmer_products(db: Session, farmer_id: int) -> List[Product]:
    return db.query(Product).options(
        joinedload(Product.images),
        joinedload(Product.category),
        joinedload(Product.inventory),
    ).filter(Product.farmer_id == farmer_id).order_by(Product.created_at.desc()).all()


def get_product_by_id(db: Session, product_id: int) -> Optional[Product]:
    return db.query(Product).options(
        joinedload(Product.images),
        joinedload(Product.category),
        joinedload(Product.farmer).joinedload(FarmerProfile.user),
    ).filter(Product.id == product_id).first()


def get_marketplace_products(
    db: Session,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    farmer_id: Optional[int] = None,
    location: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    is_organic: Optional[bool] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    skip: int = 0,
    limit: int = 20,
) -> List[Product]:
    query = db.query(Product).options(
        joinedload(Product.images),
        joinedload(Product.category),
        joinedload(Product.farmer).joinedload(FarmerProfile.user),
    ).filter(Product.status == ProductStatus.ACTIVE, Product.available_quantity > 0)

    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if farmer_id:
        query = query.filter(Product.farmer_id == farmer_id)
    if location:
        query = query.filter(Product.location.ilike(f"%{location}%"))
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if is_organic is not None:
        query = query.filter(Product.is_organic == is_organic)

    # Sort
    sort_col = getattr(Product, sort_by, Product.created_at)
    if sort_order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    return query.offset(skip).limit(limit).all()


async def upload_product_image(
    db: Session, product_id: int, farmer_id: int, file: UploadFile
) -> ProductImage:
    product = db.query(Product).filter(
        Product.id == product_id, Product.farmer_id == farmer_id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed")

    # Save file
    upload_dir = settings.upload_path / "products"
    upload_dir.mkdir(parents=True, exist_ok=True)
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = upload_dir / filename

    with open(filepath, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    # Check if this is the first image (make it primary)
    existing_images = db.query(ProductImage).filter(ProductImage.product_id == product_id).count()
    is_primary = existing_images == 0

    image = ProductImage(
        product_id=product_id,
        image_url=f"/uploads/products/{filename}",
        is_primary=is_primary,
        sort_order=existing_images,
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image
