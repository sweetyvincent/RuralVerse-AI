from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User
from app.models.analytics import StudentProgress, LearningRecommendation
from app.schemas.analytics import StudentDashboard, ProgressRecord, RecommendationResponse
from app.services import analytics_service

router = APIRouter(prefix="/student", tags=["Student Features"])


@router.get("/dashboard", response_model=StudentDashboard)
def get_dashboard(
    db: Session = Depends(get_db),
    current_student: User = Depends(require_role(["student", "teacher", "admin"])),
):
    """Fetch personalized student dashboard metrics backed by real database records."""
    return analytics_service.get_student_dashboard(db, student_id=current_student.id)


@router.get("/progress", response_model=List[ProgressRecord])
def get_progress_history(
    activity_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_student: User = Depends(require_role(["student", "teacher", "admin"])),
):
    """Retrieve history of learning progress records."""
    query = db.query(StudentProgress).filter(StudentProgress.student_id == current_student.id)
    if activity_type:
        query = query.filter(StudentProgress.activity_type == activity_type)
    return query.order_by(StudentProgress.created_at.desc()).all()


@router.get("/recommendations", response_model=List[RecommendationResponse])
def get_recommendations(
    db: Session = Depends(get_db),
    current_student: User = Depends(require_role(["student", "teacher", "admin"])),
):
    """Retrieve personalized learning recommendations."""
    return (
        db.query(LearningRecommendation)
        .filter(LearningRecommendation.student_id == current_student.id)
        .order_by(LearningRecommendation.created_at.desc())
        .all()
    )
