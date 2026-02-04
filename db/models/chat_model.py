# db/models/chat_model.py
from __future__ import annotations

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.types import Enum as SAEnum
from db.models.citation_model import MessageCitation
from db.database import Base


# Enum đã được tạo trong DB (message_role),
# nên create_type=False để SQLAlchemy không tạo lại.
MessageRole = SAEnum(
    "system",
    "user",
    "assistant",
    name="message_role",
    create_type=False,
)


class ChatMessage(Base):
    """
    Table: messages_012026

    Một lượt chat thường có:
    - role='user' (câu hỏi)
    - role='assistant' (câu trả lời) với parent_message_id trỏ về message user
    """

    __tablename__ = "messages_012026"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())

    conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("conversations_012026.id", ondelete="CASCADE"),
        nullable=False,
        # DDL đã có index riêng; giữ index=True cũng không sao, nhưng có thể bỏ nếu muốn.
        index=True,
    )

    # user_id có thể NULL (ON DELETE SET NULL)
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

    # =========================
    # Relationships
    # =========================

    # owner user (nullable)
    user = relationship(
        "User",
        back_populates="chat_messages",
        passive_deletes=True,
    )

    # conversation
    conversation = relationship(
        "Conversation",
        back_populates="messages",
        passive_deletes=True,
    )

    # -------------------------
    # Self-referential: parent/children
    # -------------------------
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

    # -------------------------
    # Feedback / Reports / Citations
    # NOTE: các class này PHẢI tồn tại và được import/load khi startup:
    # - MessageFeedback  (__tablename__="message_feedback_012026")
    # - MessageReport    (__tablename__="message_reports_012026")
    # - MessageCitation  (__tablename__="message_citations_012026")
    # -------------------------
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
