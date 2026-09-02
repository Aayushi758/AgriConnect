"""Product Pydantic schemas."""
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    category_id: Optional[int] = None
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    unit: str = "kg"
    available_quantity: float = Field(..., ge=0)
    min_order_quantity: float = 0.5
    harvest_date: Optional[date] = None
    availability_date: Optional[date] = None
    location: Optional[str] = None
    quality_grade: Optional[str] = None
    is_organic: bool = False


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    price: Optional[float] = None
    unit: Optional[str] = None
    available_quantity: Optional[float] = None
    min_order_quantity: Optional[float] = None
    harvest_date: Optional[date] = None
    availability_date: Optional[date] = None
    location: Optional[str] = None
    quality_grade: Optional[str] = None
    is_organic: Optional[bool] = None
    status: Optional[str] = None


class ProductImageResponse(BaseModel):
    id: int
    image_url: str
    is_primary: bool
    sort_order: int

    class Config:
        from_attributes = True


class ProductResponse(BaseModel):
    id: int
    farmer_id: int
    category_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    price: float
    unit: str
    available_quantity: float
    min_order_quantity: float
    harvest_date: Optional[date] = None
    availability_date: Optional[date] = None
    location: Optional[str] = None
    quality_grade: Optional[str] = None
    is_organic: bool
    status: str
    total_sold: float
    total_revenue: float
    images: List[ProductImageResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    id: int
    farmer_id: int
    name: str
    price: float
    unit: str
    available_quantity: float
    location: Optional[str] = None
    is_organic: bool
    status: str
    category_name: Optional[str] = None
    farmer_name: Optional[str] = None
    farmer_city: Optional[str] = None
    primary_image: Optional[str] = None
    rating: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    icon: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True
