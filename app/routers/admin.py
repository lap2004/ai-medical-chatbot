from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, cast, String
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

from app.config import settings
from app.core.security import require_admin, password as hash_password
from db.database import get_db
from db.models.user_model import User
from db.models.chat_model import ChatMessage
from db.models.feedback_model import MessageFeedback, MessageReport
from db.models.enums import FeedbackValue

router = APIRouter(prefix="/admin", tags=["admin"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    name: Optional[str]
    email: str
    role: str          # "ADMIN" | "USER"
    status: str        # "Active" | "Inactive"
    created_at: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class CreateUserBody(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    is_admin: bool = False
    is_active: bool = True


class UpdateUserBody(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6, max_length=128)
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None


def _user_to_out(u: User) -> dict:
    return {
        "id": u.id,
        "name": u.full_name or "",
        "email": u.email,
        "role": "ADMIN" if u.is_admin else "USER",
        "status": "Active" if u.is_active else "Inactive",
        "created_at": u.created_at.strftime("%b %d, %Y") if u.created_at else "",
        "avatar_url": u.avatar_url,
    }


# ─── Existing endpoints ────────────────────────────────────────────────────────

@router.get("/dashboard")
async def admin_dashboard(admin: User = Depends(require_admin())):
    return {"ok": True, "admin_email": admin.email}


@router.get("/analytics")
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin())
):
    """
    Get system-wide analytics:
    - User count
    - Message count (Traffic)
    - Feedback stats (Like/Dislike)
    - Report stats (Total + Breakdown)
    """
    
    # 1. Total Users
    user_count = await db.scalar(select(func.count(User.id)))
    
    # 2. Total Messages (Traffic proxy)
    msg_count = await db.scalar(select(func.count(ChatMessage.id)))
    
    # 3. Feedback Stats (Like vs Dislike)
    feedback_stats = await db.execute(
        select(
            func.count(MessageFeedback.id).filter(MessageFeedback.value == FeedbackValue.like).label("likes"),
            func.count(MessageFeedback.id).filter(MessageFeedback.value == FeedbackValue.dislike).label("dislikes")
        )
    )
    fb_row = feedback_stats.one()
    
    # 4. Reports Stats
    report_count = await db.scalar(select(func.count(MessageReport.id)))
    
    report_breakdown_res = await db.execute(
        select(MessageReport.category, func.count(MessageReport.id))
        .group_by(MessageReport.category)
    )
    report_breakdown = [
        {"category": row[0], "count": row[1]} 
        for row in report_breakdown_res.all()
    ]

    # 5. Recent Activities
    recent_feedbacks_res = await db.execute(
        select(MessageFeedback, User.email)
        .join(User, MessageFeedback.user_id == User.id)
        .order_by(MessageFeedback.created_at.desc())
        .limit(5)
    )
    recent_feedbacks = [
        {
            "type": "feedback",
            "user": row.email,
            "value": row.MessageFeedback.value,
            "time": row.MessageFeedback.created_at
        }
        for row in recent_feedbacks_res.all()
    ]
    
    recent_reports_res = await db.execute(
         select(MessageReport, User.email)
        .join(User, MessageReport.reporter_user_id == User.id)
        .order_by(MessageReport.created_at.desc())
        .limit(5)
    )
    recent_reports = [
        {
            "type": "report",
            "user": row.email,
            "category": row.MessageReport.category,
            "time": row.MessageReport.created_at
        }
        for row in recent_reports_res.all()
    ]

    # 6. Top Active Users (by message count)
    top_users_res = await db.execute(
        select(User.email, func.count(ChatMessage.id).label("msg_count"))
        .join(ChatMessage, ChatMessage.user_id == User.id)
        .group_by(User.id)
        .order_by(func.count(ChatMessage.id).desc())
        .limit(5)
    )
    top_users = [
        {"email": row.email, "count": row.msg_count}
        for row in top_users_res.all()
    ]
    
    return {
        "users": user_count,
        "messages": msg_count,
        "likes": fb_row.likes,
        "dislikes": fb_row.dislikes,
        "reports": {
            "total": report_count,
            "breakdown": report_breakdown
        },
        "recent_activities": sorted(
            recent_feedbacks + recent_reports, 
            key=lambda x: x["time"], 
            reverse=True
        )[:10],
        "top_users": top_users
    }


# ─── User Management endpoints ────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    q: Optional[str] = Query(None, description="Search by name, email or ID"),
    role: Optional[str] = Query(None, description="Filter by role: ADMIN | USER | ALL"),
    status: Optional[str] = Query(None, description="Filter by status: Active | Inactive | ALL"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin()),
):
    """List users with optional search/filter/pagination."""
    stmt = select(User)

    # Search
    if q:
        q_lower = f"%{q.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(User.full_name).like(q_lower),
                func.lower(User.email).like(q_lower),
                cast(User.id, String).like(q_lower)
            )
        )

    # Role filter
    if role and role != "ALL":
        if role == "ADMIN":
            stmt = stmt.where(User.is_admin == True)
        elif role == "USER":
            stmt = stmt.where(User.is_admin == False)

    # Status filter
    if status and status != "ALL":
        if status == "Active":
            stmt = stmt.where(User.is_active == True)
        elif status == "Inactive":
            stmt = stmt.where(User.is_active == False)

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = await db.scalar(count_stmt)

    # Paginate
    stmt = stmt.order_by(User.id.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    users = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [_user_to_out(u) for u in users],
    }


