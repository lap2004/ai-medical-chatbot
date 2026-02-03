# # """
# # app/routers/chat.py

# # All-in-one API under /chat (không tách router /conversations)
# # """

# # from __future__ import annotations

# # from uuid import UUID

# # from fastapi import APIRouter, Depends, HTTPException, status
# # from sqlalchemy.ext.asyncio import AsyncSession
# # from sqlalchemy import select, update, func

# # from app.core.security import get_current_user
# # from db.database import get_db

# # from db.models.user_model import User
# # from db.models.conversation_model import Conversation
# # from db.models.chat_model import ChatMessage

# # from db.schemas.chat_schema import ChatRequest, ChatResponse
# # from db.schemas.conversation_schema import (
# #     ConversationListItem,
# #     RenameConversationRequest,
# # )
# # from loguru import logger

# # from app.services.chat_service import (
# #     handle_chat_request,
# #     get_list_conversations,
# #     rename_conversation as svc_rename_conversation,
# #     soft_delete_conversation as svc_soft_delete_conversation,
# #     delete_chat_message,
# #     delete_chat_history,
# # )

# # router = APIRouter(prefix="/chat", tags=["chat"])


# # # ──────────────────────────────────────────────────────────────────────────────
# # # Conversations (nhưng vẫn nằm trong /chat)
# # # ──────────────────────────────────────────────────────────────────────────────

# # @router.get("/conversations", response_model=list[ConversationListItem])
# # async def list_conversations(
# #     db: AsyncSession = Depends(get_db),
# #     current_user: User = Depends(get_current_user),
# # ):
# #     # ✅ gọi service (service đã trả đủ last_message_at)
# #     return await get_list_conversations(db, current_user)

# # @router.get("/{conversation_id}")
# # async def get_conversation(
# #     conversation_id: UUID,
# #     db: AsyncSession = Depends(get_db),
# #     current_user: User = Depends(get_current_user),
# # ):
# #     # 1) check tồn tại theo id (bỏ user/deleted để debug)
# #     conv_any = await db.scalar(select(Conversation).where(Conversation.id == conversation_id))
# #     if not conv_any:
# #         logger.warning(f"Conversation id not found: {conversation_id}")
# #         raise HTTPException(status_code=404, detail="Conversation id không tồn tại trong DB.")

# #     # 2) check ownership
# #     if conv_any.user_id != int(current_user.id):
# #         logger.warning(f"Conversation not owned: conv_user={conv_any.user_id}, me={current_user.id}")
# #         raise HTTPException(status_code=403, detail="Conversation không thuộc user hiện tại.")

# #     # 3) check soft delete
# #     if conv_any.deleted_at is not None:
# #         logger.warning(f"Conversation soft-deleted: {conversation_id} deleted_at={conv_any.deleted_at}")
# #         raise HTTPException(status_code=410, detail="Conversation đã bị xóa (soft delete).")

# #     # ok
# #     return {
# #         "id": conv_any.id,
# #         "title": conv_any.title,
# #         "created_at": conv_any.created_at,
# #         "updated_at": conv_any.updated_at,
# #         "last_message_at": conv_any.last_message_at,
# #     }

# # @router.patch("/{conversation_id}")
# # async def rename_conversation(
# #     conversation_id: UUID,
# #     req: RenameConversationRequest,
# #     db: AsyncSession = Depends(get_db),
# #     current_user: User = Depends(get_current_user),
# # ):
# #     # ✅ dùng service (đỡ lệch schema)
# #     return await svc_rename_conversation(conversation_id, req.title, db, current_user)


# # @router.delete("/{conversation_id}")
# # async def soft_delete_conversation(
# #     conversation_id: UUID,
# #     db: AsyncSession = Depends(get_db),
# #     current_user: User = Depends(get_current_user),
# # ):
# #     return await svc_soft_delete_conversation(conversation_id, db, current_user)


# # @router.get("/{conversation_id}/messages")
# # async def list_messages(
# #     conversation_id: UUID,
# #     db: AsyncSession = Depends(get_db),
# #     current_user: User = Depends(get_current_user),
# # ):
# #     # check conversation
# #     conv = await db.scalar(
# #         select(Conversation.id).where(
# #             Conversation.id == conversation_id,
# #             Conversation.user_id == int(current_user.id),
# #             Conversation.deleted_at.is_(None),
# #         )
# #     )
# #     if not conv:
# #         raise HTTPException(status_code=404, detail="Conversation không tồn tại.")

