"""Product and Category models."""
import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Enum, Text,
    ForeignKey, Index, Date
)
from sqlalchemy.orm import relationship
from app.database import Base


class ProductStatus(str, enum.Enum):
    ACTIVE = "active"
    OUT_OF_STOCK = "out_of_stock"
    DRAFT = "draft"
    ARCHIVED = "archived"


class ProductUnit(str, enum.Enum):
    KG = "kg"
    GRAM = "gram"
    PIECE = "piece"
    DOZEN = "dozen"
    BUNCH = "bunch"
    QUINTAL = "quintal"


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    icon = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmer_profiles.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    unit = Column(Enum(ProductUnit), default=ProductUnit.KG)
    available_quantity = Column(Float, nullable=False, default=0)
    min_order_quantity = Column(Float, default=0.5)
    harvest_date = Column(Date, nullable=True)
    availability_date = Column(Date, nullable=True)
    location = Column(String(255), nullable=True)
    quality_grade = Column(String(50), nullable=True)  # A, B, C or Premium, Standard
    is_organic = Column(Boolean, default=False)
    status = Column(Enum(ProductStatus), default=ProductStatus.ACTIVE)
    total_sold = Column(Float, default=0)
    total_revenue = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    farmer = relationship("FarmerProfile", back_populates="products")
    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    inventory = relationship("Inventory", back_populates="product", uselist=False, cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")

    __table_args__ = (
        Index("ix_product_farmer", "farmer_id"),
        Index("ix_product_category", "category_id"),
        Index("ix_product_status", "status"),
        Index("ix_product_price", "price"),
    )


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="images")
