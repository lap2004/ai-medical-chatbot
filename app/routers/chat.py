"""
app/routers/chat.py

All-in-one API under /chat (không tách router /conversations)

Routes (new):
- GET    /chat/conversations
- GET    /chat/{conversation_id}                       : debug conversation
- PATCH  /chat/{conversation_id}                       : rename
- DELETE /chat/{conversation_id}                       : soft delete conversation
- GET    /chat/conversations/{conversation_id}/messages
- POST   /chat/conversations/{conversation_id}/messages
- PATCH  /chat/messages/{message_id}
- DELETE /chat/messages/{message_id}
- POST   /chat/messages/{message_id}/feedback          : like/dislike/report
- DELETE /chat/history                                 : soft-delete toàn bộ messages role=user của user

Legacy (optional):
- POST   /chat                                         : auto-create conversation nếu chưa có (tương thích frontend cũ)
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func

from loguru import logger

from app.core.security import get_current_user
from db.database import get_db

from db.models.user_model import User
from db.models.conversation_model import Conversation
from db.models.chat_model import ChatMessage

from db.schemas.conversation_schema import ConversationListItem, RenameConversationRequest
from db.schemas.chat_schema import ChatRequest

from db.schemas.chat_schema import (
    # New message-based schemas
    MessageCreateIn,
    MessagePatchIn,
    MessageListOut,
    MessageOut,
    MessageFeedbackIn,
    MessageFeedbackOut,
    # Legacy compatible (optional)
    ChatRequest,
    ChatTurnResponse,
    ChatAnswer,
    RetrievedContext,
)

from app.services.chat_service import (
    get_list_conversations,
    rename_conversation as svc_rename_conversation,
    soft_delete_conversation as svc_soft_delete_conversation,
    soft_delete_chat_history as svc_soft_delete_chat_history,
    # message APIs
    get_conversation_messages,
    create_message,
    patch_message as svc_patch_message,
    soft_delete_message as svc_soft_delete_message,
    create_feedback_or_report,
)

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/messages/{message_id}/feedback", response_model=MessageFeedbackOut)
async def feedback_or_report(
    message_id: UUID,
    payload: MessageFeedbackIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    out = await create_feedback_or_report(message_id, payload, db, current_user)
    return {"ok": True, **out}

# ──────────────────────────────────────────────────────────────────────────────
# Legacy endpoint: POST /chat  (auto-create conversation + run RAG)
# ──────────────────────────────────────────────────────────────────────────────
@router.post("", response_model=ChatTurnResponse, status_code=status.HTTP_200_OK)
async def chat_legacy(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatTurnResponse:
    """
    Tương thích frontend cũ:
    - nhận question + optional conversation_id + parent_message_id
    - nếu chưa có conversation_id => tạo mới
    - chạy RAG => tạo user + assistant message
    - trả về ChatTurnResponse
    """
    question = (req.question or "").strip()
    if len(question) < 2:
        raise HTTPException(status_code=400, detail="Câu hỏi quá ngắn.")

    # normalize empty string -> None (frontend hay gửi "")
    if getattr(req, "conversation_id", None) == "":
        req.conversation_id = None
    if getattr(req, "parent_message_id", None) == "":
        req.parent_message_id = None

    conversation_id: UUID | None = getattr(req, "conversation_id", None)

    # Auto-create conversation nếu chưa có
    if conversation_id is None:
        conv = Conversation(user_id=int(current_user.id), title="New chat")
        db.add(conv)
        await db.flush()
        conversation_id = conv.id
        await db.commit()
    else:
        # ownership check + active
        conv_ok = await db.scalar(
            select(Conversation.id).where(
                Conversation.id == conversation_id,
                Conversation.user_id == int(current_user.id),
                Conversation.deleted_at.is_(None),
            )
        )
        if not conv_ok:
            raise HTTPException(status_code=404, detail="Conversation không tồn tại.")

    # tạo message + run rag
    payload = MessageCreateIn(content=question, parent_message_id=req.parent_message_id)
    out = await create_message(conversation_id, payload, db, current_user, run_rag=True)

    user_msg = out["user"]
    assistant_msg = out["assistant"]
    pipeline = out.get("pipeline") or {}
    raw_answer = (pipeline.get("answer") or {}) if isinstance(pipeline, dict) else {}
    contexts = pipeline.get("contexts") or []

    # Build ChatAnswer theo schema (fallback an toàn)
    try:
        answer = ChatAnswer(**raw_answer) if isinstance(raw_answer, dict) else ChatAnswer(
            answer=str(raw_answer),
            reasoning_brief=None,
            references=[],
            safety={"urgency": "routine", "rationale": "LLM output not JSON"},
        )
    except Exception:
        answer = ChatAnswer(
            answer=assistant_msg.content,
            reasoning_brief=None,
            references=[],
            safety={"urgency": "routine", "rationale": "LLM output not JSON"},
        )

    retrieved_contexts = []
    try:
        retrieved_contexts = [RetrievedContext(**c) for c in (contexts or [])]
    except Exception:
        retrieved_contexts = []

    return ChatTurnResponse(
        conversation_id=conversation_id,
        user_id=int(current_user.id),
        user_message_id=user_msg.id,
        assistant_message_id=assistant_msg.id,
        user_content=question,
        assistant_answer=answer,
        contexts=retrieved_contexts,
        created_at=assistant_msg.created_at,
    )
