

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


# # db/models/chat_model.py
# from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, func
# from sqlalchemy.orm import relationship
# from db.database import Base


# class ChatMessage(Base):
#     __tablename__ = "chat_messages"

#     id = Column(Integer, primary_key=True, index=True)

#     user_id = Column(
#         Integer,
#         ForeignKey("users.id", ondelete="CASCADE"),
#         index=True,
#         nullable=False,
#     )

#     # NEW: link message -> conversation/thread
#     conversation_id = Column(
#         Integer,
#         ForeignKey("conversations.id", ondelete="CASCADE"),
#         index=True,
#         nullable=False,
#     )

#     question = Column(Text, nullable=False)
#     answer = Column(Text, nullable=False)

#     created_at = Column(DateTime(timezone=False), server_default=func.now())

#     # Nếu DB bạn có cột updated_at thì mở dòng dưới, không thì giữ comment
#     # updated_at = Column(DateTime(timezone=False), server_default=func.now(), onupdate=func.now())

#     # Relationships
#     user = relationship("User", back_populates="chat_messages")
#     conversation = relationship("Conversation", back_populates="messages")
