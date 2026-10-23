from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class AirWritingSession(Base):
    __tablename__ = "air_writing_sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mode = Column(String, default="free")  # free, alphabet, math, science
    duration_seconds = Column(Integer, nullable=True)
    drawing_data_path = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    student = relationship("User", back_populates="air_writing_sessions")


class AirWritingConfig(Base):
    __tablename__ = "air_writing_config"

    id = Column(Integer, primary_key=True, default=1)
    is_enabled = Column(Boolean, default=True)
    available_colors = Column(Text, default='["#000000","#FF0000","#0000FF","#00FF00"]')  # JSON
    available_brush_sizes = Column(Text, default='[2,4,6,8]')  # JSON
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
