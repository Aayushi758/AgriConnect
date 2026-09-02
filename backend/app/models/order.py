"""Order, OrderItem, Payment models."""
import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Enum, Text,
    ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.database import Base


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY_FOR_PICKUP = "ready_for_pickup"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURN_REQUESTED = "return_requested"
    RETURNED = "returned"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethod(str, enum.Enum):
    COD = "cod"
    UPI = "upi"
    CARD = "card"
    NET_BANKING = "net_banking"
    WALLET = "wallet"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    consumer_id = Column(Integer, ForeignKey("consumer_profiles.id"), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    subtotal = Column(Float, nullable=False, default=0)
    delivery_fee = Column(Float, default=0)
    tax = Column(Float, default=0)
    discount = Column(Float, default=0)
    total = Column(Float, nullable=False, default=0)
    delivery_address = Column(Text, nullable=True)
    delivery_latitude = Column(Float, nullable=True)
    delivery_longitude = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    estimated_delivery_time = Column(DateTime, nullable=True)
    actual_delivery_time = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    consumer = relationship("ConsumerProfile", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False, cascade="all, delete-orphan")
    delivery = relationship("Delivery", back_populates="order", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_order_consumer", "consumer_id"),
        Index("ix_order_status", "status"),
        Index("ix_order_created", "created_at"),
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("farmer_profiles.id"), nullable=False)
    product_name = Column(String(255), nullable=False)  # Snapshot at order time
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)  # Price at order time
    total_price = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

    __table_args__ = (
        Index("ix_orderitem_order", "order_id"),
        Index("ix_orderitem_farmer", "farmer_id"),
    )


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.COD)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    amount = Column(Float, nullable=False)
    transaction_id = Column(String(255), nullable=True)
    gateway_response = Column(Text, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    order = relationship("Order", back_populates="payment")
