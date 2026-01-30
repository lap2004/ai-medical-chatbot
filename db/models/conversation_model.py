# # db/models/conversation_model.py
# from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
# from db.database import Base

# class Conversation(Base):
#     __tablename__ = "conversations"

#     id = Column(Integer, primary_key=True)
#     user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
#     title = Column(String(255), nullable=False, default="Cuộc trò chuyện mới")
#     created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
#     updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

# db/models/conversation_model.py
from __future__ import annotations

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from db.database import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False, server_default="Cuộc trò chuyện mới")

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # ✅ reverse relationship
    user = relationship("User", back_populates="conversations")

    # ✅ 1 conversation có nhiều messages
    messages = relationship(
        "ChatMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
    )
