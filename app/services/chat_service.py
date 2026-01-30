# """
# app/services/chat_service.py
# Orchestrator:
# - kiểm tra/lọc đầu vào (word filter),
# - chạy pipeline RAG + Gemini,
# - lưu lịch sử chat,
# - trả response theo schema Pydantic.
# """

# import json
# from typing import Tuple

# from fastapi import HTTPException
# from sqlalchemy.orm import Session
# from loguru import logger

# from app.config import settings
# from db.schemas.chat_schema import ChatRequest, ChatResponse, ChatAnswer, RetrievedContext
# from db.models.chat_model import ChatMessage
# from app.rag.chat_pipeline import run as run_pipeline
# from app.rag.word_filter import has_banned_terms

# from fastapi import HTTPException
# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy import delete, select

# from db.models.chat_model import ChatMessage

# async def handle_chat_request(req: ChatRequest, db: Session, current_user) -> ChatResponse:
#     """
#     Thực thi toàn bộ luồng cho một yêu cầu chat.
#     """
#     question = req.question.strip()
#     current_user_id = current_user.id
#     # 1) Word filter (guardrails cơ bản)
#     bad, terms = _check_word_filter(question)
#     if bad:
#         raise HTTPException(status_code=400, detail=f"Câu hỏi chứa từ bị cấm: {', '.join(terms)}")

#     # 2) Chạy pipeline RAG + Gemini
#     # out = run_pipeline(question, db)
#     out = await run_pipeline(question, db)
#     # out: {"answer": {...}, "contexts": [...]}

#     # 3) Chuẩn hóa dữ liệu trả về theo schema
#     contexts = [RetrievedContext(**c) for c in (out.get("contexts") or [])]

#     # Đảm bảo có trường tối thiểu trong answer
#     raw_answer = out.get("answer") or {}
#     try:
#         answer = ChatAnswer(**raw_answer)
#     except Exception:
#         # fallback nếu LLM trả ngoài format
#         logger.warning("Answer không khớp schema, dùng fallback.")
#         fallback = {
#             "answer": str(raw_answer),
#             "reasoning_brief": None,
#             "references": [],
#             "safety": {"urgency": "routine", "rationale": "LLM không trả JSON hợp lệ"},
#         }
#         answer = ChatAnswer(**fallback)

#     # 4) Lưu lịch sử (không fail app nếu ghi DB lỗi)
#     try:
#         msg = ChatMessage(
#             user_id=current_user_id,
#             question=question,
#             answer=json.dumps(raw_answer, ensure_ascii=False),
#         )
#         db.add(msg)
#         await db.commit()
#     except Exception:
#         await db.rollback()
#         logger.exception("Lỗi khi lưu lịch sử chat, tiếp tục trả lời cho client.")

#     return ChatResponse(
#         question=question,
#         user_id=current_user.id,
#         answer=answer,
#         contexts=contexts,
#         message_id=msg.id,
#         created_at=msg.created_at,
#     )

# def _check_word_filter(text: str) -> Tuple[bool, list]:
#     """
#     Kiểm tra text có chứa từ cấm hay không theo file JSON.
#     """
#     try:
#         bad, terms = has_banned_terms(text, settings.word_filter_path)
#         return bad, terms
#     except FileNotFoundError:
#         # Nếu chưa có file word filter → bỏ qua chặn, log cảnh báo
#         logger.warning(f"Word filter file không tồn tại: {settings.word_filter_path}")
#         return False, []
#     except Exception:
#         logger.exception("Kiểm tra word filter thất bại.")
#         return False, []
    
# async def delete_chat_message(message_id: int, db: AsyncSession, current_user) -> dict:
#     # 1) Tìm message
#     result = await db.execute(
#         select(ChatMessage).where(ChatMessage.id == message_id)
#     )
#     msg = result.scalar_one_or_none()

#     if msg is None:
#         raise HTTPException(status_code=404, detail="Không tìm thấy message.")

#     # 2) Check ownership
#     if msg.user_id != current_user.id:
#         raise HTTPException(status_code=403, detail="Bạn không có quyền xóa message này.")

#     # 3) Xóa
#     await db.delete(msg)
#     await db.commit()

