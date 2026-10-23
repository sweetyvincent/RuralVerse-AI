from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    subject = Column(String, nullable=True)
    experiment_type = Column(String, nullable=True)  # e.g., physics, chemistry, biology
    instructions = Column(Text, nullable=True)
    safety_notes = Column(Text, nullable=True)
    grade_level = Column(String, nullable=True)
    is_published = Column(Boolean, default=False)
    model_config_json = Column(Text, nullable=True)  # JSON text for 3D model config
    created_at = Column(DateTime, server_default=func.now())

    assets = relationship("ExperimentAsset", back_populates="experiment", cascade="all, delete-orphan")
    sessions = relationship("ExperimentSession", back_populates="experiment")


class ExperimentAsset(Base):
    __tablename__ = "experiment_assets"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(Integer, ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False)
    asset_name = Column(String, nullable=False)
    asset_path = Column(String, nullable=False)
    asset_type = Column(String, nullable=True)

    experiment = relationship("Experiment", back_populates="assets")


class ExperimentSession(Base):
    __tablename__ = "experiment_sessions"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(Integer, ForeignKey("experiments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="started")  # started, completed
    started_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)

    experiment = relationship("Experiment", back_populates="sessions")
    student = relationship("User", back_populates="experiment_sessions")
