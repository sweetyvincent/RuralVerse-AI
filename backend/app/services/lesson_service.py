import os
import shutil
from typing import List, Optional
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.course import Subject, Course
from app.models.lesson import Lesson, LessonTranslation, LearningResource, Document
from app.schemas.course import SubjectCreate, SubjectUpdate, CourseCreate, CourseUpdate
from app.schemas.lesson import LessonCreate, LessonUpdate


# --- Subjects ---
def get_subjects(db: Session, active_only: bool = True) -> List[Subject]:
    query = db.query(Subject)
    if active_only:
        query = query.filter(Subject.is_active == True)
    return query.order_by(Subject.name).all()


def get_subject_by_id(db: Session, subject_id: int) -> Subject:
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    return subject


def create_subject(db: Session, data: SubjectCreate) -> Subject:
    subject = Subject(
        name=data.name,
        description=data.description,
        icon=data.icon,
        is_active=data.is_active,
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def update_subject(db: Session, subject_id: int, data: SubjectUpdate) -> Subject:
    subject = get_subject_by_id(db, subject_id)
    if data.name is not None:
        subject.name = data.name
    if data.description is not None:
        subject.description = data.description
    if data.icon is not None:
        subject.icon = data.icon
    if data.is_active is not None:
        subject.is_active = data.is_active
    db.commit()
    db.refresh(subject)
    return subject


# --- Courses ---
def get_courses(db: Session, subject_id: Optional[int] = None, published_only: bool = True) -> List[Course]:
    query = db.query(Course)
    if subject_id:
        query = query.filter(Course.subject_id == subject_id)
    if published_only:
        query = query.filter(Course.is_published == True)
    return query.order_by(Course.created_at.desc()).all()


def get_course_by_id(db: Session, course_id: int) -> Course:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


def create_course(db: Session, data: CourseCreate) -> Course:
    # verify subject exists
    get_subject_by_id(db, data.subject_id)
    course = Course(
        subject_id=data.subject_id,
        title=data.title,
        description=data.description,
        grade_level=data.grade_level,
        is_published=data.is_published,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def update_course(db: Session, course_id: int, data: CourseUpdate) -> Course:
    course = get_course_by_id(db, course_id)
    if data.title is not None:
        course.title = data.title
    if data.description is not None:
        course.description = data.description
    if data.grade_level is not None:
        course.grade_level = data.grade_level
    if data.is_published is not None:
        course.is_published = data.is_published
    db.commit()
    db.refresh(course)
    return course


# --- Lessons ---
def get_lessons(
    db: Session,
    course_id: Optional[int] = None,
    language: Optional[str] = None,
    published_only: bool = True,
) -> List[Lesson]:
    query = db.query(Lesson)
    if course_id:
        query = query.filter(Lesson.course_id == course_id)
    if language:
        query = query.filter(Lesson.language == language)
    if published_only:
        query = query.filter(Lesson.is_published == True)
    return query.order_by(Lesson.order, Lesson.id).all()


def get_lesson_by_id(db: Session, lesson_id: int) -> Lesson:
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return lesson


def create_lesson(db: Session, data: LessonCreate) -> Lesson:
    get_course_by_id(db, data.course_id)
    lesson = Lesson(
        course_id=data.course_id,
        title=data.title,
        content=data.content,
        order=data.order,
        duration_minutes=data.duration_minutes,
        is_published=data.is_published,
        language=data.language,
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


def update_lesson(db: Session, lesson_id: int, data: LessonUpdate) -> Lesson:
    lesson = get_lesson_by_id(db, lesson_id)
    if data.title is not None:
        lesson.title = data.title
    if data.content is not None:
        lesson.content = data.content
    if data.order is not None:
        lesson.order = data.order
    if data.duration_minutes is not None:
        lesson.duration_minutes = data.duration_minutes
    if data.is_published is not None:
        lesson.is_published = data.is_published
    if data.language is not None:
        lesson.language = data.language
    db.commit()
    db.refresh(lesson)
    return lesson


def delete_lesson(db: Session, lesson_id: int) -> None:
    lesson = get_lesson_by_id(db, lesson_id)
    db.delete(lesson)
    db.commit()


# --- Resources ---
def save_lesson_resource(db: Session, lesson_id: int, file: UploadFile) -> LearningResource:
    get_lesson_by_id(db, lesson_id)
    upload_dir = os.path.join(settings.UPLOAD_DIR, "lessons", str(lesson_id))
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = os.path.getsize(file_path)
    file_type = file.content_type or os.path.splitext(file.filename)[1]
    
    resource = LearningResource(
        lesson_id=lesson_id,
        file_name=file.filename,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource
