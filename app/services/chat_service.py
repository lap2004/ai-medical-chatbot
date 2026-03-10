"""
app/services/chat_service.py

Service layer cho chat (message-based) theo schema *_012026.
Hỗ trợ:
- GET  /chat/conversations/{conversation_id}/messages
- POST /chat/conversations/{conversation_id}/messages
- PATCH /chat/messages/{message_id}
- DELETE /chat/messages/{message_id}
- POST /chat/messages/{message_id}/feedback   (like/dislike/report)

Ngoài ra giữ lại:
- list conversations (sidebar)
- rename conversation
- soft delete conversation
- soft delete history

Và cung cấp wrapper để voice_router import:
- handle_chat_request(req, db, current_user, conversation_id) -> ChatResponse
"""

from __future__ import annotations

from typing import List, Optional, Union
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from loguru import logger

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func

from app.config import settings
from app.rag.chat_pipeline import run as run_pipeline
from app.rag.word_filter import has_banned_terms

from db.models.chat_model import ChatMessage
from db.models.conversation_model import Conversation

from db.schemas.chat_schema import (
    ChatAnswer,
    ChatRequest,
    ChatResponse,
    MessageCreateIn,
    MessagePatchIn,
    MessageListOut,
    MessageOut,  # ✅ Added for feedback persistence
    MessageFeedbackIn,
    RetrievedContext,
)

# feedback/report models (nếu bạn chưa tạo file này thì service vẫn chạy được cho APIs messages)
try:
    from db.models.feedback_model import MessageFeedback, MessageReport
except Exception:
    MessageFeedback = None
    MessageReport = None


# =========================
# Helpers
# =========================
def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _short_title_from_content(content: str, max_len: int = 50) -> str:
    text = (content or "").strip()
    if not text:
        return "New chat"
    return (text[:max_len] + "…") if len(text) > max_len else text


def _check_word_filter(text: str) -> tuple[bool, list]:
    """
    return (bad: bool, terms: list[str])
    """
    try:
        bad, terms = has_banned_terms(text, settings.word_filter_path)
        return bad, terms
    except FileNotFoundError:
        logger.warning(f"Word filter file không tồn tại: {settings.word_filter_path}")
        return False, []
    except Exception:
        logger.exception("Kiểm tra word filter thất bại.")
        return False, []


async def _get_owned_conversation(db: AsyncSession, conversation_id: UUID, user_id: int) -> Conversation:
    conv = await db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
            Conversation.deleted_at.is_(None),
        )
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation không tồn tại.")
    return conv


async def _get_message(db: AsyncSession, message_id: UUID) -> ChatMessage:
    msg = await db.scalar(select(ChatMessage).where(ChatMessage.id == message_id))
    if not msg or msg.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Không tìm thấy message (không tồn tại hoặc đã bị xóa).")
    return msg


async def _ensure_parent_in_conversation(
    db: AsyncSession, conversation_id: UUID, parent_message_id: Optional[UUID]
) -> Optional[UUID]:
    """
    Validate parent_message_id:
    - None => ok
    - must exist in same conversation and not deleted
    If invalid => return None
    """
    if parent_message_id is None:
        return None

    exists = await db.scalar(
        select(ChatMessage.id).where(
            ChatMessage.id == parent_message_id,
            ChatMessage.conversation_id == conversation_id,
            ChatMessage.deleted_at.is_(None),
        )
    )
    return parent_message_id if exists else None


async def _touch_conversation(db: AsyncSession, conversation_id: UUID, now: Optional[datetime] = None) -> None:
    now = now or _utc_now()
    await db.execute(
        update(Conversation)
        .where(Conversation.id == conversation_id)
        .values(updated_at=now, last_message_at=now)
    )


