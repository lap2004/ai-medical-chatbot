from __future__ import annotations
from sqlalchemy import Column, DateTime, ForeignKey, Float, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base

class MessageCitation(Base):
    __tablename__ = "message_citations_012026"
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    message_id = Column(
        UUID(as_uuid=True),
        ForeignKey("messages_012026.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    medical_id = Column(
        UUID(as_uuid=True),
        ForeignKey("medical_012026.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    score = Column(Float, nullable=True)
    snippet = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    message = relationship(
        "ChatMessage",
        back_populates="citations",
        passive_deletes=True,
    )
