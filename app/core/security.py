# from fastapi import Depends, Header, HTTPException, status
# from jose import JWTError, jwt
# from passlib.context import CryptContext
# from typing import Optional
# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy.future import select

# from app.config import settings
# from db.database import get_db
# from db.models.user_model import User
# from db.schemas.user_schema import Role

# SECRET_KEY = settings.JWT_SECRET_KEY
# ALGORITHM = settings.JWT_ALGORITHM

# def password(password: str) -> str:
#     return password 

# def verify_password(plain_password: str, stored_password: str) -> bool:
#     return plain_password == stored_password

# def decode_access_token(token: str) -> dict:
#     try:
#         return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#     except JWTError:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Token không hợp lệ",
#         )

# async def get_current_user(
#     authorization: Optional[str] = Header(None),
#     db: AsyncSession = Depends(get_db)
# ) -> User:
#     if not authorization or not authorization.startswith("Bearer "):
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Thiếu hoặc sai định dạng Authorization header",
#         )

#     token = authorization.split(" ")[1]
#     payload = decode_access_token(token)

#     user_id = payload.get("user_id")
#     if not user_id:
#         raise HTTPException(status_code=401, detail="Token thiếu thông tin")

#     result = await db.execute(select(User).where(User.id == user_id))
#     user = result.scalar_one_or_none()

#     if not user:
#         raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

#     return user  

# def require_role(allowed_roles: list[Role]):
#     """
#     Dependency kiểm tra xem người dùng hiện tại có nằm trong danh sách quyền không.
#     """
#     async def checker(current_user: User = Depends(get_current_user)):
#         if current_user.role not in allowed_roles:
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="Bạn không có quyền truy cập chức năng này."
#             )
#         return current_user

#     return checker
from __future__ import annotations

from typing import Optional, Callable

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from db.database import get_db
from db.models.user_model import User

SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM


# Bạn nói không hash -> giữ plain text
def password(pw: str) -> str:
    return pw


def verify_password(plain_password: str, stored_password: str) -> bool:
    return plain_password == stored_password


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ",
        )


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Thiếu hoặc sai định dạng Authorization header",
        )

    token = authorization.split(" ", 1)[1].strip()
    payload = decode_access_token(token)

    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token thiếu user_id")

    # user_id trong token thường là string, convert sang int vì DB là INTEGER
    try:
        user_id_int = int(user_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="user_id không hợp lệ")

    result = await db.execute(select(User).where(User.id == user_id_int))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")

    if not getattr(user, "is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản đã bị khóa")

    return user


def require_admin() -> Callable:
    """
    Dependency chỉ cho admin truy cập.
    """
    async def checker(current_user: User = Depends(get_current_user)) -> User:
        if not getattr(current_user, "is_admin", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền truy cập chức năng này.",
            )
        return current_user

    return checker


# (Tuỳ chọn) Nếu bạn muốn giữ API require_role([...]) như cũ
def require_role(allowed_roles: list[str]) -> Callable:
    """
    allowed_roles: ["admin"] hoặc ["admin", "user"]
    role được suy ra từ is_admin.
    """
    async def checker(current_user: User = Depends(get_current_user)) -> User:
        role = "admin" if getattr(current_user, "is_admin", False) else "user"
        if role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền truy cập chức năng này.",
            )
        return current_user

    return checker
