"""User & Auth Pydantic schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# --- Auth Schemas ---
class UserRegister(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = None
    role: str = Field(..., pattern="^(farmer|consumer)$")


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class TokenData(BaseModel):
    user_id: int
    role: str


# --- User Schemas ---
class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


# --- Farmer Profile Schemas ---
class FarmerProfileCreate(BaseModel):
    farm_name: Optional[str] = None
    farm_description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    farm_size_acres: Optional[float] = None
    experience_years: Optional[int] = None
    organic_certified: bool = False
    production_cost_per_kg: Optional[float] = None


class FarmerProfileResponse(BaseModel):
    id: int
    user_id: int
    farm_name: Optional[str] = None
    farm_description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    farm_size_acres: Optional[float] = None
    experience_years: Optional[int] = None
    organic_certified: bool = False
    rating: float = 0.0
    total_reviews: int = 0
    production_cost_per_kg: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FarmerPublicResponse(BaseModel):
    """Public farmer info visible to consumers."""
    id: int
    farm_name: Optional[str] = None
    farm_description: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    organic_certified: bool = False
    rating: float = 0.0
    total_reviews: int = 0
    farmer_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- Consumer Profile Schemas ---
class ConsumerProfileCreate(BaseModel):
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ConsumerProfileResponse(BaseModel):
    id: int
    user_id: int
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True
