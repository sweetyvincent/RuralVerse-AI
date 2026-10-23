from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="student")  # admin, teacher, student
    preferred_language = Column(String, default="en")
    grade = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    must_change_password = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    quiz_attempts = relationship("QuizAttempt", back_populates="student", foreign_keys="QuizAttempt.student_id")
    experiment_sessions = relationship("ExperimentSession", back_populates="student")
    air_writing_sessions = relationship("AirWritingSession", back_populates="student")
    progress_records = relationship("StudentProgress", back_populates="student")
    recommendations = relationship("LearningRecommendation", back_populates="student")
    notifications = relationship("Notification", back_populates="user")
    documents = relationship("Document", back_populates="uploader")
    ai_usage_logs = relationship("AIUsageLog", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="actor")
    created_quizzes = relationship("Quiz", back_populates="creator", foreign_keys="Quiz.created_by")
    class_enrollments = relationship("ClassEnrollment", back_populates="student")
    teacher_assignments = relationship("TeacherClassAssignment", back_populates="teacher")
