from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, ChangePasswordRequest
from app.schemas.user import UserPublic, UserUpdate
from app.services.auth_service import register_user, authenticate_user
from app.services.audit_service import log_action

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new student or teacher account."""
    if data.role not in ["student", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public registration is only available for student and teacher roles",
        )
    user = register_user(db, data)
    log_action(db, actor_id=user.id, action="USER_REGISTERED", target_type="user", target_id=str(user.id))
    return user


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email and password and return a JWT access token."""
    return authenticate_user(db, data)


@router.post("/logout")
def logout():
    """Sign out endpoint (token invalidated on client side)."""
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserPublic)
def get_current_profile(current_user: User = Depends(get_current_user)):
    """Retrieve profile of currently authenticated user."""
    return current_user


@router.patch("/me", response_model=UserPublic)
def update_current_profile(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update profile attributes for currently authenticated user."""
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.preferred_language is not None:
        current_user.preferred_language = data.preferred_language
    if data.grade is not None:
        current_user.grade = data.grade
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change user password. Clears initial bootstrap password-change requirement."""
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    current_user.hashed_password = get_password_hash(data.new_password)
    current_user.must_change_password = False
    db.commit()

    log_action(db, actor_id=current_user.id, action="PASSWORD_CHANGED", target_type="user", target_id=str(current_user.id))
    return {"message": "Password changed successfully"}
