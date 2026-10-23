from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ---- Subject schemas ----
class SubjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    is_active: bool = True


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None


class SubjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ---- Course schemas ----
class CourseCreate(BaseModel):
    subject_id: int
    title: str
    description: Optional[str] = None
    grade_level: Optional[str] = None
    is_published: bool = False


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    grade_level: Optional[str] = None
    is_published: Optional[bool] = None


class CourseResponse(BaseModel):
    id: int
    subject_id: int
    title: str
    description: Optional[str] = None
    grade_level: Optional[str] = None
    is_published: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CourseDetailResponse(CourseResponse):
    subject: Optional[SubjectResponse] = None
    lessons: List["LessonResponse"] = []


# Forward reference resolved below
from app.schemas.lesson import LessonResponse  # noqa: E402

CourseDetailResponse.model_rebuild()
