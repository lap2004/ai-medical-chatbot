from sqlalchemy.orm import Session
from app.config import settings
from db.models.user_model import User
from app.core.security import password as encode_password

def ensure_single_admin(db: Session) -> None:
    admin_email = settings.admin_email.strip().lower()
    admin_password = settings.admin_password
    admin = db.query(User).filter(User.email == admin_email).first()

    if not admin:
        admin = User(
            email=admin_email,
            password=encode_password(admin_password),  
            is_active=True,
            force_password_change=False,
        )
        db.add(admin)
    else:
        admin.is_admin = True
        admin.is_active = True
        admin.password = encode_password(admin_password)

    db.commit()
