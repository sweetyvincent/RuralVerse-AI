from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProgressRecord(BaseModel):
    id: int
    student_id: int
    lesson_id: Optional[int] = None
    quiz_id: Optional[int] = None
    experiment_id: Optional[int] = None
    activity_type: str
    status: str
    score: Optional[float] = None
    time_spent_seconds: int = 0
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class StudentDashboard(BaseModel):
    total_lessons_completed: int = 0
    total_quizzes_taken: int = 0
    total_experiments_completed: int = 0
    average_quiz_score: float = 0.0
    total_time_spent_seconds: int = 0
    recent_activity: List[ProgressRecord] = []


class AdminOverview(BaseModel):
    total_users: int = 0
    total_students: int = 0
    total_teachers: int = 0
    total_admins: int = 0
    total_lessons: int = 0
    total_quizzes: int = 0
    total_experiments: int = 0
    total_courses: int = 0
    total_subjects: int = 0
    recent_users: list = []


class PlatformAnalytics(BaseModel):
    total_quiz_attempts: int = 0
    average_quiz_score: float = 0.0
    total_experiment_sessions: int = 0
    total_ai_chats: int = 0
    total_air_writing_sessions: int = 0
    active_students_count: int = 0
    progress_by_activity: dict = {}


class SyncEvent(BaseModel):
    event_type: str  # lesson_progress, quiz_attempt, experiment_session
    data: dict
    timestamp: Optional[datetime] = None


class SyncEventsRequest(BaseModel):
    events: List[SyncEvent]


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: Optional[str] = None
    is_read: bool
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class RecommendationResponse(BaseModel):
    id: int
    student_id: int
    recommendation_text: str
    subject: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ClassResponse(BaseModel):
    id: int
    name: str
    grade: Optional[str] = None
    created_at: Optional[datetime] = None
    student_count: int = 0

    model_config = {"from_attributes": True}


class ClassAnalytics(BaseModel):
    class_id: int
    class_name: str
    total_students: int = 0
    average_quiz_score: float = 0.0
    lessons_completed: int = 0
    active_students: int = 0


class PlatformSettingResponse(BaseModel):
    id: int
    key: str
    value: Optional[str] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PlatformSettingUpdate(BaseModel):
    key: str
    value: str
