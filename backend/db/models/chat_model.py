from __future__ import annotations
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.types import Enum as SAEnum
from db.models.citation_model import MessageCitation
from db.database import Base

MessageRole = SAEnum(
    "system",
    "user",
    "assistant",
    name="message_role",
    create_type=False,
)

class ChatMessage(Base):
    __tablename__ = "messages_012026"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())

    conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("conversations_012026.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        Integer,
        ForeignKey("users_012026.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    role = Column(MessageRole, nullable=False)
    content = Column(Text, nullable=False)

    model = Column(Text, nullable=True)
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    total_tokens = Column(Integer, nullable=True)

    parent_message_id = Column(
        UUID(as_uuid=True),
        ForeignKey("messages_012026.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    rag_context = Column(JSONB, nullable=True)

    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship(
        "User",
        back_populates="chat_messages",
        passive_deletes=True,
    )

    conversation = relationship(
        "Conversation",
        back_populates="messages",
        passive_deletes=True,
    )

    parent = relationship(
        "ChatMessage",
        remote_side="ChatMessage.id",
        back_populates="children",
        foreign_keys=[parent_message_id],
        passive_deletes=True,
    )

    children = relationship(
        "ChatMessage",
        back_populates="parent",
        foreign_keys=[parent_message_id],
        passive_deletes=True,
    )
    
    feedbacks = relationship(
        "MessageFeedback",
        back_populates="message",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    reports = relationship(
        "MessageReport",
        back_populates="message",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    citations = relationship(
        "MessageCitation",
        back_populates="message",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
