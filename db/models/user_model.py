# # db/models/user_model.py
# from __future__ import annotations

# from sqlalchemy import Boolean, Column, DateTime, Integer, String, func
# from db.database import Base
# from sqlalchemy.orm import relationship

# class User(Base):
#     __tablename__ = "users"

#     id = Column(Integer, primary_key=True, index=True)  # IDENTITY PK

#     email = Column(String(255), unique=True, index=True, nullable=False)

#     # NOTE: DB của bạn đang dùng cột tên "password"
#     # Thực tế nên lưu bcrypt hash vào đây (không lưu plain text).
#     password = Column(String(255), nullable=False)
#     chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")

#     full_name = Column(String(255), nullable=True)

#     is_admin = Column(Boolean, nullable=False, server_default="false")
#     is_active = Column(Boolean, nullable=False, server_default="true")
#     force_password_change = Column(Boolean, nullable=False, server_default="false")

#     # TIMESTAMPTZ NOT NULL DEFAULT NOW()
#     created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


# db/models/user_model.py
from __future__ import annotations

from sqlalchemy import Boolean, Column, DateTime, Integer, String, func
from sqlalchemy.orm import relationship
from db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)

    full_name = Column(String(255), nullable=True)

    is_admin = Column(Boolean, nullable=False, server_default="false")
    is_active = Column(Boolean, nullable=False, server_default="true")
    force_password_change = Column(Boolean, nullable=False, server_default="false")

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # ✅ 1 user có nhiều conversations
    conversations = relationship(
        "Conversation",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # ✅ 1 user có nhiều chat messages
    chat_messages = relationship(
        "ChatMessage",
        back_populates="user",
        cascade="all, delete-orphan",
    )
