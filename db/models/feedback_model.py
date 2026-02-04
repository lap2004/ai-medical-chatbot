from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ENUM as PGEnum

from db.database import Base

from .enums import FeedbackValue, ReportStatus  # theo code của bạn

# Enum type đã tạo sẵn trong DB => create_type=False để khỏi tạo lại
feedback_value_enum = PGEnum(FeedbackValue, name="feedback_value", create_type=False)
report_status_enum = PGEnum(ReportStatus, name="report_status", create_type=False)

class MessageFeedback(Base):
    __tablename__ = "message_feedback_012026"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages_012026.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(ForeignKey("users_012026.id", ondelete="CASCADE"), nullable=False)

    value = Column(feedback_value_enum, nullable=False)
    reason = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    message = relationship("ChatMessage", back_populates="feedbacks")
    user = relationship("User", back_populates="message_feedbacks")


class MessageReport(Base):
    __tablename__ = "message_reports_012026"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages_012026.id", ondelete="CASCADE"), nullable=False)
    reporter_user_id = Column(ForeignKey("users_012026.id", ondelete="CASCADE"), nullable=False)

    category = Column(String, nullable=False)
    details = Column(Text)
    status = Column(report_status_enum, nullable=False, server_default="open")

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    message = relationship("ChatMessage", back_populates="reports")
    reporter = relationship("User", back_populates="message_reports")