async def _get_recent_messages(db: AsyncSession, conversation_id: UUID, exclude_id: Optional[UUID] = None, limit: int = 10) -> List[dict]:
    from sqlalchemy import desc
    stmt = select(ChatMessage).where(
        ChatMessage.conversation_id == conversation_id,
        ChatMessage.deleted_at.is_(None)
    )
    if exclude_id:
        stmt = stmt.where(ChatMessage.id != exclude_id)
        
    result = await db.execute(stmt.order_by(desc(ChatMessage.created_at)).limit(limit))
    messages = result.scalars().all()
    # Reverse to chronological order (oldest first in the sliding window)
    messages = list(reversed(messages))
    return [{"role": m.role, "content": m.content} for m in messages]


def _extract_assistant_text(pipeline_out: dict) -> str:
    """
    pipeline_out: {"answer": {...} or str, "contexts": [...]}
    raw_answer = pipeline_out.get("answer")
    Nếu dict thì ưu tiên raw_answer["answer"].
    """
    raw_answer = pipeline_out.get("answer")
    if isinstance(raw_answer, dict):
        txt = raw_answer.get("answer")
        if txt:
            return str(txt)
        return str(raw_answer)
    return str(raw_answer) if raw_answer is not None else ""


def _normalize_chat_answer(pipeline_out: dict) -> ChatAnswer:
    """
    Convert output pipeline sang ChatAnswer để trả cho voice/legacy.
    Nếu pipeline trả dict nhưng không đúng schema => fallback.
    """
    raw_answer = pipeline_out.get("answer") or {}
    if isinstance(raw_answer, dict):
        try:
            return ChatAnswer(**raw_answer)
        except Exception:
            logger.warning("Answer không khớp ChatAnswer schema, dùng fallback.")
            fallback = {
                "answer": raw_answer.get("answer") if isinstance(raw_answer, dict) else str(raw_answer),
                "reasoning_brief": raw_answer.get("reasoning_brief") if isinstance(raw_answer, dict) else None,
                "references": raw_answer.get("references", []) if isinstance(raw_answer, dict) else [],
                "safety": raw_answer.get("safety", {"urgency": "routine", "rationale": "fallback"}) if isinstance(raw_answer, dict) else {"urgency": "routine", "rationale": "fallback"},
            }
            return ChatAnswer(**fallback)

    # raw_answer là string/khác
    fallback = {
        "answer": str(raw_answer),
        "reasoning_brief": None,
        "references": [],
        "safety": {"urgency": "routine", "rationale": "LLM không trả JSON hợp lệ"},
    }
    return ChatAnswer(**fallback)


# =========================
# 0) LIST CONVERSATIONS (Sidebar)
# =========================
async def get_list_conversations(db: AsyncSession, current_user) -> List[dict]:
    last_ts = func.coalesce(Conversation.last_message_at, Conversation.updated_at)

    result = await db.execute(
        select(
            Conversation.id,
            Conversation.title,
            Conversation.updated_at,
            Conversation.last_message_at,
        )
        .where(
            Conversation.user_id == int(current_user.id),
            Conversation.deleted_at.is_(None),
        )
        .order_by(last_ts.desc())
    )

    rows = result.all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "updated_at": r.updated_at,
            "last_message_at": r.last_message_at,
        }
        for r in rows
    ]


