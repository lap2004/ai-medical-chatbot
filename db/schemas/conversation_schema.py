# db/schemas/conversation_schema.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ConversationListItem(BaseModel):
    id: int
    title: str
    updated_at: datetime

class CreateMessageRequest(BaseModel):
    question: str

class RenameConversationRequest(BaseModel):
    title: str

class CreateMessageResponse(BaseModel):
    conversation_id: int
    message_id: int
    question: str
    answer: dict  # hoặc ChatAnswer nếu bạn muốn tái dùng schema chat_schema
    created_at: datetime
