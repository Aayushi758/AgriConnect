"""Market data models - PriceHistory, DemandHistory, CropRecommendation."""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text, Date, Boolean,
    ForeignKey, Index
)
from app.database import Base


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    crop_name = Column(String(100), nullable=False, index=True)
    location = Column(String(255), nullable=True)
    market_price = Column(Float, nullable=False)
    wholesale_price = Column(Float, nullable=True)
    retail_price = Column(Float, nullable=True)
    unit = Column(String(20), default="kg")
    source = Column(String(50), default="synthetic")  # synthetic, api, manual
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_price_crop_date", "crop_name", "date"),
        Index("ix_price_location", "location"),
    )


class DemandHistory(Base):
    __tablename__ = "demand_history"

    id = Column(Integer, primary_key=True, index=True)
    crop_name = Column(String(100), nullable=False, index=True)
    location = Column(String(255), nullable=True)
    demand_quantity = Column(Float, nullable=False)
    supply_quantity = Column(Float, nullable=True)
    season = Column(String(50), nullable=True)
    festival_flag = Column(Boolean, default=False)
    date = Column(Date, nullable=False)
    source = Column(String(50), default="synthetic")
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_demand_crop_date", "crop_name", "date"),
    )


class CropRecommendation(Base):
    __tablename__ = "crop_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmer_profiles.id"), nullable=True)
    recommended_crop = Column(String(100), nullable=False)
    reason = Column(Text, nullable=True)
    expected_demand = Column(Float, nullable=True)
    expected_price_trend = Column(String(50), nullable=True)  # rising, stable, falling
    confidence_score = Column(Float, nullable=True)
    assumptions = Column(Text, nullable=True)
    season = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_recommendation_farmer", "farmer_id"),
    )