# =========================
# 1) GET /chat/conversations/{conversation_id}/messages
# =========================
async def get_conversation_messages(
    conversation_id: UUID,
    db: AsyncSession,
    current_user,
) -> MessageListOut:
    from sqlalchemy.orm import selectinload
    
    await _get_owned_conversation(db, conversation_id, int(current_user.id))

    # Load messages with feedbacks and reports relationships
    result = await db.execute(
        select(ChatMessage)
        .where(
            ChatMessage.conversation_id == conversation_id,
            ChatMessage.deleted_at.is_(None),
        )
        .options(
            selectinload(ChatMessage.feedbacks),
            selectinload(ChatMessage.reports),
        )
        .order_by(ChatMessage.created_at.asc())
    )
    messages = result.scalars().all()
    
    # Build response with feedback info for current user
    items = []
    for msg in messages:
        # Find feedback from current user for this message
        user_feedback = next(
            (fb for fb in msg.feedbacks if fb.user_id == int(current_user.id)),
            None
        )
        
        # Check if current user reported this message
        user_reported = any(
            rp.reporter_user_id == int(current_user.id)
            for rp in msg.reports
        )
        
        # Build message dict with feedback info
        msg_dict = {
            "id": msg.id,
            "conversation_id": msg.conversation_id,
            "user_id": msg.user_id,
            "role": msg.role,
            "content": msg.content,
            "model": msg.model,
            "prompt_tokens": msg.prompt_tokens,
            "completion_tokens": msg.completion_tokens,
            "total_tokens": msg.total_tokens,
            "parent_message_id": msg.parent_message_id,
            "rag_context": msg.rag_context,
            "deleted_at": msg.deleted_at,
            "created_at": msg.created_at,
            # Feedback info
            "feedback": {
                "value": user_feedback.value,
                "created_at": user_feedback.created_at
            } if user_feedback else None,
            "is_reported": user_reported,
        }
        items.append(MessageOut(**msg_dict))
    
    return MessageListOut(items=items)


# =========================
# 2) POST /chat/conversations/{conversation_id}/messages
# =========================
async def create_message(
    conversation_id: UUID,
    payload: MessageCreateIn,
    db: AsyncSession,
    current_user,
    *,
    run_rag: bool = True,
) -> Union[ChatMessage, dict]:
    """
    Tạo message user. Nếu run_rag=True:
    - chạy pipeline
    - tạo thêm 1 message assistant (parent trỏ user message)
    - return dict {"user": ChatMessage, "assistant": ChatMessage, "pipeline": out}

    Nếu run_rag=False:
    - chỉ tạo user message và return ChatMessage
    """
    content = (payload.content or "").strip()
    if len(content) < 2:
        raise HTTPException(status_code=400, detail="Nội dung quá ngắn.")

    conv = await _get_owned_conversation(db, conversation_id, int(current_user.id))

    parent_id = await _ensure_parent_in_conversation(db, conversation_id, payload.parent_message_id)

    bad, terms = _check_word_filter(content)
    if bad:
        raise HTTPException(status_code=400, detail=f"Nội dung chứa từ bị cấm: {', '.join(terms)}")

    now = _utc_now()

    try:
        user_msg = ChatMessage(
            conversation_id=conversation_id,
            user_id=int(current_user.id),
            role="user",
            content=content,
            parent_message_id=parent_id,
        )
        db.add(user_msg)
        await db.flush()  # lấy user_msg.id

        # touch + auto title
        await _touch_conversation(db, conversation_id, now=now)
        if (conv.title or "").strip() in ("New chat", "Cuộc trò chuyện mới", "New chat…"):
            conv.title = _short_title_from_content(content)

        if not run_rag:
            await db.commit()
            await db.refresh(user_msg)
            return user_msg

        # RAG + LLM (with recent 5 pairs / limit=10 sliding window memory)
        recent_history = await _get_recent_messages(db, conversation_id, exclude_id=user_msg.id, limit=10)
        out = await run_pipeline(content, db, history=recent_history)
        contexts = out.get("contexts") or []
        raw_answer = out.get("answer") or {}

        assistant_text = _extract_assistant_text(out)
        if not assistant_text:
            assistant_text = "Xin lỗi, mình chưa có câu trả lời phù hợp."

        assistant_msg = ChatMessage(
            conversation_id=conversation_id,
            user_id=None,
            role="assistant",
            content=assistant_text,
            parent_message_id=user_msg.id,
            rag_context={
                "contexts": contexts,
                "raw_answer": raw_answer,
            },
            model=raw_answer.get("model") if isinstance(raw_answer, dict) else None,
            prompt_tokens=raw_answer.get("prompt_tokens") if isinstance(raw_answer, dict) else None,
            completion_tokens=raw_answer.get("completion_tokens") if isinstance(raw_answer, dict) else None,
            total_tokens=raw_answer.get("total_tokens") if isinstance(raw_answer, dict) else None,
        )
        db.add(assistant_msg)

        await _touch_conversation(db, conversation_id, now=now)

        await db.commit()
        await db.refresh(user_msg)
        await db.refresh(assistant_msg)

        return {"user": user_msg, "assistant": assistant_msg, "pipeline": out}

    except HTTPException:
        raise
    except Exception:
        await db.rollback()
        logger.exception("Lỗi create_message.")
        raise HTTPException(status_code=500, detail="Không thể tạo message. Vui lòng thử lại.")


