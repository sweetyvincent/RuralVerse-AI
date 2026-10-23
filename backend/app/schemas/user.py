from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserPublic(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    preferred_language: str
    grade: Optional[str] = None
    is_active: bool
    must_change_password: bool = False
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    preferred_language: Optional[str] = None
    grade: Optional[str] = None


UserUpdate = UserUpdateRequest


class AdminUserUpdateRequest(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None
    full_name: Optional[str] = None

    @classmethod
    def validate_role(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ("admin", "teacher", "student"):
            raise ValueError("Role must be 'admin', 'teacher', or 'student'")
        return v


class UserListResponse(BaseModel):
    users: list[UserPublic]
    total: int
    page: int
    page_size: int
