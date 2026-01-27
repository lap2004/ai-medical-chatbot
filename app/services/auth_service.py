# from __future__ import annotations

# from datetime import datetime, timedelta
# from typing import Optional

# from fastapi import Depends, Header, HTTPException, status
# from jose import JWTError, jwt
# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy import select

# from app.config import settings
# from db.database import get_db
# from db.models.user_model import User


# SECRET_KEY = settings.JWT_SECRET_KEY
# ALGORITHM = settings.JWT_ALGORITHM
# EXPIRE_MINUTES = settings.JWT_EXPIRE_MINUTES


# # Bạn muốn lưu plain text -> giữ nguyên
# def password(pw: str) -> str:
#     return pw


# def verify_password(plain_password: str, stored_password: str) -> bool:
#     return plain_password == stored_password


# def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
#     """
#     data nên chứa: {"user_id": <int hoặc str>, "is_admin": <bool>}
#     """
#     to_encode = data.copy()
#     expire = datetime.utcnow() + (expires_delta or timedelta(minutes=EXPIRE_MINUTES))
#     to_encode.update({"exp": expire})
#     return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# def decode_access_token(token: str) -> dict:
#     try:
#         return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#     except JWTError as e:
#         raise ValueError("Token decode failed") from e


# async def get_current_user(
#     authorization: Optional[str] = Header(None),
#     db: AsyncSession = Depends(get_db),
# ) -> User:
#     if not authorization or not authorization.startswith("Bearer "):
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Thiếu hoặc sai định dạng Authorization header",
#             headers={"WWW-Authenticate": "Bearer"},
#         )

#     token = authorization.split(" ", 1)[1].strip()

#     try:
#         payload = decode_access_token(token)
#     except ValueError:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Token không hợp lệ",
#             headers={"WWW-Authenticate": "Bearer"},
#         )

#     user_id = payload.get("user_id")
#     if user_id is None:
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token thiếu user_id")

#     # DB id là INTEGER -> ép kiểu int
#     try:
#         user_id_int = int(user_id)
#     except Exception:
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="user_id không hợp lệ")

#     result = await db.execute(select(User).where(User.id == user_id_int))
#     user = result.scalar_one_or_none()
#     if not user:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")

#     if not user.is_active:
#         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản đã bị khóa")

#     return user


# async def register_user(email: str, full_name: Optional[str], raw_password: str, db: AsyncSession) -> User:
#     email_norm = (email or "").strip().lower()

#     q = await db.execute(select(User).where(User.email == email_norm))
#     existing = q.scalar_one_or_none()
#     if existing:
#         raise HTTPException(status_code=400, detail="Email đã tồn tại")

#     user = User(
#         email=email_norm,
#         full_name=full_name,
#         password=password(raw_password),     # plain text theo yêu cầu
#         is_admin=False,
#         is_active=True,
#         force_password_change=False,
#     )

#     db.add(user)
#     await db.commit()
#     await db.refresh(user)
#     return user

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from db.database import get_db
from db.models.user_model import User


SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM
EXPIRE_MINUTES = settings.JWT_EXPIRE_MINUTES


# Bạn muốn lưu plain text -> giữ nguyên
def password(pw: str) -> str:
    return pw


def verify_password(plain_password: str, stored_password: str) -> bool:
    return plain_password == stored_password


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    data nên chứa: {"user_id": <int hoặc str>, "is_admin": <bool>}
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as e:
        raise ValueError("Token decode failed") from e


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Thiếu hoặc sai định dạng Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ", 1)[1].strip()

    try:
        payload = decode_access_token(token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token thiếu user_id")

    # DB id là INTEGER -> ép kiểu int
    try:
        user_id_int = int(user_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="user_id không hợp lệ")

    result = await db.execute(select(User).where(User.id == user_id_int))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản đã bị khóa")

    return user


async def register_user(email: str, full_name: Optional[str], raw_password: str, db: AsyncSession) -> User:
    email_norm = (email or "").strip().lower()

    q = await db.execute(select(User).where(User.email == email_norm))
    existing = q.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email đã tồn tại")

    user = User(
        email=email_norm,
        full_name=full_name,
        password=password(raw_password),  # plain text theo yêu cầu
        is_admin=False,
        is_active=True,
        force_password_change=False,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)  # ✅ đúng biến
    return user