# =========================
# 3) PATCH /chat/messages/{message_id}
# =========================
async def patch_message(
    message_id: UUID,
    payload: MessagePatchIn,
    db: AsyncSession,
    current_user,
) -> ChatMessage:
    new_content = (payload.content or "").strip()
    if len(new_content) < 1:
        raise HTTPException(status_code=400, detail="Nội dung không hợp lệ.")

    msg = await _get_message(db, message_id)
    await _get_owned_conversation(db, msg.conversation_id, int(current_user.id))

    # chỉ sửa message của chính user và role=user
    if msg.user_id != int(current_user.id):
        raise HTTPException(status_code=403, detail="Chỉ được sửa message của chính bạn.")
    if msg.role != "user":
        raise HTTPException(status_code=400, detail="Chỉ được sửa message role='user'.")

    bad, terms = _check_word_filter(new_content)
    if bad:
        raise HTTPException(status_code=400, detail=f"Nội dung chứa từ bị cấm: {', '.join(terms)}")

    now = _utc_now()
    msg.content = new_content
    await _touch_conversation(db, msg.conversation_id, now=now)

    try:
        await db.commit()
        await db.refresh(msg)
        return msg
    except Exception:
        await db.rollback()
        logger.exception("Lỗi patch_message.")
        raise HTTPException(status_code=500, detail="Không thể cập nhật message.")


# =========================
# 4) DELETE /chat/messages/{message_id} (Soft delete)
# =========================
async def soft_delete_message(
    message_id: UUID,
    db: AsyncSession,
    current_user,
) -> dict:
    msg = await _get_message(db, message_id)
    await _get_owned_conversation(db, msg.conversation_id, int(current_user.id))

    # user chỉ được xoá message của họ và role=user
    if msg.user_id != int(current_user.id):
        raise HTTPException(status_code=403, detail="Chỉ được xóa message của chính bạn.")
    if msg.role != "user":
        raise HTTPException(status_code=403, detail="Không cho phép xóa message assistant.")

    now = _utc_now()
    try:
        await db.execute(
            update(ChatMessage)
            .where(ChatMessage.id == message_id)
            .values(deleted_at=now)
        )
        await _touch_conversation(db, msg.conversation_id, now=now)
        await db.commit()
        return {"ok": True, "deleted": True, "message_id": str(message_id)}
    except Exception:
        await db.rollback()
        logger.exception("Lỗi soft_delete_message.")
        raise HTTPException(status_code=500, detail="Không thể xóa message.")


