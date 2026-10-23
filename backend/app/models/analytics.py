from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class StudentProgress(Base):
    __tablename__ = "student_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=True)
    experiment_id = Column(Integer, ForeignKey("experiments.id"), nullable=True)
    activity_type = Column(String, nullable=False)  # lesson, quiz, experiment
    status = Column(String, default="in_progress")  # in_progress, completed
    score = Column(Float, nullable=True)
    time_spent_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    student = relationship("User", back_populates="progress_records")
    lesson = relationship("Lesson", back_populates="progress_records")
    quiz = relationship("Quiz")
    experiment = relationship("Experiment")


class LearningRecommendation(Base):
    __tablename__ = "learning_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recommendation_text = Column(Text, nullable=False)
    subject = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, viewed, completed
    created_at = Column(DateTime, server_default=func.now())

    student = relationship("User", back_populates="recommendations")


class SchoolClass(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    grade = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    enrollments = relationship("ClassEnrollment", back_populates="school_class")
    teacher_assignments = relationship("TeacherClassAssignment", back_populates="school_class")


class ClassEnrollment(Base):
    __tablename__ = "class_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    enrolled_at = Column(DateTime, server_default=func.now())

    school_class = relationship("SchoolClass", back_populates="enrollments")
    student = relationship("User", back_populates="class_enrollments")


class TeacherClassAssignment(Base):
    __tablename__ = "teacher_class_assignments"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)

    teacher = relationship("User", back_populates="teacher_assignments")
    school_class = relationship("SchoolClass", back_populates="teacher_assignments")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="notifications")


class PlatformSetting(Base):
    __tablename__ = "platform_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
