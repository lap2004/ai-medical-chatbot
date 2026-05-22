# backend/app/utils/password.py
from __future__ import annotations

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
BCRYPT_MAX_PASSWORD_BYTES = 72


def hash_password(password: str) -> str:
    if not isinstance(password, str) or not password:
        raise ValueError("Password must be a non-empty string")

    pw_bytes = password.encode("utf-8")
    if len(pw_bytes) > BCRYPT_MAX_PASSWORD_BYTES:
        raise ValueError(f"Password too long for bcrypt (max {BCRYPT_MAX_PASSWORD_BYTES} bytes).")

    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    if not password_hash or not isinstance(password_hash, str):
        return False
    try:
        pw_bytes = (password or "").encode("utf-8")
        if len(pw_bytes) > BCRYPT_MAX_PASSWORD_BYTES:
            return False
        return pwd_context.verify(password, password_hash)
    except Exception:
        return False