@router.post("/users", status_code=201)
async def create_user(
    body: CreateUserBody,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin()),
):
    """Create a new user."""
    # Check duplicate email
    existing = await db.scalar(select(User).where(User.email == body.email))
    if existing:
        raise HTTPException(status_code=409, detail="Email đã tồn tại.")

    new_user = User(
        full_name=body.full_name,
        email=body.email,
        password=hash_password(body.password),
        is_admin=body.is_admin,
        is_active=body.is_active,
        force_password_change=False,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return _user_to_out(new_user)


@router.patch("/users/{user_id}")
async def update_user(
    user_id: int,
    body: UpdateUserBody,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin()),
):
    """Update user fields (partial update)."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user.")

    if body.full_name is not None:
        user.full_name = body.full_name
    if body.email is not None:
        # Check duplicate email (skip if same user)
        dup = await db.scalar(
            select(User).where(User.email == body.email, User.id != user_id)
        )
        if dup:
            raise HTTPException(status_code=409, detail="Email đã tồn tại.")
        user.email = body.email
    if body.password is not None:
        user.password = hash_password(body.password)
    if body.is_admin is not None:
        user.is_admin = body.is_admin
    if body.is_active is not None:
        user.is_active = body.is_active

    await db.commit()
    await db.refresh(user)
    return _user_to_out(user)


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin()),
):
    """Delete a user. Admin cannot delete themselves."""
    if admin.id == user_id:
        raise HTTPException(status_code=400, detail="Không thể xóa chính mình.")

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy user.")

    await db.delete(user)
    await db.commit()
    return None


# ─── Settings endpoints ────────────────────────────────────────────────────────

class SystemSettingsBody(BaseModel):
    allow_signup: Optional[bool] = None
    qa_topk: Optional[int] = Field(None, ge=1, le=20)
    gemini_model: Optional[str] = None


class AdminProfileBody(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(None, min_length=6, max_length=128)


@router.get("/settings")
async def get_settings(
    admin: User = Depends(require_admin()),
):
    """Get current system & AI settings."""
    return {
        "allow_signup": settings.allow_signup,
        "qa_topk": settings.qa_topk,
        "gemini_model": settings.gemini_model,
    }


@router.patch("/settings")
async def update_settings(
    body: SystemSettingsBody,
    admin: User = Depends(require_admin()),
):
    """Update runtime system & AI settings (in-memory, resets on restart)."""
    if body.allow_signup is not None:
        settings.allow_signup = body.allow_signup
    if body.qa_topk is not None:
        settings.qa_topk = body.qa_topk
    if body.gemini_model is not None:
        settings.gemini_model = body.gemini_model.strip()
    return {
        "allow_signup": settings.allow_signup,
        "qa_topk": settings.qa_topk,
        "gemini_model": settings.gemini_model,
    }


@router.get("/me")
async def get_admin_profile(
    admin: User = Depends(require_admin()),
):
    """Get current admin profile."""
    return _user_to_out(admin)


@router.patch("/me")
async def update_admin_profile(
    body: AdminProfileBody,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin()),
):
    """Update admin's own profile and/or password."""
    from app.core.security import verify_password

    if body.full_name is not None:
        admin.full_name = body.full_name

    if body.email is not None:
        dup = await db.scalar(
            select(User).where(User.email == body.email, User.id != admin.id)
        )
        if dup:
            raise HTTPException(status_code=409, detail="Email đã tồn tại.")
        admin.email = body.email

    if body.new_password is not None:
        if not body.current_password:
            raise HTTPException(status_code=400, detail="Cần nhập mật khẩu hiện tại.")
        if not verify_password(body.current_password, admin.password):
            raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng.")
        admin.password = hash_password(body.new_password)

    await db.commit()
    await db.refresh(admin)
    return _user_to_out(admin)