# #     result = await db.execute(
# #         select(ChatMessage)
# #         .where(
# #             ChatMessage.conversation_id == conversation_id,
# #             ChatMessage.deleted_at.is_(None),
# #         )
# #         .order_by(ChatMessage.created_at.asc())
# #     )
# #     msgs = result.scalars().all()
# #     return [
# #         {
# #             "id": m.id,
# #             "role": m.role,
# #             "content": m.content,
# #             "model": m.model,
# #             "prompt_tokens": m.prompt_tokens,
# #             "completion_tokens": m.completion_tokens,
# #             "total_tokens": m.total_tokens,
# #             "parent_message_id": m.parent_message_id,
# #             "created_at": m.created_at,
# #         }
# #         for m in msgs
# #     ]


# # # ──────────────────────────────────────────────────────────────────────────────
# # # Chat (send message)
# # # ──────────────────────────────────────────────────────────────────────────────

# # @router.post("", response_model=ChatResponse, status_code=status.HTTP_200_OK)
# # async def chat(
# #     req: ChatRequest,
# #     db: AsyncSession = Depends(get_db),
# #     current_user: User = Depends(get_current_user),
# # ) -> ChatResponse:
# #     question = (req.question or "").strip()
# #     if len(question) < 2:
# #         raise HTTPException(status_code=400, detail="Câu hỏi quá ngắn.")

# #     # conversation_id optional
# #     conversation_id = getattr(req, "conversation_id", None)

# #     # Nếu client gửi parent_message_id: chỉ chấp nhận khi nó tồn tại trong cùng conversation & chưa bị xóa
# #     parent_message_id = getattr(req, "parent_message_id", None)
# #     if parent_message_id is not None and conversation_id is not None:
# #         parent_exists = await db.scalar(
# #             select(ChatMessage.id).where(
# #                 ChatMessage.id == parent_message_id,
# #                 ChatMessage.conversation_id == conversation_id,
# #                 ChatMessage.deleted_at.is_(None),
# #             )
# #         )
# #         if not parent_exists:
# #             req.parent_message_id = None

# #     # Auto-create conversation nếu chưa có
# #     if conversation_id is None:
# #         conv = Conversation(
# #             user_id=int(current_user.id),
# #             title="New chat",
# #         )
# #         db.add(conv)
# #         await db.flush()
# #         conversation_id = conv.id
# #         await db.commit()
# #     else:
# #         conv = await db.scalar(
# #             select(Conversation.id).where(
# #                 Conversation.id == conversation_id,
# #                 Conversation.user_id == int(current_user.id),
# #                 Conversation.deleted_at.is_(None),
# #             )
# #         )
# #         if not conv:
# #             raise HTTPException(status_code=404, detail="Conversation không tồn tại.")

# #     return await handle_chat_request(req, db, current_user, conversation_id)


# """
# app/routers/chat.py

# All-in-one API under /chat (không tách router /conversations)

# Routes:
# - POST   /chat                         : gửi 1 message (auto-create conversation nếu chưa có)
# - GET    /chat/conversations           : list conversations (active)
# - GET    /chat/{conversation_id}       : get conversation info (debug rõ nguyên nhân)
# - PATCH  /chat/{conversation_id}       : rename conversation
# - DELETE /chat/{conversation_id}       : soft-delete conversation (set deleted_at)
# - GET    /chat/{conversation_id}/messages : list messages in conversation (active)
# - DELETE /chat/messages/{message_id}   : soft-delete 1 message
# - DELETE /chat/history                 : soft-delete toàn bộ messages của user (tất cả conversations)
# """

# from __future__ import annotations

# from uuid import UUID

# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy import select

# from loguru import logger

# from app.core.security import get_current_user
# from db.database import get_db

# from db.models.user_model import User
# from db.models.conversation_model import Conversation
# from db.models.chat_model import ChatMessage

# from db.schemas.chat_schema import ChatRequest, ChatResponse
# from db.schemas.conversation_schema import ConversationListItem, RenameConversationRequest

# from app.services.chat_service import (
#     handle_chat_request,
#     get_list_conversations,
#     rename_conversation as svc_rename_conversation,
#     soft_delete_conversation as svc_soft_delete_conversation,
#     soft_delete_message as svc_soft_delete_message,
#     soft_delete_chat_history as svc_soft_delete_chat_history,
# )

# router = APIRouter(prefix="/chat", tags=["chat"])


