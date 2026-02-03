# # db/schemas/conversation_schema.py
# from pydantic import BaseModel
# from datetime import datetime
# from typing import Optional

# class ConversationListItem(BaseModel):
#     id: int
#     title: str
#     updated_at: datetime

# class CreateMessageRequest(BaseModel):
#     question: str

# class RenameConversationRequest(BaseModel):
#     title: str

# class CreateMessageResponse(BaseModel):
#     conversation_id: int
#     message_id: int
#     question: str
#     answer: dict  # hoặc ChatAnswer nếu bạn muốn tái dùng schema chat_schema
#     created_at: datetime


# db/schemas/conversation_schema.py
from __future__ import annotations

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from uuid import UUID


class ConversationListItem(BaseModel):
    id: UUID
    title: str
    updated_at: datetime
    last_message_at: datetime


class CreateConversationResponse(BaseModel):
    id: UUID
    title: str
    created_at: datetime


class CreateMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)
    parent_message_id: Optional[UUID] = None


class MessageItem(BaseModel):
    id: UUID
    role: str
    content: str
    parent_message_id: Optional[UUID] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CreateMessageResponse(BaseModel):
    conversation_id: UUID
    user_message_id: UUID
    assistant_message_id: UUID
    created_at: datetime


class RenameConversationRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
