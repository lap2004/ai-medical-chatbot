

# from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, func
# from sqlalchemy.orm import relationship
# from db.database import Base

# class ChatMessage(Base):
#     __tablename__ = "chat_messages"

#     id = Column(Integer, primary_key=True, index=True)

#     user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

#     question = Column(Text, nullable=False)
#     answer = Column(Text, nullable=False)

#     created_at = Column(DateTime(timezone=False), server_default=func.now())

#     user = relationship("User", back_populates="chat_messages")

# db/models/chat_model.py
from __future__ import annotations

from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from db.database import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)

    conversation_id = Column(
        Integer,
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # ✅ cái này chính là thứ bạn đang thiếu -> gây crash startup
    user = relationship("User", back_populates="chat_messages")

    conversation = relationship("Conversation", back_populates="messages")
