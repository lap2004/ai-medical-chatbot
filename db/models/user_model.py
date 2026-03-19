from __future__ import annotations
from sqlalchemy import Boolean, Column, DateTime, Integer, String, func
from sqlalchemy.orm import relationship
from db.database import Base

class User(Base):
    __tablename__ = "users_012026"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_admin = Column(Boolean, nullable=False, server_default="false")
    is_active = Column(Boolean, nullable=False, server_default="true")
    force_password_change = Column(Boolean, nullable=False, server_default="false")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    avatar_url = Column(String, nullable=True)

    conversations = relationship(
        "Conversation",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    chat_messages = relationship(
        "ChatMessage",
        back_populates="user",
        passive_deletes=True,
    )

    message_feedbacks = relationship(
        "MessageFeedback",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    message_reports = relationship(
        "MessageReport",
        back_populates="reporter",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