#     return {"deleted": True, "message_id": message_id}


# async def delete_chat_history(db: AsyncSession, current_user) -> dict:
#     # Xóa tất cả messages của user hiện tại
#     result = await db.execute(
#         delete(ChatMessage).where(ChatMessage.user_id == current_user.id)
#     )
#     await db.commit()

#     deleted_count = result.rowcount or 0
#     return {"deleted": True, "deleted_count": deleted_count}
"""
app/services/chat_service.py

Orchestrator:
- kiểm tra/lọc đầu vào (word filter),
- chạy pipeline RAG + Gemini,
- lưu lịch sử chat theo conversation,
- trả response theo schema Pydantic.

Ngoài ra cung cấp service cho:
1) Get list conversations (sidebar)
2) Create message (chat)
3) Rename conversation
4) Delete conversation (cascade delete messages)
"""

import json
from typing import Tuple, Optional, List
from datetime import datetime, timezone

from fastapi import HTTPException
from loguru import logger

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update, func

from app.config import settings
from app.rag.chat_pipeline import run as run_pipeline
from app.rag.word_filter import has_banned_terms

from db.schemas.chat_schema import ChatRequest, ChatResponse, ChatAnswer, RetrievedContext
from db.models.chat_model import ChatMessage

# ✅ Bạn cần có model Conversation tương ứng table conversations
from db.models.conversation_model import Conversation


# =========================
# Helpers
# =========================
def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _short_title_from_question(question: str, max_len: int = 50) -> str:
    q = (question or "").strip()
    if not q:
        return "Cuộc trò chuyện mới"
    return (q[:max_len] + "…") if len(q) > max_len else q


def _check_word_filter(text: str) -> Tuple[bool, list]:
    """
    Kiểm tra text có chứa từ cấm hay không theo file JSON.
    """
    try:
        bad, terms = has_banned_terms(text, settings.word_filter_path)
        return bad, terms
    except FileNotFoundError:
        # Nếu chưa có file word filter → bỏ qua chặn, log cảnh báo
        logger.warning(f"Word filter file không tồn tại: {settings.word_filter_path}")
        return False, []
    except Exception:
        logger.exception("Kiểm tra word filter thất bại.")
        return False, []


async def _get_owned_conversation(
    db: AsyncSession,
    conversation_id: int,
    user_id: int,
) -> Conversation:
    conv = await db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation không tồn tại.")
    return conv


# =========================
# 1) GET LIST CONVERSATIONS (Sidebar)
# =========================
async def get_list_conversations(db: AsyncSession, current_user) -> List[dict]:
    """
    Trả danh sách conversation của user:
    [{id, title, updated_at}, ...] sort mới nhất lên đầu.
    """
    result = await db.execute(
        select(Conversation.id, Conversation.title, Conversation.updated_at)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )
    rows = result.all()
    return [{"id": r.id, "title": r.title, "updated_at": r.updated_at} for r in rows]


