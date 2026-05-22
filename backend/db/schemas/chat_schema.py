from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator

MessageRole = Literal["system", "user", "assistant"]
FeedbackAction = Literal["like", "dislike", "report"]

def _empty_str_to_none(v):
    if v == "" or v is None:
        return None
    return v

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
    feedback: Optional[Dict[str, Any]] = None  
    is_reported: bool = False 
    deleted_at: Optional[datetime] = None
    created_at: datetime
    class Config:
        from_attributes = True

class MessageListOut(BaseModel):
    items: List[MessageOut] = []

class MessageCreateIn(BaseModel):
    content: str = Field(min_length=1)
    parent_message_id: Optional[UUID] = None
    @field_validator("parent_message_id", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        return _empty_str_to_none(v)

class MessagePatchIn(BaseModel):
    content: str = Field(min_length=1)

class MessageFeedbackIn(BaseModel):
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
        data = info.data or {}
        if data.get("action") == "report" and not v:
            raise ValueError("category is required when action='report'")
        return v

class MessageFeedbackOut(BaseModel):
    ok: bool = True

class ChatTurnResponse(BaseModel):
    conversation_id: UUID
    user_id: int
    user_message_id: Optional[UUID] = None
    assistant_message_id: Optional[UUID] = None
    user_content: str
    assistant_answer: ChatAnswer
    contexts: List[RetrievedContext] = []
    created_at: Optional[datetime] = None

class ChatRequest(BaseModel):
    question: str = Field(min_length=1)
    conversation_id: Optional[UUID] = None
    parent_message_id: Optional[UUID] = None

    @field_validator("conversation_id", "parent_message_id", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        return _empty_str_to_none(v)

class ChatResponse(BaseModel):
    conversation_id: UUID
    user_id: int
    user_message_id: Optional[UUID] = None
    assistant_message_id: Optional[UUID] = None
    question: str
    answer: ChatAnswer
    contexts: List[RetrievedContext] = []
    created_at: Optional[datetime] = None
