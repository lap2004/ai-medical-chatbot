"""
app/services/chat_service.py
Orchestrator:
- kiểm tra/lọc đầu vào (word filter),
- chạy pipeline RAG + Gemini,
- lưu lịch sử chat,
- trả response theo schema Pydantic.
"""

import json
from typing import Tuple

from fastapi import HTTPException
from sqlalchemy.orm import Session
from loguru import logger

from app.config import settings
from db.schemas.chat_schema import ChatRequest, ChatResponse, ChatAnswer, RetrievedContext
from db.models.chat_model import ChatMessage
from app.rag.chat_pipeline import run as run_pipeline
from app.rag.word_filter import has_banned_terms

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select

from db.models.chat_model import ChatMessage

async def handle_chat_request(req: ChatRequest, db: Session, current_user) -> ChatResponse:
    """
    Thực thi toàn bộ luồng cho một yêu cầu chat.
    """
    question = req.question.strip()
    current_user_id = current_user.id
    # 1) Word filter (guardrails cơ bản)
    bad, terms = _check_word_filter(question)
    if bad:
        raise HTTPException(status_code=400, detail=f"Câu hỏi chứa từ bị cấm: {', '.join(terms)}")

    # 2) Chạy pipeline RAG + Gemini
    # out = run_pipeline(question, db)
    out = await run_pipeline(question, db)
    # out: {"answer": {...}, "contexts": [...]}

    # 3) Chuẩn hóa dữ liệu trả về theo schema
    contexts = [RetrievedContext(**c) for c in (out.get("contexts") or [])]

    # Đảm bảo có trường tối thiểu trong answer
    raw_answer = out.get("answer") or {}
    try:
        answer = ChatAnswer(**raw_answer)
    except Exception:
        # fallback nếu LLM trả ngoài format
        logger.warning("Answer không khớp schema, dùng fallback.")
        fallback = {
            "answer": str(raw_answer),
            "reasoning_brief": None,
            "references": [],
            "safety": {"urgency": "routine", "rationale": "LLM không trả JSON hợp lệ"},
        }
        answer = ChatAnswer(**fallback)

    # 4) Lưu lịch sử (không fail app nếu ghi DB lỗi)
    try:
        msg = ChatMessage(
            user_id=current_user_id,
            question=question,
            answer=json.dumps(raw_answer, ensure_ascii=False),
        )
        db.add(msg)
        await db.commit()
    except Exception:
        await db.rollback()
        logger.exception("Lỗi khi lưu lịch sử chat, tiếp tục trả lời cho client.")

    return ChatResponse(
        question=question,
        user_id=current_user.id,
        answer=answer,
        contexts=contexts,
        message_id=msg.id,
        created_at=msg.created_at,
    )

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
    
async def delete_chat_message(message_id: int, db: AsyncSession, current_user) -> dict:
    # 1) Tìm message
    result = await db.execute(
        select(ChatMessage).where(ChatMessage.id == message_id)
    )
    msg = result.scalar_one_or_none()

    if msg is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy message.")

    # 2) Check ownership
    if msg.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa message này.")

    # 3) Xóa
    await db.delete(msg)
    await db.commit()

    return {"deleted": True, "message_id": message_id}


async def delete_chat_history(db: AsyncSession, current_user) -> dict:
    # Xóa tất cả messages của user hiện tại
    result = await db.execute(
        delete(ChatMessage).where(ChatMessage.user_id == current_user.id)
    )
    await db.commit()

    deleted_count = result.rowcount or 0
    return {"deleted": True, "deleted_count": deleted_count}