# =========================
# 2) CREATE MESSAGE (Chat)
# =========================
async def handle_chat_request(
    req: ChatRequest,
    db: AsyncSession,
    current_user,
    conversation_id: int,
) -> ChatResponse:
    """
    Thực thi toàn bộ luồng cho một yêu cầu chat trong 1 conversation:
    - word filter
    - RAG + Gemini
    - lưu ChatMessage(conversation_id, user_id, question, answer)
    - cập nhật conversations.updated_at
    - auto set title nếu đang là "Cuộc trò chuyện mới"
    """
    question = (req.question or "").strip()
    if len(question) < 2:
        raise HTTPException(status_code=400, detail="Câu hỏi quá ngắn.")

    current_user_id = current_user.id

    # 0) Check conversation ownership
    conv = await _get_owned_conversation(db, conversation_id, current_user_id)

    # 1) Word filter (guardrails cơ bản)
    bad, terms = _check_word_filter(question)
    if bad:
        raise HTTPException(status_code=400, detail=f"Câu hỏi chứa từ bị cấm: {', '.join(terms)}")

    # 2) Chạy pipeline RAG + Gemini
    out = await run_pipeline(question, db)  # out: {"answer": {...}, "contexts": [...]}

    # 3) Chuẩn hóa dữ liệu trả về theo schema
    contexts = [RetrievedContext(**c) for c in (out.get("contexts") or [])]

    raw_answer = out.get("answer") or {}
    try:
        answer = ChatAnswer(**raw_answer)
    except Exception:
        logger.warning("Answer không khớp schema, dùng fallback.")
        fallback = {
            "answer": str(raw_answer),
            "reasoning_brief": None,
            "references": [],
            "safety": {"urgency": "routine", "rationale": "LLM không trả JSON hợp lệ"},
        }
        answer = ChatAnswer(**fallback)

    # 4) Lưu lịch sử + update conversation.updated_at (không fail app nếu DB lỗi)
    msg_id: Optional[int] = None
    created_at: datetime = _utc_now()

    try:
        msg = ChatMessage(
            conversation_id=conversation_id,
            user_id=current_user_id,
            question=question,
            answer=json.dumps(raw_answer, ensure_ascii=False),
        )
        db.add(msg)

        # flush để lấy msg.id (an toàn hơn nếu commit fail)
        await db.flush()
        msg_id = getattr(msg, "id", None)

        # cập nhật updated_at để sidebar nhảy conversation lên đầu
        conv.updated_at = func.now()

        # auto title nếu đang default
        if (conv.title or "").strip() == "Cuộc trò chuyện mới":
            conv.title = _short_title_from_question(question)

        await db.commit()

        # refresh để có created_at chính xác theo server_default
        await db.refresh(msg)
        created_at = getattr(msg, "created_at", created_at)

    except Exception:
        await db.rollback()
        logger.exception("Lỗi khi lưu lịch sử chat, tiếp tục trả lời cho client.")

    # ⚠️ Nếu DB lỗi và msg_id=None, bạn nên cho ChatResponse.message_id Optional ở schema.
    return ChatResponse(
        question=question,
        user_id=current_user_id,
        answer=answer,
        contexts=contexts,
        message_id=msg_id,
        created_at=created_at,
    )


# =========================
# 3) RENAME CONVERSATION
# =========================
async def rename_conversation(
    conversation_id: int,
    new_title: str,
    db: AsyncSession,
    current_user,
) -> dict:
    title = (new_title or "").strip()
    if not (1 <= len(title) <= 255):
        raise HTTPException(status_code=400, detail="Title phải từ 1-255 ký tự.")

    result = await db.execute(
        update(Conversation)
        .where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
        .values(title=title, updated_at=func.now())
        .returning(Conversation.id, Conversation.title, Conversation.updated_at)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Conversation không tồn tại.")

    await db.commit()
    return {"id": row.id, "title": row.title, "updated_at": row.updated_at}


# =========================
# 4) DELETE CONVERSATION (Cascade)
# =========================
async def delete_conversation(
    conversation_id: int,
    db: AsyncSession,
    current_user,
) -> dict:
    """
    Xóa 1 conversation của user hiện tại.
    Do FK chat_messages.conversation_id ON DELETE CASCADE nên messages sẽ bị xóa theo.
    """
    result = await db.execute(
        delete(Conversation)
        .where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
        .returning(Conversation.id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Conversation không tồn tại.")

    await db.commit()
    return {"deleted": True, "conversation_id": conversation_id}


# =========================
# (Giữ lại) Xóa 1 message
# =========================
async def delete_chat_message(message_id: int, db: AsyncSession, current_user) -> dict:
    result = await db.execute(select(ChatMessage).where(ChatMessage.id == message_id))
    msg = result.scalar_one_or_none()

    if msg is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy message.")

    if msg.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa message này.")

    await db.delete(msg)
    await db.commit()

    return {"deleted": True, "message_id": message_id}


# =========================
# (Giữ lại) Xóa toàn bộ lịch sử chat của user
# =========================
async def delete_chat_history(db: AsyncSession, current_user) -> dict:
    result = await db.execute(
        delete(ChatMessage).where(ChatMessage.user_id == current_user.id)
    )
    await db.commit()

    deleted_count = result.rowcount or 0
    return {"deleted": True, "deleted_count": deleted_count}