# # ──────────────────────────────────────────────────────────────────────────────
# # Conversations (nhưng vẫn nằm trong /chat)
# # ──────────────────────────────────────────────────────────────────────────────
# @router.delete("/messages/{message_id}")
# async def delete_one_message(
#     message_id: UUID,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     # service chỉ cho xóa message user của chính mình
#     return await svc_soft_delete_message(message_id, db, current_user)


# @router.delete("/history")
# async def delete_all_history(
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     return await svc_soft_delete_chat_history(db, current_user)

# @router.get("/conversations", response_model=list[ConversationListItem])
# async def list_conversations(
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     # service đã trả đủ: id, title, updated_at, last_message_at
#     return await get_list_conversations(db, current_user)


# @router.get("/{conversation_id}")
# async def get_conversation(
#     conversation_id: UUID,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     # Debug-friendly: phân loại rõ nguyên nhân
#     conv_any = await db.scalar(select(Conversation).where(Conversation.id == conversation_id))
#     if not conv_any:
#         logger.warning(f"Conversation id not found: {conversation_id}")
#         raise HTTPException(status_code=404, detail="Conversation id không tồn tại trong DB.")

#     if conv_any.user_id != int(current_user.id):
#         logger.warning(f"Conversation not owned: conv_user={conv_any.user_id}, me={current_user.id}")
#         raise HTTPException(status_code=403, detail="Conversation không thuộc user hiện tại.")

#     if conv_any.deleted_at is not None:
#         logger.warning(f"Conversation soft-deleted: {conversation_id} deleted_at={conv_any.deleted_at}")
#         raise HTTPException(status_code=410, detail="Conversation đã bị xóa (soft delete).")

#     return {
#         "id": conv_any.id,
#         "title": conv_any.title,
#         "created_at": conv_any.created_at,
#         "updated_at": conv_any.updated_at,
#         "last_message_at": conv_any.last_message_at,
#     }


# @router.patch("/{conversation_id}")
# async def rename_conversation(
#     conversation_id: UUID,
#     req: RenameConversationRequest,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     return await svc_rename_conversation(conversation_id, req.title, db, current_user)


# @router.delete("/{conversation_id}")
# async def soft_delete_conversation(
#     conversation_id: UUID,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     return await svc_soft_delete_conversation(conversation_id, db, current_user)


# @router.get("/{conversation_id}/messages")
# async def list_messages(
#     conversation_id: UUID,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     # check conversation ownership + not deleted
#     conv_ok = await db.scalar(
#         select(Conversation.id).where(
#             Conversation.id == conversation_id,
#             Conversation.user_id == int(current_user.id),
#             Conversation.deleted_at.is_(None),
#         )
#     )
#     if not conv_ok:
#         raise HTTPException(status_code=404, detail="Conversation không tồn tại.")

#     result = await db.execute(
#         select(ChatMessage).where(
#             ChatMessage.conversation_id == conversation_id,
#             ChatMessage.deleted_at.is_(None),
#         ).order_by(ChatMessage.created_at.asc())
#     )
#     msgs = result.scalars().all()
#     return [
#         {
#             "id": m.id,
#             "role": m.role,
#             "content": m.content,
#             "model": m.model,
#             "prompt_tokens": m.prompt_tokens,
#             "completion_tokens": m.completion_tokens,
#             "total_tokens": m.total_tokens,
#             "parent_message_id": m.parent_message_id,
#             "created_at": m.created_at,
#         }
#         for m in msgs
#     ]


# # ──────────────────────────────────────────────────────────────────────────────
# # Chat (send message)
# # ──────────────────────────────────────────────────────────────────────────────

# @router.post("", response_model=ChatResponse, status_code=status.HTTP_200_OK)
# async def chat(
#     req: ChatRequest,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ) -> ChatResponse:
#     question = (req.question or "").strip()
#     if len(question) < 2:
#         raise HTTPException(status_code=400, detail="Câu hỏi quá ngắn.")

#     # Normalize chuỗi rỗng (frontend hay gửi "")
#     if getattr(req, "conversation_id", None) == "":
#         req.conversation_id = None
#     if getattr(req, "parent_message_id", None) == "":
#         req.parent_message_id = None

#     conversation_id = getattr(req, "conversation_id", None)

