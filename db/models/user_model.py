# db/models/user_model.py
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

    # 1 user có nhiều conversations (FK: conversations_012026.user_id ON DELETE CASCADE)
    conversations = relationship(
        "Conversation",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # 1 user có nhiều messages (FK: messages_012026.user_id ON DELETE SET NULL)
    # -> KHÔNG dùng delete-orphan để tránh SQLAlchemy xoá messages ngoài ý muốn
    chat_messages = relationship(
        "ChatMessage",
        back_populates="user",
        passive_deletes=True,
    )

    # 1 user có nhiều feedback (FK: message_feedback_012026.user_id ON DELETE CASCADE)
    message_feedbacks = relationship(
        "MessageFeedback",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # 1 user có nhiều reports (FK: message_reports_012026.reporter_user_id ON DELETE CASCADE)
    message_reports = relationship(
        "MessageReport",
        back_populates="reporter",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
