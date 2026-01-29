# """
# app/routers/chat.py
# Định nghĩa endpoint /chat (POST) – nhận câu hỏi, chạy service, trả JSON theo schema.
# """

# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# from loguru import logger

# from db.database import get_db
# from db.schemas.chat_schema import ChatRequest, ChatResponse
# from app.services.chat_service import handle_chat_request

# router = APIRouter(prefix="/chat", tags=["chat"])


# @router.post("", response_model=ChatResponse, status_code=status.HTTP_200_OK)
# async def chat(req: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
#     """
#     Nhận câu hỏi từ người dùng, gọi service để:
#       - lọc từ cấm
#       - chạy RAG + Gemini
#       - lưu lịch sử chat
#       - trả JSON đã chuẩn hóa (có trường safety)
#     """
#     if not req.question or len(req.question.strip()) < 3:
#         raise HTTPException(status_code=400, detail="Câu hỏi quá ngắn.")

#     try:
#         resp = await handle_chat_request(req, db)
#         return resp
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.exception("chat() failed")
#         raise HTTPException(status_code=500, detail="Có lỗi xảy ra khi xử lý yêu cầu.")


"""
app/routers/chat.py
Định nghĩa endpoint /chat (POST) – nhận câu hỏi, chạy service, trả JSON theo schema.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger

# ✅ Nếu dự án bạn dùng AsyncSession (log của bạn đang là AsyncSession)
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from db.database import get_db
from db.schemas.chat_schema import ChatRequest, ChatResponse
from app.services.chat_service import delete_chat_history, delete_chat_message, handle_chat_request

from db.models.user_model import User

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatResponse:
    if not req.question or len(req.question.strip()) < 2:
        raise HTTPException(status_code=400, detail="Câu hỏi quá ngắn.")

    try:
        # ✅ Truyền current_user vào service (đúng lỗi bạn đang gặp)
        resp = await handle_chat_request(req, db, current_user)
        return resp

    except HTTPException:
        raise

    except Exception:
        logger.exception("chat() failed")
        raise HTTPException(status_code=500, detail="Có lỗi xảy ra khi xử lý yêu cầu.")

@router.delete(
    "/{message_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_one_chat(
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Xóa 1 message chat theo message_id (chỉ owner được xóa)
    """
    return await delete_chat_message(message_id, db, current_user)


# ✅ DELETE toàn bộ lịch sử chat của user hiện tại
@router.delete(
    "/history",
    status_code=status.HTTP_200_OK,
)
async def delete_all_chat_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Xóa toàn bộ lịch sử chat của user hiện tại
    """
    return await delete_chat_history(db, current_user)