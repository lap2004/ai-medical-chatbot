from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Requests ----------
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: Optional[str] = Field(default=None, max_length=255)

    # nếu bạn muốn cho admin tạo user admin ngay từ API:
    # is_admin: bool = False


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    email: EmailStr
    full_name: Optional[str] = Field(default=None, max_length=255)

    # Cho phép đổi quyền admin (tuỳ bạn có muốn mở không)
    is_admin: Optional[bool] = None

    # Cho phép set active/inactive (tuỳ bạn)
    is_active: Optional[bool] = None

    # đổi password nếu gửi lên
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)


class ChangePasswordSchema(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class GoogleLoginRequest(BaseModel):
    id_token: str


# ---------- Responses ----------
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

    # DB có is_admin, FE có thể map: admin/user
    is_admin: bool
    force_password_change: bool = False


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    is_admin: bool
    is_active: bool
    force_password_change: bool
    created_at: datetime
    avatar_url: Optional[str] = None

    model_config = {"from_attributes": True}
