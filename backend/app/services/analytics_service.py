from typing import Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User
from app.models.course import Subject, Course
from app.models.lesson import Lesson
from app.models.quiz import Quiz, QuizAttempt
from app.models.experiment import Experiment, ExperimentSession
from app.models.air_writing import AirWritingSession
from app.models.ai_tutor import AIUsageLog
from app.models.analytics import StudentProgress, LearningRecommendation
from app.schemas.analytics import AdminOverview, PlatformAnalytics, StudentDashboard, SyncEventsRequest


def get_admin_overview(db: Session) -> AdminOverview:
    """Return genuine database-backed counts for all primary entities."""
    total_users = db.query(User).count()
    total_students = db.query(User).filter(User.role == "student").count()
    total_teachers = db.query(User).filter(User.role == "teacher").count()
    total_admins = db.query(User).filter(User.role == "admin").count()

    total_subjects = db.query(Subject).count()
    total_courses = db.query(Course).count()
    total_lessons = db.query(Lesson).count()
    total_quizzes = db.query(Quiz).count()
    total_experiments = db.query(Experiment).count()

    recent_users_records = db.query(User).order_by(User.created_at.desc()).limit(5).all()
    recent_users = [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in recent_users_records
    ]

    return AdminOverview(
        total_users=total_users,
        total_students=total_students,
        total_teachers=total_teachers,
        total_admins=total_admins,
        total_subjects=total_subjects,
        total_courses=total_courses,
        total_lessons=total_lessons,
        total_quizzes=total_quizzes,
        total_experiments=total_experiments,
        recent_users=recent_users,
    )


def get_platform_analytics(db: Session) -> PlatformAnalytics:
    """Detailed analytics computed purely from real activity records."""
    total_quiz_attempts = db.query(QuizAttempt).filter(QuizAttempt.completed_at != None).count()
    avg_score = db.query(func.avg(QuizAttempt.score)).filter(QuizAttempt.completed_at != None).scalar() or 0.0
    total_experiments = db.query(ExperimentSession).filter(ExperimentSession.status == "completed").count()
    total_ai = db.query(AIUsageLog).count()
    total_air_writing = db.query(AirWritingSession).count()
    active_students = db.query(StudentProgress.student_id).distinct().count()

    # Activity breakdown
    activity_counts = (
        db.query(StudentProgress.activity_type, func.count(StudentProgress.id))
        .group_by(StudentProgress.activity_type)
        .all()
    )
    progress_by_activity = {act: cnt for act, cnt in activity_counts}

    return PlatformAnalytics(
        total_quiz_attempts=total_quiz_attempts,
        average_quiz_score=round(float(avg_score), 2),
        total_experiment_sessions=total_experiments,
        total_ai_chats=total_ai,
        total_air_writing_sessions=total_air_writing,
        active_students_count=active_students,
        progress_by_activity=progress_by_activity,
    )


def get_student_dashboard(db: Session, student_id: int) -> StudentDashboard:
    """Return genuine individual student progress metrics."""
    completed_lessons = (
        db.query(StudentProgress)
        .filter(
            StudentProgress.student_id == student_id,
            StudentProgress.activity_type == "lesson",
            StudentProgress.status == "completed",
        )
        .count()
    )

    completed_experiments = (
        db.query(ExperimentSession)
        .filter(ExperimentSession.student_id == student_id, ExperimentSession.status == "completed")
        .count()
    )

    quiz_attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.student_id == student_id, QuizAttempt.completed_at != None)
        .all()
    )
    total_quizzes = len(quiz_attempts)
    avg_score = (
        sum([a.score for a in quiz_attempts]) / total_quizzes
        if total_quizzes > 0
        else 0.0
    )

    total_time = (
        db.query(func.sum(StudentProgress.time_spent_seconds))
        .filter(StudentProgress.student_id == student_id)
        .scalar()
        or 0
    )

    recent_records = (
        db.query(StudentProgress)
        .filter(StudentProgress.student_id == student_id)
        .order_by(StudentProgress.created_at.desc())
        .limit(5)
        .all()
    )

    return StudentDashboard(
        total_lessons_completed=completed_lessons,
        total_quizzes_taken=total_quizzes,
        total_experiments_completed=completed_experiments,
        average_quiz_score=round(float(avg_score), 2),
        total_time_spent_seconds=int(total_time),
        recent_activity=recent_records,
    )


def record_progress(
    db: Session,
    student_id: int,
    activity_type: str,
    status: str,
    lesson_id: int = None,
    quiz_id: int = None,
    experiment_id: int = None,
    score: float = None,
    time_spent_seconds: int = 0,
) -> StudentProgress:
    """Record learning activity event."""
    progress = StudentProgress(
        student_id=student_id,
        activity_type=activity_type,
        status=status,
        lesson_id=lesson_id,
        quiz_id=quiz_id,
        experiment_id=experiment_id,
        score=score,
        time_spent_seconds=time_spent_seconds,
    )
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return progress


def sync_offline_events(db: Session, student_id: int, request: SyncEventsRequest) -> Dict[str, Any]:
    """Process offline queued events and record them in the primary database."""
    synced_count = 0
    errors = []

    for event in request.events:
        try:
            data = event.data
            record_progress(
                db=db,
                student_id=student_id,
                activity_type=event.event_type,
                status=data.get("status", "completed"),
                lesson_id=data.get("lesson_id"),
                quiz_id=data.get("quiz_id"),
                experiment_id=data.get("experiment_id"),
                score=data.get("score"),
                time_spent_seconds=data.get("time_spent_seconds", 0),
            )
            synced_count += 1
        except Exception as e:
            errors.append(f"Failed to sync event {event.event_type}: {str(e)}")

    return {
        "synced_count": synced_count,
        "total_received": len(request.events),
        "errors": errors,
    }
