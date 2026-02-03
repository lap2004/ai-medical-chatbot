from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case

from app.core.security import require_admin
from db.database import get_db
from db.models.user_model import User
from db.models.chat_model import ChatMessage
from db.models.feedback_model import MessageFeedback, MessageReport
from db.models.enums import FeedbackValue

router = APIRouter(prefix="/admin", tags=["admin"])

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
    # Using conditional aggregation for efficiency
    feedback_stats = await db.execute(
        select(
            func.count(MessageFeedback.id).filter(MessageFeedback.value == FeedbackValue.like).label("likes"),
            func.count(MessageFeedback.id).filter(MessageFeedback.value == FeedbackValue.dislike).label("dislikes")
        )
    )
    fb_row = feedback_stats.one()
    
    # 4. Reports Stats
    # Total reports
    report_count = await db.scalar(select(func.count(MessageReport.id)))
    
    # Breakdown by category
    report_breakdown_res = await db.execute(
        select(MessageReport.category, func.count(MessageReport.id))
        .group_by(MessageReport.category)
    )
    report_breakdown = [
        {"category": row[0], "count": row[1]} 
        for row in report_breakdown_res.all()
    ]

    # 5. Recent Activities (Feedbacks & Reports mixed or separate)
    # Recent Feedbacks
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
    
    # Recent Reports
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
