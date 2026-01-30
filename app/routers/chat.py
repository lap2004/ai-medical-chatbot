
# """
# app/routers/chat.py
# Định nghĩa endpoint /chat (POST) – nhận câu hỏi, chạy service, trả JSON theo schema.
# """

# from fastapi import APIRouter, Depends, HTTPException, status
# from loguru import logger

# # ✅ Nếu dự án bạn dùng AsyncSession (log của bạn đang là AsyncSession)
# from sqlalchemy.ext.asyncio import AsyncSession

# from app.core.security import get_current_user
# from db.database import get_db
# from db.schemas.chat_schema import ChatRequest, ChatResponse
# from app.services.chat_service import delete_chat_history, delete_chat_message, handle_chat_request

# from db.models.user_model import User

# router = APIRouter(prefix="/chat", tags=["chat"])


# @router.post("", response_model=ChatResponse, status_code=status.HTTP_200_OK)
# async def chat(
#     req: ChatRequest,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ) -> ChatResponse:
#     if not req.question or len(req.question.strip()) < 2:
#         raise HTTPException(status_code=400, detail="Câu hỏi quá ngắn.")

#     try:
#         # ✅ Truyền current_user vào service (đúng lỗi bạn đang gặp)
#         resp = await handle_chat_request(req, db, current_user)
#         return resp

#     except HTTPException:
#         raise

#     except Exception:
#         logger.exception("chat() failed")
#         raise HTTPException(status_code=500, detail="Có lỗi xảy ra khi xử lý yêu cầu.")

# @router.delete(
#     "/{message_id}",
#     status_code=status.HTTP_200_OK,
# )
# async def delete_one_chat(
#     message_id: int,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     """
#     Xóa 1 message chat theo message_id (chỉ owner được xóa)
#     """
#     return await delete_chat_message(message_id, db, current_user)


# # ✅ DELETE toàn bộ lịch sử chat của user hiện tại
# @router.delete(
#     "/history",
#     status_code=status.HTTP_200_OK,
# )
# async def delete_all_chat_history(
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     """
#     Xóa toàn bộ lịch sử chat của user hiện tại
#     """
#     return await delete_chat_history(db, current_user)

"""
app/routers/chat.py
Endpoint /chat (POST) – nhận câu hỏi, chạy service, trả JSON theo schema.

Logic mới:
- Nếu req.conversation_id không có -> tạo conversation mới cho user
- Nếu có -> kiểm tra conversation thuộc user
- Gọi handle_chat_request(..., conversation_id)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import get_current_user
from db.database import get_db
from db.schemas.chat_schema import ChatRequest, ChatResponse
from db.models.user_model import User

from db.models.conversation_model import Conversation
from app.services.chat_service import (
    handle_chat_request,
    delete_chat_history,
    delete_chat_message,
)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatResponse:
    question = (req.question or "").strip()
    if len(question) < 2:
        raise HTTPException(status_code=400, detail="Câu hỏi quá ngắn.")

    try:
        # 1) Xác định conversation_id
        conversation_id = getattr(req, "conversation_id", None)

        # 2) Nếu chưa có conversation_id -> tạo conversation mới
        if conversation_id is None:
            conv = Conversation(
                user_id=current_user.id,
                title="Cuộc trò chuyện mới",
            )
            db.add(conv)
            await db.flush()  # lấy conv.id
            conversation_id = conv.id
            await db.commit()

        # 3) Nếu có conversation_id -> check ownership
        else:
            conv = await db.scalar(
                select(Conversation).where(
                    Conversation.id == conversation_id,
                    Conversation.user_id == current_user.id,
                )
            )
            if not conv:
                raise HTTPException(status_code=404, detail="Conversation không tồn tại.")

        # 4) Gọi service (đã yêu cầu conversation_id)
        resp = await handle_chat_request(req, db, current_user, conversation_id)
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
