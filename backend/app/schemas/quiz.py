from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime


# ---- Quiz schemas ----
class QuizCreate(BaseModel):
    course_id: int
    lesson_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    time_limit_minutes: Optional[int] = None
    passing_score: float = 60.0
    is_published: bool = False


class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    time_limit_minutes: Optional[int] = None
    passing_score: Optional[float] = None
    is_published: Optional[bool] = None


class QuizResponse(BaseModel):
    id: int
    course_id: int
    lesson_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    time_limit_minutes: Optional[int] = None
    passing_score: float
    is_published: bool
    created_by: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ---- Question schemas ----
class OptionCreate(BaseModel):
    option_text: str
    is_correct: bool = False


class OptionResponse(BaseModel):
    id: int
    question_id: int
    option_text: str
    is_correct: bool

    model_config = {"from_attributes": True}


class QuestionCreate(BaseModel):
    question_text: str
    question_type: str = "multiple_choice"
    points: float = 1.0
    order: int = 0
    explanation: Optional[str] = None
    options: List[OptionCreate] = []

    @field_validator("question_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in ("multiple_choice", "short_answer"):
            raise ValueError("question_type must be 'multiple_choice' or 'short_answer'")
        return v


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    question_type: Optional[str] = None
    points: Optional[float] = None
    order: Optional[int] = None
    explanation: Optional[str] = None
    options: Optional[List[OptionCreate]] = None


class QuestionResponse(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    question_type: str
    points: float
    order: int
    explanation: Optional[str] = None
    options: List[OptionResponse] = []

    model_config = {"from_attributes": True}


class QuizDetailResponse(QuizResponse):
    questions: List[QuestionResponse] = []


# ---- Attempt schemas ----
class AnswerSubmit(BaseModel):
    question_id: int
    selected_option_id: Optional[int] = None
    answer_text: Optional[str] = None


class AttemptSubmit(BaseModel):
    answers: List[AnswerSubmit]


class AnswerResponse(BaseModel):
    id: int
    question_id: int
    selected_option_id: Optional[int] = None
    answer_text: Optional[str] = None
    is_correct: Optional[bool] = None
    points_earned: float

    model_config = {"from_attributes": True}


class AttemptResponse(BaseModel):
    id: int
    quiz_id: int
    student_id: int
    score: Optional[float] = None
    total_points: Optional[float] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    answers: List[AnswerResponse] = []

    model_config = {"from_attributes": True}
