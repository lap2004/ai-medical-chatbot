from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func

from app.core.security import get_current_user
from db.database import get_db
from db.models.user_model import User
from db.models.conversation_model import Conversation
from app.services.chat_service import handle_chat_request  # bạn đang có :contentReference[oaicite:2]{index=2}

from db.schemas.conversation_schema import (
    ConversationListItem,
    CreateMessageRequest,
    RenameConversationRequest,
    CreateMessageResponse,
)

router = APIRouter(prefix="/conversations", tags=["conversations"])


# 1) GET LIST CONVERSATIONS
@router.get("", response_model=list[ConversationListItem])
async def get_list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation.id, Conversation.title, Conversation.updated_at)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )
    rows = result.all()
    return [{"id": r.id, "title": r.title, "updated_at": r.updated_at} for r in rows]


# 2) CREATE MESSAGE (chat within a conversation)
@router.post(
    "/{conversation_id}/messages",
    response_model=CreateMessageResponse,
    status_code=status.HTTP_200_OK,
)
async def create_message(
    conversation_id: int,
    req: CreateMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # check conversation belongs to user
    conv = await db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation không tồn tại.")

    # Reuse chat pipeline + save message
    # -> cần sửa handle_chat_request để nhận conversation_id (mục D bên dưới)
    chat_resp = await handle_chat_request(
        req=type("Tmp", (), {"question": req.question})(),  # hoặc đổi handle_chat_request nhận str
        db=db,
        current_user=current_user,
        conversation_id=conversation_id,
    )

    return {
        "conversation_id": conversation_id,
        "message_id": chat_resp.message_id,
        "question": chat_resp.question,
        "answer": chat_resp.answer.model_dump() if hasattr(chat_resp.answer, "model_dump") else chat_resp.answer,
        "created_at": chat_resp.created_at,
    }


# 3) RENAME CONVERSATION
@router.patch(
    "/{conversation_id}",
    status_code=status.HTTP_200_OK,
)
async def rename_conversation(
    conversation_id: int,
    req: RenameConversationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    title = (req.title or "").strip()
    if len(title) < 1 or len(title) > 255:
        raise HTTPException(status_code=400, detail="Title phải từ 1-255 ký tự.")

    result = await db.execute(
        update(Conversation)
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .values(title=title, updated_at=func.now())
        .returning(Conversation.id, Conversation.title, Conversation.updated_at)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Conversation không tồn tại.")
    await db.commit()

    return {"id": row.id, "title": row.title, "updated_at": row.updated_at}


# 4) DELETE CONVERSATION
@router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_conversation(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        delete(Conversation)
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .returning(Conversation.id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Conversation không tồn tại.")
    await db.commit()

    # cascade sẽ xoá chat_messages do FK ON DELETE CASCADE
    return {"deleted": True, "conversation_id": conversation_id}