# =========================
# 5) POST /chat/messages/{message_id}/feedback  (like/dislike/report)
# =========================
async def create_feedback_or_report(
    message_id: UUID,
    payload: MessageFeedbackIn,
    db: AsyncSession,
    current_user,
) -> dict:
    """
    - like/dislike: upsert message_feedback_012026 theo (message_id, user_id)
    - report: upsert message_reports_012026 theo (message_id, reporter_user_id)

    yêu cầu:
    - message phải tồn tại và chưa deleted
    - message thuộc conversation của user
    """
    if MessageFeedback is None or MessageReport is None:
        raise HTTPException(
            status_code=500,
            detail="Feedback/Report models chưa được khai báo. Hãy tạo db/models/feedback_model.py trước.",
        )

    msg = await _get_message(db, message_id)
    await _get_owned_conversation(db, msg.conversation_id, int(current_user.id))

    now = _utc_now()
    action = payload.action

    try:
        if action in ("like", "dislike"):
            existing = await db.scalar(
                select(MessageFeedback).where(
                    MessageFeedback.message_id == message_id,
                    MessageFeedback.user_id == int(current_user.id),
                )
            )
            if existing:
                existing.value = action
                existing.reason = payload.reason
                # nếu model có onupdate thì dòng dưới không bắt buộc
                try:
                    existing.updated_at = now
                except Exception:
                    pass
            else:
                row = MessageFeedback(
                    message_id=message_id,
                    user_id=int(current_user.id),
                    value=action,
                    reason=payload.reason,
                )
                db.add(row)

            await db.commit()
            return {"ok": True, "action": action}

        if action == "report":
            existing = await db.scalar(
                select(MessageReport).where(
                    MessageReport.message_id == message_id,
                    MessageReport.reporter_user_id == int(current_user.id),
                )
            )
            if existing:
                existing.category = payload.category
                existing.details = payload.details
                existing.status = "open"
                try:
                    existing.updated_at = now
                except Exception:
                    pass
            else:
                row = MessageReport(
                    message_id=message_id,
                    reporter_user_id=int(current_user.id),
                    category=payload.category,
                    details=payload.details,
                )
                db.add(row)

            await db.commit()
            return {"ok": True, "action": "report"}

        raise HTTPException(status_code=400, detail="action không hợp lệ.")

    except HTTPException:
        raise
    except Exception:
        await db.rollback()
        logger.exception("Lỗi create_feedback_or_report.")
        raise HTTPException(status_code=500, detail="Không thể gửi feedback/report.")


