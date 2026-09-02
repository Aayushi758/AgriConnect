"""Product routes - CRUD and marketplace browsing."""
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth_service import get_current_user, require_farmer
from app.services.product_service import (
    create_product, update_product, delete_product,
    get_farmer_products, get_product_by_id, get_marketplace_products,
    upload_product_image, get_categories,
)
from app.models.user import User, FarmerProfile
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    CategoryResponse, ProductImageResponse,
)

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    """List all product categories."""
    return get_categories(db)


@router.get("/marketplace", response_model=List[ProductListResponse])
def browse_marketplace(
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
    db: Session = Depends(get_db),
):
    """Browse marketplace products with filters."""
    products = get_marketplace_products(
        db, search, category_id, farmer_id, location,
        min_price, max_price, is_organic, sort_by, sort_order, skip, limit
    )
    result = []
    for p in products:
        primary_img = next((img.image_url for img in p.images if img.is_primary), 
                          p.images[0].image_url if p.images else None)
        result.append(ProductListResponse(
            id=p.id,
            farmer_id=p.farmer_id,
            name=p.name,
            price=p.price,
            unit=p.unit.value if hasattr(p.unit, 'value') else p.unit,
            available_quantity=p.available_quantity,
            location=p.location,
            is_organic=p.is_organic,
            status=p.status.value if hasattr(p.status, 'value') else p.status,
            category_name=p.category.name if p.category else None,
            farmer_name=p.farmer.user.full_name if p.farmer and p.farmer.user else None,
            farmer_city=p.farmer.city if p.farmer else None,
            primary_image=primary_img,
            rating=p.farmer.rating if p.farmer else 0,
            created_at=p.created_at,
        ))
    return result


@router.get("/my-products", response_model=List[ProductResponse])
def my_products(current_user: User = Depends(require_farmer), db: Session = Depends(get_db)):
    """Get current farmer's products."""
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
    products = get_farmer_products(db, profile.id)
    return [ProductResponse.model_validate(p) for p in products]


@router.post("/", response_model=ProductResponse)
def create_new_product(product_data: ProductCreate,
                       current_user: User = Depends(require_farmer),
                       db: Session = Depends(get_db)):
    """Create a new product listing."""
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
    
    if not product_data.location and profile.city:
        product_data.location = f"{profile.city}, {profile.state}"
    
    product = create_product(db, profile.id, product_data)
    return ProductResponse.model_validate(product)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get product details."""
    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductResponse.model_validate(product)


@router.put("/{product_id}", response_model=ProductResponse)
def update_existing_product(product_id: int, product_data: ProductUpdate,
                            current_user: User = Depends(require_farmer),
                            db: Session = Depends(get_db)):
    """Update a product."""
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    product = update_product(db, product_id, profile.id, product_data)
    return ProductResponse.model_validate(product)


@router.delete("/{product_id}")
def delete_existing_product(product_id: int,
                            current_user: User = Depends(require_farmer),
                            db: Session = Depends(get_db)):
    """Delete a product."""
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    delete_product(db, product_id, profile.id)
    return {"message": "Product deleted"}


@router.post("/{product_id}/images", response_model=ProductImageResponse)
async def upload_image(product_id: int, file: UploadFile = File(...),
                       current_user: User = Depends(require_farmer),
                       db: Session = Depends(get_db)):
    """Upload product image."""
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    image = await upload_product_image(db, product_id, profile.id, file)
    return ProductImageResponse.model_validate(image)
