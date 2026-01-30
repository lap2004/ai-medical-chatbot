"""
db/schemas/chat_schema.py
Schema I/O cho API chat, có trường safety để hiển thị khuyến cáo y tế.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=2000)
    # Không nhận user_id từ client (lấy từ JWT/current_user ở backend)
    conversation_id: Optional[int] = None

class RetrievedContext(BaseModel):
    doc_id: str
    chunk_id: str
    text: str
    score: float


class SafetyAdvisory(BaseModel):
    urgency: Literal["emergency", "urgent", "routine"]
    rationale: str


class ChatAnswer(BaseModel):
    answer: str
    reasoning_brief: Optional[str] = None
    references: List[str] = []
    safety: SafetyAdvisory


class ChatResponse(BaseModel):
    question: str
    user_id: Optional[int] = None  # ✅ users.id là INTEGER
    answer: ChatAnswer
    contexts: List[RetrievedContext] = []

    # ✅ (khuyến nghị) phục vụ lưu/hiển thị lịch sử
    message_id: Optional[int] = None
    created_at: Optional[datetime] = None