# =========================
# 6) RENAME CONVERSATION
# =========================
async def rename_conversation(conversation_id: UUID, new_title: str, db: AsyncSession, current_user) -> dict:
    title = (new_title or "").strip()
    if not (1 <= len(title) <= 255):
        raise HTTPException(status_code=400, detail="Title phải từ 1-255 ký tự.")

    result = await db.execute(
        update(Conversation)
        .where(
            Conversation.id == conversation_id,
            Conversation.user_id == int(current_user.id),
            Conversation.deleted_at.is_(None),
        )
        .values(title=title, updated_at=_utc_now())
        .returning(Conversation.id, Conversation.title, Conversation.updated_at, Conversation.last_message_at)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Conversation không tồn tại.")

    await db.commit()
    return {"id": row.id, "title": row.title, "updated_at": row.updated_at, "last_message_at": row.last_message_at}


# =========================
# 7) DELETE CONVERSATION (Soft delete)
# =========================
async def soft_delete_conversation(conversation_id: UUID, db: AsyncSession, current_user) -> dict:
    now = _utc_now()
    result = await db.execute(
        update(Conversation)
        .where(
            Conversation.id == conversation_id,
            Conversation.user_id == int(current_user.id),
            Conversation.deleted_at.is_(None),
        )
        .values(deleted_at=now, updated_at=now)
        .returning(Conversation.id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Conversation không tồn tại.")

    await db.commit()
    return {"deleted": True, "conversation_id": str(conversation_id)}


# =========================
# 8) Soft delete whole history (all messages of user)
# =========================
async def soft_delete_chat_history(db: AsyncSession, current_user) -> dict:
    """
    Xoá mềm toàn bộ messages do user tạo (role=user, user_id=current_user).
    (assistant messages thường user_id=None nên không bị xoá ở đây)
    """
    now = _utc_now()
    result = await db.execute(
        update(ChatMessage)
        .where(
            ChatMessage.user_id == int(current_user.id),
            ChatMessage.role == "user",
            ChatMessage.deleted_at.is_(None),
        )
        .values(deleted_at=now)
    )
    await db.commit()
    return {"deleted": True, "deleted_count": result.rowcount or 0}


# =========================
# Backward-compatible aliases (nếu router cũ đang gọi)
# =========================
async def delete_chat_message(message_id: UUID, db: AsyncSession, current_user) -> dict:
    return await soft_delete_message(message_id, db, current_user)


async def delete_chat_history(db: AsyncSession, current_user) -> dict:
    return await soft_delete_chat_history(db, current_user)


# =========================
# Voice / Legacy compatibility
# =========================
async def handle_chat_request(
    req: ChatRequest,
    db: AsyncSession,
    current_user,
    conversation_id: UUID,
) -> ChatResponse:
    """
    Dành cho voice_router (hoặc endpoint legacy) muốn 1 lần gọi là ra answer.
    - Validate conversation ownership
    - Word filter
    - Chạy pipeline
    - Lưu 2 messages: user + assistant (role-based)
    - Trả ChatResponse (message_id là assistant message id để client dễ attach like/report)
    """
    question = (req.question or "").strip()
    if len(question) < 2:
        raise HTTPException(status_code=400, detail="Câu hỏi quá ngắn.")

    # ownership
    await _get_owned_conversation(db, conversation_id, int(current_user.id))

    # word filter
    bad, terms = _check_word_filter(question)
    if bad:
        raise HTTPException(status_code=400, detail=f"Câu hỏi chứa từ bị cấm: {', '.join(terms)}")

    now = _utc_now()

    try:
        # 1) create user message
        user_msg = ChatMessage(
            conversation_id=conversation_id,
            user_id=int(current_user.id),
            role="user",
            content=question,
            parent_message_id=None,
        )
        db.add(user_msg)
        await db.flush()

        await _touch_conversation(db, conversation_id, now=now)

        # auto title nếu đang default
        # NOTE: không load conv ở đây để giảm query; nếu cần bạn có thể load và set title
        # (đơn giản, bạn có thể bỏ qua title cho voice)
        # -> nếu bạn muốn title: hãy query conv và set nếu title == "New chat"...

        # 2) pipeline (with recent 5 pairs / limit=10 sliding window memory)
        recent_history = await _get_recent_messages(db, conversation_id, exclude_id=user_msg.id, limit=10)
        out = await run_pipeline(question, db, history=recent_history)
        assistant_text = _extract_assistant_text(out)
        if not assistant_text:
            assistant_text = "Xin lỗi, mình chưa có câu trả lời phù hợp."

        raw_answer = out.get("answer") or {}
        contexts = out.get("contexts") or []

        # 3) create assistant message
        assistant_msg = ChatMessage(
            conversation_id=conversation_id,
            user_id=None,
            role="assistant",
            content=assistant_text,
            parent_message_id=user_msg.id,
            rag_context={"contexts": contexts, "raw_answer": raw_answer},
            model=raw_answer.get("model") if isinstance(raw_answer, dict) else None,
            prompt_tokens=raw_answer.get("prompt_tokens") if isinstance(raw_answer, dict) else None,
            completion_tokens=raw_answer.get("completion_tokens") if isinstance(raw_answer, dict) else None,
            total_tokens=raw_answer.get("total_tokens") if isinstance(raw_answer, dict) else None,
        )
        db.add(assistant_msg)

        await _touch_conversation(db, conversation_id, now=now)

        await db.commit()
        await db.refresh(assistant_msg)

        # 4) response theo schema cũ (ChatResponse)
        contexts_out = [RetrievedContext(**c) for c in contexts]
        answer_obj = _normalize_chat_answer(out)

        return ChatResponse(
            question=question,
            user_id=int(current_user.id),
            answer=answer_obj,
            contexts=contexts_out,
            message_id=str(assistant_msg.id),
            created_at=getattr(assistant_msg, "created_at", now),
        )

    except HTTPException:
        raise
    except Exception:
        await db.rollback()
        logger.exception("Lỗi handle_chat_request.")
        raise HTTPException(status_code=500, detail="Không thể xử lý chat request.")
