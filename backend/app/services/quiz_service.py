from typing import List, Optional
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.quiz import Quiz, Question, QuestionOption, QuizAttempt, QuizAnswer
from app.schemas.quiz import QuizCreate, QuizUpdate, QuestionCreate, QuestionUpdate, AttemptSubmit


def get_quizzes(db: Session, course_id: Optional[int] = None, published_only: bool = True) -> List[Quiz]:
    query = db.query(Quiz)
    if course_id:
        query = query.filter(Quiz.course_id == course_id)
    if published_only:
        query = query.filter(Quiz.is_published == True)
    return query.order_by(Quiz.created_at.desc()).all()


def get_quiz_by_id(db: Session, quiz_id: int) -> Quiz:
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return quiz


def create_quiz(db: Session, data: QuizCreate, creator_id: int) -> Quiz:
    quiz = Quiz(
        course_id=data.course_id,
        lesson_id=data.lesson_id,
        title=data.title,
        description=data.description,
        time_limit_minutes=data.time_limit_minutes,
        passing_score=data.passing_score,
        is_published=data.is_published,
        created_by=creator_id,
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


def update_quiz(db: Session, quiz_id: int, data: QuizUpdate) -> Quiz:
    quiz = get_quiz_by_id(db, quiz_id)
    if data.title is not None:
        quiz.title = data.title
    if data.description is not None:
        quiz.description = data.description
    if data.time_limit_minutes is not None:
        quiz.time_limit_minutes = data.time_limit_minutes
    if data.passing_score is not None:
        quiz.passing_score = data.passing_score
    if data.is_published is not None:
        quiz.is_published = data.is_published
    db.commit()
    db.refresh(quiz)
    return quiz


def add_question(db: Session, quiz_id: int, data: QuestionCreate) -> Question:
    get_quiz_by_id(db, quiz_id)
    question = Question(
        quiz_id=quiz_id,
        question_text=data.question_text,
        question_type=data.question_type,
        points=data.points,
        order=data.order,
        explanation=data.explanation,
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    if data.options:
        for opt in data.options:
            option = QuestionOption(
                question_id=question.id,
                option_text=opt.option_text,
                is_correct=opt.is_correct,
            )
            db.add(option)
        db.commit()
        db.refresh(question)

    return question


def update_question(db: Session, question_id: int, data: QuestionUpdate) -> Question:
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    if data.question_text is not None:
        q.question_text = data.question_text
    if data.question_type is not None:
        q.question_type = data.question_type
    if data.points is not None:
        q.points = data.points
    if data.order is not None:
        q.order = data.order
    if data.explanation is not None:
        q.explanation = data.explanation
    db.commit()
    db.refresh(q)
    return q


def delete_question(db: Session, question_id: int) -> None:
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    db.delete(q)
    db.commit()


def start_quiz_attempt(db: Session, quiz_id: int, student_id: int) -> QuizAttempt:
    get_quiz_by_id(db, quiz_id)
    attempt = QuizAttempt(
        quiz_id=quiz_id,
        student_id=student_id,
        score=0.0,
        total_points=0.0,
        started_at=datetime.utcnow(),
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


def submit_quiz_attempt(
    db: Session,
    quiz_id: int,
    attempt_id: int,
    student_id: int,
    data: AttemptSubmit,
) -> QuizAttempt:
    attempt = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.id == attempt_id, QuizAttempt.student_id == student_id, QuizAttempt.quiz_id == quiz_id)
        .first()
    )
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz attempt not found")
    if attempt.completed_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Attempt already completed")

    quiz = get_quiz_by_id(db, quiz_id)
    total_score = 0.0
    total_possible = 0.0

    # Auto-grading based on actual question configurations
    for question in quiz.questions:
        total_possible += question.points
        user_answer = next((a for a in data.answers if a.question_id == question.id), None)
        
        is_correct = False
        points_earned = 0.0
        selected_option_id = None
        answer_text = None

        if user_answer:
            selected_option_id = user_answer.selected_option_id
            answer_text = user_answer.answer_text

            if question.question_type == "multiple_choice":
                correct_opt = next((opt for opt in question.options if opt.is_correct), None)
                if correct_opt and selected_option_id == correct_opt.id:
                    is_correct = True
                    points_earned = float(question.points)
            elif question.question_type == "short_answer":
                # Check against explanation or options if any
                correct_texts = [opt.option_text.strip().lower() for opt in question.options if opt.is_correct]
                if answer_text and answer_text.strip().lower() in correct_texts:
                    is_correct = True
                    points_earned = float(question.points)

        total_score += points_earned

        answer_record = QuizAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            selected_option_id=selected_option_id,
            answer_text=answer_text,
            is_correct=is_correct,
            points_earned=points_earned,
        )
        db.add(answer_record)

    attempt.score = total_score
    attempt.total_points = total_possible if total_possible > 0 else 100.0
    attempt.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(attempt)
    return attempt


def get_student_attempts(db: Session, student_id: int) -> List[QuizAttempt]:
    return (
        db.query(QuizAttempt)
        .filter(QuizAttempt.student_id == student_id)
        .order_by(QuizAttempt.started_at.desc())
        .all()
    )
