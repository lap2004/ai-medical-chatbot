# db/models/conversation_model.py
from __future__ import annotations

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from db.database import Base


class Conversation(Base):
    __tablename__ = "conversations_012026"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())

    user_id = Column(
        Integer,
        ForeignKey("users_012026.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(Text, nullable=False, server_default="New chat")

    deleted_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    last_message_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # relationships
    user = relationship(
        "User",
        back_populates="conversations",
        passive_deletes=True,
    )

    messages = relationship(
        "ChatMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ChatMessage.created_at.asc()",  # tiện cho GET messages theo thời gian
    )
