from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import settings
from db.database import get_db

def create_access_token(subject: str, expires_minutes: Optional[int] = None, extra: dict | None = None) -> str:
    if not subject or not isinstance(subject, str):
        raise ValueError("subject must be a non-empty string")

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.jwt_expire_minutes
    )

    payload: dict[str, Any] = {
        "sub": subject,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    if extra:
        payload.update(extra)

    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)


def decode_access_token(token: str) -> dict[str, Any]:
    if not token or not isinstance(token, str):
        raise ValueError("Invalid token")
    try:
        decoded = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
        if not isinstance(decoded, dict):
            raise ValueError("Invalid token")
        return decoded
    except JWTError as e:
        raise ValueError("Invalid token") from e


def decode_token(token: str) -> dict[str, Any]:
    return decode_access_token(token)


bearer = HTTPBearer(auto_error=False)


def get_current_user(
    cred: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
):
    if not cred or not cred.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(cred.credentials)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload.get("sub") or payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    from app.services.auth_service import get_user_by_email

    user = get_user_by_email(db, str(email))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    if hasattr(user, "is_active") and not getattr(user, "is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User inactive")

    return user
