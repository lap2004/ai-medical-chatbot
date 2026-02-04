"""
db/schemas/chat_schema.py

Schema I/O cho API chat (message-based) theo tables *_012026.
Có giữ tương thích ngược (ChatRequest/ChatResponse) để không vỡ router cũ.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


# =========================
# Common types
# =========================
MessageRole = Literal["system", "user", "assistant"]
FeedbackAction = Literal["like", "dislike", "report"]


# =========================
# Helpers
# =========================
def _empty_str_to_none(v):
    if v == "" or v is None:
        return None
    return v


# =========================
# RAG / Safety schemas
# =========================
class RetrievedContext(BaseModel):
    medical_id: Optional[UUID] = None
    doc_id: Optional[str] = None
    chunk_id: Optional[str] = None
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


# =========================
# Message schemas (DB aligned)
# =========================
class MessageOut(BaseModel):
    id: UUID
    conversation_id: UUID
    user_id: Optional[int] = None

    role: MessageRole
    content: str

    model: Optional[str] = None
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    total_tokens: Optional[int] = None

    parent_message_id: Optional[UUID] = None
    rag_context: Optional[Dict[str, Any]] = None

    # Feedback info for current user
    feedback: Optional[Dict[str, Any]] = None  # {"value": "like"/"dislike", "created_at": "..."}
    is_reported: bool = False  # True if current user reported this message

    deleted_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MessageListOut(BaseModel):
    items: List[MessageOut] = []


class MessageCreateIn(BaseModel):
    """
    Payload cho POST /chat/conversations/{conversation_id}/messages
    Thông thường client chỉ tạo message role='user' (content).
    """
    content: str = Field(min_length=1)
    parent_message_id: Optional[UUID] = None

    @field_validator("parent_message_id", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        return _empty_str_to_none(v)


class MessagePatchIn(BaseModel):
    """
    Payload cho PATCH /chat/messages/{message_id}
    """
    content: str = Field(min_length=1)


# =========================
# Endpoint feedback/report
# =========================
class MessageFeedbackIn(BaseModel):
    """
    Payload cho POST /chat/messages/{message_id}/feedback

    - action=like/dislike: optional reason
    - action=report: required category, optional details
    """
    action: FeedbackAction
    reason: Optional[str] = None

    category: Optional[str] = None
    details: Optional[str] = None

    @field_validator("reason", "category", "details", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        return _empty_str_to_none(v)

    @field_validator("category")
    @classmethod
    def validate_report_category(cls, v, info):
        # chỉ bắt buộc category khi action=report
        data = info.data or {}
        if data.get("action") == "report" and not v:
            raise ValueError("category is required when action='report'")
        return v


class MessageFeedbackOut(BaseModel):
    ok: bool = True


# =========================
# Message-based "turn" response (new)
# =========================
class ChatTurnResponse(BaseModel):
    """
    Dùng nếu bạn muốn endpoint POST message trả về cả cặp user+assistant,
    nhưng align theo message schema.
    """
    conversation_id: UUID
    user_id: int

    user_message_id: Optional[UUID] = None
    assistant_message_id: Optional[UUID] = None

    user_content: str
    assistant_answer: ChatAnswer

    contexts: List[RetrievedContext] = []
    created_at: Optional[datetime] = None


# =========================
# Backward compatibility (legacy)
# =========================
class ChatRequest(BaseModel):
    """
    Legacy payload (router cũ hay dùng):
    - question: nội dung user
    - conversation_id: optional
    - parent_message_id: optional
    """
    question: str = Field(min_length=1)
    conversation_id: Optional[UUID] = None
    parent_message_id: Optional[UUID] = None

    @field_validator("conversation_id", "parent_message_id", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        return _empty_str_to_none(v)


class ChatResponse(BaseModel):
    """
    Legacy response (router cũ hay dùng).
    """
    conversation_id: UUID
    user_id: int

    user_message_id: Optional[UUID] = None
    assistant_message_id: Optional[UUID] = None

    question: str
    answer: ChatAnswer
    contexts: List[RetrievedContext] = []

    created_at: Optional[datetime] = None
