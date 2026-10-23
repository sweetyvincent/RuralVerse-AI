from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class LessonCreate(BaseModel):
    course_id: int
    title: str
    content: Optional[str] = None
    order: int = 0
    duration_minutes: Optional[int] = None
    is_published: bool = False
    language: str = "en"


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    order: Optional[int] = None
    duration_minutes: Optional[int] = None
    is_published: Optional[bool] = None
    language: Optional[str] = None


class LessonResponse(BaseModel):
    id: int
    course_id: int
    title: str
    content: Optional[str] = None
    order: int
    duration_minutes: Optional[int] = None
    is_published: bool
    language: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class LessonDetailResponse(LessonResponse):
    resources: List["ResourceResponse"] = []
    translations: List["TranslationResponse"] = []


class ResourceResponse(BaseModel):
    id: int
    lesson_id: int
    file_name: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TranslationResponse(BaseModel):
    id: int
    lesson_id: int
    language: str
    title: str
    content: Optional[str] = None

    model_config = {"from_attributes": True}


class DocumentResponse(BaseModel):
    id: int
    title: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    status: str
    uploaded_by: int
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


LessonDetailResponse.model_rebuild()
