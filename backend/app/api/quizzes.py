from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.schemas.quiz import (
    QuizCreate,
    QuizUpdate,
    QuizResponse,
    QuizDetailResponse,
    QuestionCreate,
    QuestionUpdate,
    QuestionResponse,
    AttemptSubmit,
    AttemptResponse,
)
from app.services import quiz_service
from app.services.audit_service import log_action

router = APIRouter(tags=["Quizzes and Assessments"])


@router.get("/quizzes", response_model=List[QuizResponse])
def list_quizzes(
    course_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """List published quizzes available to students."""
    return quiz_service.get_quizzes(db, course_id=course_id, published_only=True)


@router.get("/admin/quizzes", response_model=List[QuizResponse])
def list_all_quizzes_admin(
    course_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_role(["admin", "teacher"])),
):
    """List all quizzes including unpublished ones (Admin/Teacher)."""
    return quiz_service.get_quizzes(db, course_id=course_id, published_only=False)


@router.get("/quizzes/{quiz_id}", response_model=QuizDetailResponse)
def get_quiz_detail(quiz_id: int, db: Session = Depends(get_db)):
    """Fetch quiz details and all associated questions."""
    return quiz_service.get_quiz_by_id(db, quiz_id)


@router.post("/admin/quizzes", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
def create_quiz(
    data: QuizCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(["admin", "teacher"])),
):
    """Create a new quiz (Admin and Teacher)."""
    quiz = quiz_service.create_quiz(db, data, creator_id=user.id)
    log_action(db, actor_id=user.id, action="CREATE_QUIZ", target_type="quiz", target_id=quiz.id)
    return quiz


@router.patch("/admin/quizzes/{quiz_id}", response_model=QuizResponse)
def update_quiz(
    quiz_id: int,
    data: QuizUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(["admin", "teacher"])),
):
    """Update quiz configuration or publication status."""
    quiz = quiz_service.update_quiz(db, quiz_id, data)
    log_action(db, actor_id=user.id, action="UPDATE_QUIZ", target_type="quiz", target_id=quiz.id)
    return quiz


@router.post("/admin/quizzes/{quiz_id}/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def add_question(
    quiz_id: int,
    data: QuestionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(["admin", "teacher"])),
):
    """Add a question to a quiz."""
    q = quiz_service.add_question(db, quiz_id, data)
    log_action(db, actor_id=user.id, action="ADD_QUESTION", target_type="question", target_id=q.id)
    return q


@router.patch("/admin/questions/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: int,
    data: QuestionUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(["admin", "teacher"])),
):
    """Update question text, points, or options."""
    q = quiz_service.update_question(db, question_id, data)
    return q


@router.delete("/admin/questions/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(["admin", "teacher"])),
):
    """Remove a question from a quiz."""
    quiz_service.delete_question(db, question_id)
    return {"message": "Question deleted successfully"}


@router.post("/quizzes/{quiz_id}/attempts", response_model=AttemptResponse)
def start_attempt(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_student: User = Depends(require_role(["student", "teacher", "admin"])),
):
    """Start a quiz attempt for the authenticated user."""
    return quiz_service.start_quiz_attempt(db, quiz_id=quiz_id, student_id=current_student.id)


@router.post("/quizzes/{quiz_id}/attempts/{attempt_id}/submit", response_model=AttemptResponse)
def submit_attempt(
    quiz_id: int,
    attempt_id: int,
    data: AttemptSubmit,
    db: Session = Depends(get_db),
    current_student: User = Depends(require_role(["student", "teacher", "admin"])),
):
    """Submit answers for evaluation and record score."""
    attempt = quiz_service.submit_quiz_attempt(
        db,
        quiz_id=quiz_id,
        attempt_id=attempt_id,
        student_id=current_student.id,
        data=data,
    )
    return attempt


@router.get("/student/quiz-attempts", response_model=List[AttemptResponse])
def get_my_quiz_attempts(
    db: Session = Depends(get_db),
    current_student: User = Depends(require_role(["student", "teacher", "admin"])),
):
    """Retrieve history of quiz attempts for the logged in student."""
    return quiz_service.get_student_attempts(db, current_student.id)
