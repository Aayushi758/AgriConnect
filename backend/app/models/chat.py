"""Chat models - Farmer/Consumer messaging."""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text,
    ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.database import Base


class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmer_profiles.id", ondelete="CASCADE"), nullable=False)
    consumer_id = Column(Integer, ForeignKey("consumer_profiles.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    subject = Column(String(255), nullable=True)
    is_bulk_inquiry = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    last_message_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_chat_farmer", "farmer_id"),
        Index("ix_chat_consumer", "consumer_id"),
        Index("ix_chat_last_msg", "last_message_at"),
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("chat_conversations.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    message_type = Column(String(20), default="text")  # text, image, system
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("ChatConversation", back_populates="messages")

    __table_args__ = (
        Index("ix_msg_conversation", "conversation_id"),
        Index("ix_msg_sender", "sender_id"),
        Index("ix_msg_created", "created_at"),
    )
