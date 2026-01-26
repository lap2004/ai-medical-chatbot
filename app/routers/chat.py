"""
app/routers/chat.py
Định nghĩa endpoint /chat (POST) – nhận câu hỏi, chạy service, trả JSON theo schema.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from loguru import logger

from db.database import get_db
from db.schemas.chat_schema import ChatRequest, ChatResponse
from app.services.chat_service import handle_chat_request

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat(req: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    """
    Nhận câu hỏi từ người dùng, gọi service để:
      - lọc từ cấm
      - chạy RAG + Gemini
      - lưu lịch sử chat
      - trả JSON đã chuẩn hóa (có trường safety)
    """
    if not req.question or len(req.question.strip()) < 3:
        raise HTTPException(status_code=400, detail="Câu hỏi quá ngắn.")

    try:
        resp = await handle_chat_request(req, db)
        return resp
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("chat() failed")
        raise HTTPException(status_code=500, detail="Có lỗi xảy ra khi xử lý yêu cầu.")
