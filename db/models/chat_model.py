# """
# db/models/chat_model.py
# Bảng lưu lịch sử chat người dùng.
# """

# from sqlalchemy import Column, Integer, String, Text, DateTime, func
# from db.database import Base

# class ChatMessage(Base):
#     __tablename__ = "chat_messages"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(String(64), index=True, nullable=True)
#     question = Column(Text, nullable=False)
#     answer = Column(Text, nullable=False)
#     created_at = Column(DateTime(timezone=False), server_default=func.now())

# db/models/chat_model.py

from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from db.database import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=False), server_default=func.now())

    user = relationship("User", back_populates="chat_messages")
