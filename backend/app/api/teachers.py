from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User
from app.models.quiz import QuizAttempt
from app.models.analytics import SchoolClass, ClassEnrollment, TeacherClassAssignment, StudentProgress

router = APIRouter(prefix="/teacher", tags=["Teacher Portal"], dependencies=[Depends(require_role(["teacher", "admin"]))])


@router.get("/classes")
def get_teacher_classes(
    db: Session = Depends(get_db),
    current_teacher: User = Depends(require_role(["teacher", "admin"])),
):
    """List classes assigned to the authenticated teacher."""
    if current_teacher.role == "admin":
        classes = db.query(SchoolClass).all()
    else:
        classes = (
            db.query(SchoolClass)
            .join(TeacherClassAssignment, TeacherClassAssignment.class_id == SchoolClass.id)
            .filter(TeacherClassAssignment.teacher_id == current_teacher.id)
            .all()
        )
    return [
        {
            "id": c.id,
            "name": c.name,
            "grade": c.grade,
            "student_count": db.query(ClassEnrollment).filter(ClassEnrollment.class_id == c.id).count(),
        }
        for c in classes
    ]


@router.get("/classes/{class_id}/students")
def get_class_students(
    class_id: int,
    db: Session = Depends(get_db),
    current_teacher: User = Depends(require_role(["teacher", "admin"])),
):
    """List enrolled students in a class."""
    enrollments = (
        db.query(ClassEnrollment, User)
        .join(User, ClassEnrollment.student_id == User.id)
        .filter(ClassEnrollment.class_id == class_id)
        .all()
    )
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "preferred_language": u.preferred_language,
            "grade": u.grade,
            "enrolled_at": e.enrolled_at.isoformat() if e.enrolled_at else None,
        }
        for e, u in enrollments
    ]


@router.get("/classes/{class_id}/analytics")
def get_class_analytics(
    class_id: int,
    db: Session = Depends(get_db),
    current_teacher: User = Depends(require_role(["teacher", "admin"])),
):
    """Aggregate genuine assessment scores and completion metrics for a class."""
    student_ids = [
        row[0]
        for row in db.query(ClassEnrollment.student_id).filter(ClassEnrollment.class_id == class_id).all()
    ]

    if not student_ids:
        return {
            "total_students": 0,
            "total_attempts": 0,
            "average_score": 0.0,
            "weak_topics": [],
        }

    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.student_id.in_(student_ids), QuizAttempt.completed_at != None)
        .all()
    )
    total_attempts = len(attempts)
    avg_score = sum([a.score for a in attempts]) / total_attempts if total_attempts > 0 else 0.0

    return {
        "total_students": len(student_ids),
        "total_attempts": total_attempts,
        "average_score": round(float(avg_score), 2),
        "weak_topics": [],
    }
