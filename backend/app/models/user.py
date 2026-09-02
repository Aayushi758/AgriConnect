"""User, FarmerProfile, ConsumerProfile models."""
import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Enum, Text,
    ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.database import Base


class UserRole(str, enum.Enum):
    FARMER = "farmer"
    CONSUMER = "consumer"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    farmer_profile = relationship("FarmerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    consumer_profile = relationship("ConsumerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    farm_name = Column(String(255), nullable=True)
    farm_description = Column(Text, nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    farm_size_acres = Column(Float, nullable=True)
    experience_years = Column(Integer, nullable=True)
    organic_certified = Column(Boolean, default=False)
    rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    production_cost_per_kg = Column(Float, nullable=True)  # Optional cost tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="farmer_profile")
    products = relationship("Product", back_populates="farmer", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_farmer_location", "latitude", "longitude"),
        Index("ix_farmer_city_state", "city", "state"),
    )


class ConsumerProfile(Base):
    __tablename__ = "consumer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    preferred_categories = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="consumer_profile")
    orders = relationship("Order", back_populates="consumer", cascade="all, delete-orphan")
