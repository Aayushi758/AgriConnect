"""Support request models."""
import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Enum, Text,
    ForeignKey, Index
)
from app.database import Base


class SupportCategory(str, enum.Enum):
    ORDER_ISSUE = "order_issue"
    DELIVERY_ISSUE = "delivery_issue"
    PRODUCT_QUALITY = "product_quality"
    PAYMENT_ISSUE = "payment_issue"
    ACCOUNT_ISSUE = "account_issue"
    TECHNICAL_ISSUE = "technical_issue"
    OTHER = "other"


class SupportStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class SupportRequest(Base):
    __tablename__ = "support_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    category = Column(Enum(SupportCategory), nullable=False)
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(SupportStatus), default=SupportStatus.OPEN)
    resolution = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_support_user", "user_id"),
        Index("ix_support_status", "status"),
    )
