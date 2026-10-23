from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class AIUsageLog(Base):
    __tablename__ = "ai_usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    model_name = Column(String, nullable=True)
    status = Column(String, default="success")  # success, error
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="ai_usage_logs")


class AITutorConfig(Base):
    __tablename__ = "ai_tutor_config"

    id = Column(Integer, primary_key=True, default=1)
    provider = Column(String, default="gemini")
    model_name = Column(String, default="gemini-1.5-flash")
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=2048)
    system_instructions = Column(
        Text,
        default=(
            "You are RuralVerse AI Tutor, an educational assistant designed for rural students. "
            "Explain concepts simply, use local examples when possible, and be encouraging. "
            "Support multiple languages. Always provide accurate, age-appropriate information."
        ),
    )
    supported_languages = Column(Text, default='["en","hi","ta","te","kn","ml"]')  # JSON
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
