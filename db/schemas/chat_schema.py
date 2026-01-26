"""
db/schemas/chat_schema.py
Schema I/O cho API chat, có trường safety để hiển thị khuyến cáo y tế.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Literal

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=2000)
    user_id: Optional[str] = None

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
    user_id: Optional[str]
    answer: ChatAnswer
    contexts: List[RetrievedContext] = []
