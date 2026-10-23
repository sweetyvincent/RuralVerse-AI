from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.course import Subject, Course
from app.models.lesson import Lesson, LearningResource
from app.schemas.course import SubjectCreate, SubjectResponse, CourseCreate, CourseResponse, CourseDetailResponse
from app.schemas.lesson import LessonCreate, LessonUpdate, LessonResponse, LessonDetailResponse, ResourceResponse
from app.services import lesson_service
from app.services.audit_service import log_action

router = APIRouter(tags=["Courses and Lessons"])


# --- Subjects ---
@router.get("/subjects", response_model=List[SubjectResponse])
def get_all_subjects(db: Session = Depends(get_db)):
    """List all active academic subjects."""
    return lesson_service.get_subjects(db, active_only=True)


@router.post("/admin/subjects", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    data: SubjectCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"])),
):
    """Create a new subject (Admin only)."""
    sub = lesson_service.create_subject(db, data)
    log_action(db, actor_id=admin.id, action="CREATE_SUBJECT", target_type="subject", target_id=sub.id)
    return sub


# --- Courses ---
@router.get("/courses", response_model=List[CourseResponse])
def get_courses(
    subject_id: Optional[int] = Query(None, description="Filter courses by subject"),
    db: Session = Depends(get_db),
):
    """List published courses (available to all authenticated users)."""
    return lesson_service.get_courses(db, subject_id=subject_id, published_only=True)


@router.get("/admin/courses", response_model=List[CourseResponse])
def get_all_courses_admin(
    subject_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin", "teacher"])),
):
    """List all courses including drafts (Admin and Teacher)."""
    return lesson_service.get_courses(db, subject_id=subject_id, published_only=False)


@router.get("/courses/{course_id}", response_model=CourseDetailResponse)
def get_course_detail(course_id: int, db: Session = Depends(get_db)):
    """Get single course detail with associated lessons."""
    return lesson_service.get_course_by_id(db, course_id)


@router.post("/admin/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    data: CourseCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"])),
):
    """Create a new course (Admin only)."""
    course = lesson_service.create_course(db, data)
    log_action(db, actor_id=admin.id, action="CREATE_COURSE", target_type="course", target_id=course.id)
    return course


# --- Lessons ---
@router.get("/lessons", response_model=List[LessonResponse])
def list_lessons(
    course_id: Optional[int] = Query(None),
    language: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List published lessons."""
    return lesson_service.get_lessons(db, course_id=course_id, language=language, published_only=True)


@router.get("/admin/lessons", response_model=List[LessonResponse])
def list_all_lessons_admin(
    course_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_role(["admin", "teacher"])),
):
    """List all lessons including drafts."""
    return lesson_service.get_lessons(db, course_id=course_id, published_only=False)


@router.get("/lessons/{lesson_id}", response_model=LessonDetailResponse)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    """Get single lesson detail with resources and translations."""
    return lesson_service.get_lesson_by_id(db, lesson_id)


@router.post("/admin/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
def create_lesson(
    data: LessonCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin", "teacher"])),
):
    """Create a new lesson."""
    lesson = lesson_service.create_lesson(db, data)
    log_action(db, actor_id=admin.id, action="CREATE_LESSON", target_type="lesson", target_id=lesson.id)
    return lesson


@router.patch("/admin/lessons/{lesson_id}", response_model=LessonResponse)
def update_lesson(
    lesson_id: int,
    data: LessonUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin", "teacher"])),
):
    """Update a lesson."""
    lesson = lesson_service.update_lesson(db, lesson_id, data)
    log_action(db, actor_id=admin.id, action="UPDATE_LESSON", target_type="lesson", target_id=lesson.id)
    return lesson


@router.delete("/admin/lessons/{lesson_id}")
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"])),
):
    """Delete a lesson."""
    lesson_service.delete_lesson(db, lesson_id)
    log_action(db, actor_id=admin.id, action="DELETE_LESSON", target_type="lesson", target_id=lesson_id)
    return {"message": "Lesson deleted successfully"}


@router.post("/admin/lessons/{lesson_id}/resources", response_model=ResourceResponse)
def upload_lesson_resource(
    lesson_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin", "teacher"])),
):
    """Upload a resource file (e.g. PDF, diagram) attached to a lesson."""
    res = lesson_service.save_lesson_resource(db, lesson_id, file)
    log_action(db, actor_id=admin.id, action="UPLOAD_RESOURCE", target_type="resource", target_id=res.id)
    return res


@router.get("/lessons/{lesson_id}/resources", response_model=List[ResourceResponse])
def get_lesson_resources(lesson_id: int, db: Session = Depends(get_db)):
    """List resources attached to a lesson."""
    lesson = lesson_service.get_lesson_by_id(db, lesson_id)
    return lesson.resources
