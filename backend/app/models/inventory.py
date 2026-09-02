"""Inventory and InventoryTransaction models."""
import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, Float, DateTime, Enum, Text,
    ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.database import Base


class TransactionType(str, enum.Enum):
    STOCK_ADDED = "stock_added"
    STOCK_SOLD = "stock_sold"
    STOCK_RETURNED = "stock_returned"
    STOCK_ADJUSTED = "stock_adjusted"
    STOCK_RESERVED = "stock_reserved"
    STOCK_RELEASED = "stock_released"


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), unique=True, nullable=False)
    current_stock = Column(Float, nullable=False, default=0)
    reserved_stock = Column(Float, nullable=False, default=0)  # Reserved for pending orders
    total_added = Column(Float, default=0)
    total_sold = Column(Float, default=0)
    total_returned = Column(Float, default=0)
    low_stock_threshold = Column(Float, default=10)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="inventory")
    transactions = relationship("InventoryTransaction", back_populates="inventory", cascade="all, delete-orphan")

    @property
    def available_stock(self) -> float:
        """Stock available for new orders (current - reserved)."""
        return max(0, self.current_stock - self.reserved_stock)

    @property
    def is_low_stock(self) -> bool:
        return self.current_stock <= self.low_stock_threshold


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    inventory_id = Column(Integer, ForeignKey("inventory.id", ondelete="CASCADE"), nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    quantity = Column(Float, nullable=False)
    previous_stock = Column(Float, nullable=False)
    new_stock = Column(Float, nullable=False)
    reference_id = Column(Integer, nullable=True)  # Order ID, etc.
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    inventory = relationship("Inventory", back_populates="transactions")

    __table_args__ = (
        Index("ix_inv_tx_inventory", "inventory_id"),
        Index("ix_inv_tx_type", "transaction_type"),
        Index("ix_inv_tx_created", "created_at"),
    )
