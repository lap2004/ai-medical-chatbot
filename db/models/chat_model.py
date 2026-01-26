"""
db/models/chat_model.py
Bảng lưu lịch sử chat người dùng.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, func
from db.database import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(64), index=True, nullable=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=False), server_default=func.now())
