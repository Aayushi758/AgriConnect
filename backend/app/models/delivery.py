"""Delivery, DeliveryRoute, DeliveryLocationUpdate models."""
import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Enum, Text, JSON,
    ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.database import Base


class DeliveryStatus(str, enum.Enum):
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    NEARBY = "nearby"
    DELIVERED = "delivered"
    FAILED = "failed"


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False)
    status = Column(Enum(DeliveryStatus), default=DeliveryStatus.ASSIGNED)
    
    # Pickup (farmer) location
    pickup_address = Column(Text, nullable=True)
    pickup_latitude = Column(Float, nullable=True)
    pickup_longitude = Column(Float, nullable=True)
    
    # Delivery (consumer) location
    delivery_address = Column(Text, nullable=True)
    delivery_latitude = Column(Float, nullable=True)
    delivery_longitude = Column(Float, nullable=True)
    
    # Current simulated position
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    
    # Tracking
    distance_km = Column(Float, nullable=True)
    distance_remaining_km = Column(Float, nullable=True)
    estimated_arrival = Column(DateTime, nullable=True)
    actual_arrival = Column(DateTime, nullable=True)
    
    # Delivery agent (simulated)
    agent_name = Column(String(255), nullable=True)
    agent_phone = Column(String(20), nullable=True)
    
    picked_up_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    order = relationship("Order", back_populates="delivery")
    route = relationship("DeliveryRoute", back_populates="delivery", uselist=False, cascade="all, delete-orphan")
    location_updates = relationship("DeliveryLocationUpdate", back_populates="delivery", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_delivery_status", "status"),
    )


class DeliveryRoute(Base):
    __tablename__ = "delivery_routes"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id", ondelete="CASCADE"), unique=True, nullable=False)
    route_polyline = Column(Text, nullable=True)  # Encoded polyline
    route_coordinates = Column(Text, nullable=True)  # JSON array of [lat, lng]
    total_distance_km = Column(Float, nullable=True)
    total_duration_minutes = Column(Float, nullable=True)
    waypoints = Column(Text, nullable=True)  # JSON array
    optimization_score = Column(Float, nullable=True)
    provider = Column(String(50), default="mock")
    created_at = Column(DateTime, default=datetime.utcnow)

    delivery = relationship("Delivery", back_populates="route")


class DeliveryLocationUpdate(Base):
    __tablename__ = "delivery_location_updates"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id", ondelete="CASCADE"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed_kmh = Column(Float, nullable=True)
    heading = Column(Float, nullable=True)
    is_simulated = Column(Integer, default=1)  # Boolean - clearly marks simulated data
    timestamp = Column(DateTime, default=datetime.utcnow)

    delivery = relationship("Delivery", back_populates="location_updates")

    __table_args__ = (
        Index("ix_location_delivery", "delivery_id"),
        Index("ix_location_timestamp", "timestamp"),
    )
