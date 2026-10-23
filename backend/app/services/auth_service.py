import logging
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.schemas.user import UserPublic

logger = logging.getLogger(__name__)


def register_user(db: Session, data: RegisterRequest) -> User:
    """Register a new student or teacher account."""
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        role=data.role,
        preferred_language=data.preferred_language,
        grade=data.grade,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, data: LoginRequest) -> TokenResponse:
    """Authenticate user and return JWT token."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token,
        user=UserPublic.model_validate(user),
    )


def change_password(
    db: Session, user: User, current_password: str, new_password: str
) -> None:
    """Change a user's password."""
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    user.hashed_password = get_password_hash(new_password)
    user.must_change_password = False
    db.commit()


def bootstrap_admin(db: Session) -> Optional[User]:
    """Create initial admin user from environment variables if none exists."""
    if not settings.INITIAL_ADMIN_EMAIL or not settings.INITIAL_ADMIN_PASSWORD:
        return None

    # Check if any admin exists
    admin_exists = db.query(User).filter(User.role == "admin").first()
    if admin_exists:
        return None

    admin = User(
        email=settings.INITIAL_ADMIN_EMAIL.lower().strip(),
        hashed_password=get_password_hash(settings.INITIAL_ADMIN_PASSWORD),
        full_name="System Administrator",
        role="admin",
        must_change_password=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    logger.info(f"Admin user bootstrapped: {admin.email}")
    return admin