#     # Validate parent_message_id (nếu có) trong cùng conversation
#     if req.parent_message_id is not None and conversation_id is not None:
#         parent_exists = await db.scalar(
#             select(ChatMessage.id).where(
#                 ChatMessage.id == req.parent_message_id,
#                 ChatMessage.conversation_id == conversation_id,
#                 ChatMessage.deleted_at.is_(None),
#             )
#         )
#         if not parent_exists:
#             # tránh vỡ FK / parent không tồn tại
#             req.parent_message_id = None

#     # Auto-create conversation nếu chưa có
#     if conversation_id is None:
#         conv = Conversation(
#             user_id=int(current_user.id),
#             title="New chat",
#         )
#         db.add(conv)
#         await db.flush()
#         conversation_id = conv.id
#         await db.commit()
#     else:
#         # ownership check + active
#         conv_ok = await db.scalar(
#             select(Conversation.id).where(
#                 Conversation.id == conversation_id,
#                 Conversation.user_id == int(current_user.id),
#                 Conversation.deleted_at.is_(None),
#             )
#         )
#         if not conv_ok:
#             raise HTTPException(status_code=404, detail="Conversation không tồn tại.")

#     return await handle_chat_request(req, db, current_user, conversation_id)

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



# ──────────────────────────────────────────────────────────────────────────────
# DEPRECATED: Use /conversations endpoints instead (they have feedback support)
# ──────────────────────────────────────────────────────────────────────────────
# @router.get("/conversations", response_model=list[ConversationListItem])
# async def list_conversations(
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     return await get_list_conversations(db, current_user)


# @router.get("/{conversation_id}")
# async def get_conversation(
#     conversation_id: UUID,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     # Debug-friendly: phân loại rõ nguyên nhân
#     conv_any = await db.scalar(select(Conversation).where(Conversation.id == conversation_id))
#     if not conv_any:
#         logger.warning(f"Conversation id not found: {conversation_id}")
#         raise HTTPException(status_code=404, detail="Conversation id không tồn tại trong DB.")

#     if conv_any.user_id != int(current_user.id):
#         logger.warning(f"Conversation not owned: conv_user={conv_any.user_id}, me={current_user.id}")
#         raise HTTPException(status_code=403, detail="Conversation không thuộc user hiện tại.")

#     if conv_any.deleted_at is not None:
#         logger.warning(f"Conversation soft-deleted: {conversation_id} deleted_at={conv_any.deleted_at}")
#         raise HTTPException(status_code=410, detail="Conversation đã bị xóa (soft delete).")

#     return {
#         "id": conv_any.id,
#         "title": conv_any.title,
#         "created_at": conv_any.created_at,
#         "updated_at": conv_any.updated_at,
#         "last_message_at": conv_any.last_message_at,
#     }


# @router.patch("/{conversation_id}")
# async def rename_conversation(
#     conversation_id: UUID,
#     req: RenameConversationRequest,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     return await svc_rename_conversation(conversation_id, req.title, db, current_user)


# @router.delete("/{conversation_id}")
# async def soft_delete_conversation(
#     conversation_id: UUID,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     return await svc_soft_delete_conversation(conversation_id, db, current_user)


# @router.delete("/history")
# async def delete_all_history(
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     return await svc_soft_delete_chat_history(db, current_user)


# @router.get("/conversations/{conversation_id}/messages", response_model=MessageListOut)
# async def list_messages(
#     conversation_id: UUID,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     return await get_conversation_messages(conversation_id, db, current_user)


# @router.post(
#     "/conversations/{conversation_id}/messages",
#     response_model=MessageOut,
#     status_code=status.HTTP_201_CREATED,
# )
# async def create_conversation_message(
#     conversation_id: UUID,
#     payload: MessageCreateIn,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     """
#     Mặc định: chỉ tạo user message (không chạy RAG) để giống RESTful endpoint.
#     Nếu bạn muốn endpoint này tự tạo luôn assistant message, đổi run_rag=True
#     và đổi response_model sang ChatTurnResponse hoặc custom.
#     """
#     msg = await create_message(conversation_id, payload, db, current_user, run_rag=False)
#     # run_rag=False => trả ChatMessage instance
#     return msg


# @router.patch("/messages/{message_id}", response_model=MessageOut)
# async def patch_one_message(
#     message_id: UUID,
#     payload: MessagePatchIn,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     return await svc_patch_message(message_id, payload, db, current_user)


# @router.delete("/messages/{message_id}")
# async def delete_one_message(
#     message_id: UUID,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     return await svc_soft_delete_message(message_id, db, current_user)


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
