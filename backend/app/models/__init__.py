# Models package - import all models for SQLAlchemy to discover
from app.models.user import User
from app.models.course import Subject, Course
from app.models.lesson import Lesson, LessonTranslation, LearningResource, Document, DocumentChunk
from app.models.quiz import Quiz, Question, QuestionOption, QuizAttempt, QuizAnswer
from app.models.experiment import Experiment, ExperimentAsset, ExperimentSession
from app.models.air_writing import AirWritingSession, AirWritingConfig
from app.models.ai_tutor import AIUsageLog, AITutorConfig
from app.models.analytics import (
    StudentProgress, LearningRecommendation, SchoolClass,
    ClassEnrollment, TeacherClassAssignment, Notification, PlatformSetting,
)
from app.models.audit import AuditLog

__all__ = [
    "User", "Subject", "Course", "Lesson", "LessonTranslation",
    "LearningResource", "Document", "DocumentChunk", "Quiz", "Question",
    "QuestionOption", "QuizAttempt", "QuizAnswer", "Experiment",
    "ExperimentAsset", "ExperimentSession", "AirWritingSession",
    "AirWritingConfig", "AIUsageLog", "AITutorConfig", "StudentProgress",
    "LearningRecommendation", "SchoolClass", "ClassEnrollment",
    "TeacherClassAssignment", "Notification", "PlatformSetting", "AuditLog",
]
