from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func

from app.core.security import get_current_user
from db.database import get_db
from db.models.user_model import User
from db.models.conversation_model import Conversation
from db.models.chat_model import ChatMessage

from app.services.chat_service import handle_chat_request, rename_conversation, soft_delete_conversation
from db.schemas.conversation_schema import (
    ConversationListItem,
    CreateConversationResponse,
    CreateMessageRequest,
    CreateMessageResponse,
    RenameConversationRequest,
    MessageItem,
)

from db.schemas.chat_schema import ChatRequest


router = APIRouter(prefix="/conversations", tags=["conversations"])


# 1) GET LIST CONVERSATIONS
@router.get("", response_model=list[ConversationListItem])
async def get_list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Conversation.id, Conversation.title, Conversation.updated_at, Conversation.last_message_at)
        .where(Conversation.user_id == current_user.id, Conversation.deleted_at.is_(None))
        .order_by(Conversation.last_message_at.desc())
    )
    rows = result.all()
    return [
        {"id": r.id, "title": r.title, "updated_at": r.updated_at, "last_message_at": r.last_message_at}
        for r in rows
    ]


# 1b) CREATE CONVERSATION (optional, cho FE tạo trước)
@router.post("", response_model=CreateConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = Conversation(user_id=current_user.id)
    db.add(conv)
    await db.flush()
    await db.commit()
    await db.refresh(conv)
    return {"id": conv.id, "title": conv.title, "created_at": conv.created_at}


# 1c) GET MESSAGES IN CONVERSATION
@router.get("/{conversation_id}/messages")
async def get_messages(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all messages in a conversation with feedback status"""
    from app.services.chat_service import get_conversation_messages
    return await get_conversation_messages(conversation_id, db, current_user)


# 2) CREATE MESSAGE (chat within a conversation)
@router.post(
    "/{conversation_id}/messages",
    response_model=CreateMessageResponse,
    status_code=status.HTTP_200_OK,
)
async def create_message(
    conversation_id: UUID,
    req: CreateMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = await db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
            Conversation.deleted_at.is_(None),
        )
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation không tồn tại.")

    chat_req = ChatRequest(
        question=req.content,
        conversation_id=conversation_id,
        parent_message_id=req.parent_message_id,
    )
    chat_resp = await handle_chat_request(
        req=chat_req,
        db=db,
        current_user=current_user,
        conversation_id=conversation_id,
    )

    return {
        "conversation_id": conversation_id,
        "user_message_id": chat_resp.user_message_id,
        "assistant_message_id": chat_resp.assistant_message_id,
        "created_at": chat_resp.created_at,
    }


# 3) RENAME CONVERSATION
@router.patch("/{conversation_id}", status_code=status.HTTP_200_OK)
async def patch_rename_conversation(
    conversation_id: UUID,
    req: RenameConversationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await rename_conversation(conversation_id, req.title, db, current_user)


# 4) DELETE CONVERSATION (soft delete)
@router.delete("/{conversation_id}", status_code=status.HTTP_200_OK)
async def delete_conversation(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await soft_delete_conversation(conversation_id, db, current_user)
