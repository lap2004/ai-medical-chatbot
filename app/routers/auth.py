from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, Depends, Response, status, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.services.auth_service import (
    create_access_token,
    get_current_user,
    verify_password,
)

from app.core.security import password  # hàm hash (theo code bạn đang dùng)
from app.auth.email_utils import generate_random_password, send_new_password_email
from db.database import get_db
from db.models.user_model import User
from db.schemas.auth_schema import TokenResponse
from db.schemas.user_schema import ChangePasswordSchema, GoogleLoginRequest, UserCreate, UserLogin, UserOut

from app.config import settings as app_settings

router = APIRouter(tags=["Auth"])


def _role_from_user(u: User) -> str:
    return "admin" if getattr(u, "is_admin", False) else "user"


@router.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "role": _role_from_user(current_user),
        "message": "Bạn có token hợp lệ!",
    }


@router.get("/me", response_model=UserOut)
async def get_me(user: User = Depends(get_current_user)):
    return user


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db)):
    if not app_settings.allow_signup:
        raise HTTPException(status_code=403, detail="Đăng ký tài khoản hiện đang bị tắt.")
    # email unique check
    result = await db.execute(select(User).where(User.email == user.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email đã tồn tại")

    new_user = User(
        email=user.email.strip().lower(),
        password=password(user.password),   # giữ theo code hiện tại của bạn
        full_name=getattr(user, "full_name", None),
        is_admin=False,
        is_active=True,
        force_password_change=False,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token({"user_id": str(new_user.id), "is_admin": new_user.is_admin})
    return TokenResponse(
        access_token=token,
        role=_role_from_user(new_user),
        force_password_change=new_user.force_password_change,
    )


@router.post("/login")
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user.email))
    db_user: User | None = result.scalar_one_or_none()

    if not db_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email hoặc mật khẩu không đúng")

    if not db_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản đã bị khóa")

    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email hoặc mật khẩu không đúng")

    token = create_access_token({"user_id": str(db_user.id), "is_admin": db_user.is_admin})

    response = JSONResponse(
        content={
            "access_token": token,
            "role": _role_from_user(db_user),
            "force_password_change": db_user.force_password_change,
        }
    )

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="Lax",
        max_age=60 * 60 * 24 * 7,
        secure=False,  # production nên True + HTTPS
    )

    return response


@router.post("/logout")
async def logout(_: Response):
    res = JSONResponse(content={"message": "Đăng xuất thành công!"})
    res.delete_cookie("access_token")
    return res


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email))
    user: User | None = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Email không tồn tại")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa")

    new_password = generate_random_password()

    user.password = password(new_password)  # giữ theo code hiện tại
    user.force_password_change = True

    db.add(user)
    await db.commit()
    await db.refresh(user)

    send_new_password_email(user.email, new_password)
    return {"message": "Mật khẩu mới đã được gửi đến email của bạn."}


@router.post("/change-password")
async def change_password(
    data: ChangePasswordSchema,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa")

    if not verify_password(data.current_password, user.password):
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng.")

    user.password = password(data.new_password)
    user.force_password_change = False

    db.add(user)
    await db.commit()

    return {"message": "Đổi mật khẩu thành công"}


@router.post("/google")
async def login_google(data: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests

    try:
        id_info = google_id_token.verify_oauth2_token(data.id_token, google_requests.Request())
        email = id_info.get("email")
        name = id_info.get("name", "")
        if not email:
            raise ValueError("Token không chứa email")
    except Exception:
        raise HTTPException(status_code=401, detail="id_token không hợp lệ")

    result = await db.execute(select(User).where(User.email == email))
    db_user: User | None = result.scalar_one_or_none()

    if not db_user:
        # tạo user mới từ google
        db_user = User(
            email=email.strip().lower(),
            full_name=name,
            password="google-auth",  # bạn đang làm vậy, giữ nguyên
            is_admin=False,
            is_active=True,
            force_password_change=False,
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)

    if not db_user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa")

    token = create_access_token({"user_id": str(db_user.id), "is_admin": db_user.is_admin})

    response = JSONResponse(
        content={
            "access_token": token,
            "role": _role_from_user(db_user),
            "force_password_change": db_user.force_password_change,
        }
    )
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="Lax",
        max_age=60 * 60 * 24 * 7,
        secure=False,
    )
    return response


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
UPLOAD_DIR = Path("data/uploads")


@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload ảnh đại diện cho user đang đăng nhập."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Chỉ chấp nhận file ảnh (JPEG, PNG, WEBP, GIF).",
        )

    # Giới hạn 5MB
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File ảnh tối đa 5MB.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "avatar").suffix or ".jpg"
    filename = f"user_{user.id}_{uuid.uuid4().hex[:8]}{ext}"
    save_path = UPLOAD_DIR / filename

    with open(save_path, "wb") as f:
        f.write(content)

    avatar_url = f"/uploads/{filename}"
    user.avatar_url = avatar_url
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {"avatar_url": avatar_url}


class UpdateProfileRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)


@router.put("/update-profile")
async def update_profile(
    body: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cập nhật thông tin cá nhân (hiện tại là full_name)."""
    user.full_name = body.full_name
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {"message": "Cập nhật thành công"}
