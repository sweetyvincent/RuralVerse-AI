from typing import Optional, Tuple, List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.user import User
from app.schemas.user import UserUpdateRequest, AdminUserUpdateRequest


def get_user_by_id(db: Session, user_id: int) -> User:
    """Get user by ID or raise 404."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


def list_users(
    db: Session,
    search: Optional[str] = None,
    role: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[User], int]:
    """List users with search, role filter, and pagination."""
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.email.ilike(search_term),
                User.full_name.ilike(search_term),
            )
        )

    total = query.count()

    users = (
        query.order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return users, total


def update_user_profile(db: Session, user: User, data: UserUpdateRequest) -> User:
    """Update own profile."""
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.preferred_language is not None:
        user.preferred_language = data.preferred_language
    if data.grade is not None:
        user.grade = data.grade

    db.commit()
    db.refresh(user)
    return user


def admin_update_user(
    db: Session, user_id: int, data: AdminUserUpdateRequest, current_admin: User
) -> User:
    """Admin update of a user's role or status."""
    user = get_user_by_id(db, user_id)

    # Prevent self-deactivation
    if user.id == current_admin.id and data.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )

    # Prevent changing own role from admin
    if user.id == current_admin.id and data.role and data.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own admin role",
        )

    if data.role is not None:
        if data.role not in ("admin", "teacher", "student"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role",
            )
        user.role = data.role

    if data.is_active is not None:
        user.is_active = data.is_active

    if data.full_name is not None:
        user.full_name = data.full_name

    db.commit()
    db.refresh(user)
    return user


def deactivate_user(db: Session, user_id: int, current_admin: User) -> User:
    """Soft-delete a user (deactivate). Prevent deactivation of last admin."""
    user = get_user_by_id(db, user_id)

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )

    if user.role == "admin":
        admin_count = db.query(User).filter(
            User.role == "admin", User.is_active == True, User.id != user_id
        ).count()
        if admin_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate the last admin account",
            )

    user.is_active = False
    db.commit()
    db.refresh(user)
    return user
