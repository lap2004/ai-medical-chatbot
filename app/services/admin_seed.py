from sqlalchemy.orm import Session

from app.config import settings
from db.models.user_model import User

# import hàm encode password (hiện tại return plain text theo config của bạn)
from app.core.security import password as encode_password


def ensure_single_admin(db: Session) -> None:
    """
    Đảm bảo luôn tồn tại 1 admin account theo ADMIN_EMAIL / ADMIN_PASSWORD trong .env
    """
    admin_email = settings.admin_email.strip().lower()
    admin_password = settings.admin_password

    admin = db.query(User).filter(User.email == admin_email).first()

    if not admin:
        admin = User(
            email=admin_email,
            password=encode_password(admin_password),  # ✅ đúng, không bị shadow
            is_admin=True,
            is_active=True,
            force_password_change=False,
        )
        db.add(admin)
    else:
        # luôn sync quyền & trạng thái
        admin.is_admin = True
        admin.is_active = True

        # sync lại password từ env (đổi ADMIN_PASSWORD là có hiệu lực)
        admin.password = encode_password(admin_password)

    db.commit()
