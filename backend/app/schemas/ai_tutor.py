from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import json


class ChatMessage(BaseModel):
    message: str
    language: Optional[str] = "en"
    context: Optional[str] = None  # optional lesson/subject context


class ChatResponse(BaseModel):
    response: str
    sources: List[str] = []


class AITutorConfigUpdate(BaseModel):
    provider: Optional[str] = None
    model_name: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    system_instructions: Optional[str] = None
    supported_languages: Optional[List[str]] = None


class AITutorConfigResponse(BaseModel):
    id: int
    provider: str
    model_name: str
    temperature: float
    max_tokens: int
    system_instructions: str
    supported_languages: List[str] = []
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_db(cls, config):
        langs = json.loads(config.supported_languages) if config.supported_languages else []
        return cls(
            id=config.id,
            provider=config.provider,
            model_name=config.model_name,
            temperature=config.temperature,
            max_tokens=config.max_tokens,
            system_instructions=config.system_instructions,
            supported_languages=langs,
            updated_at=config.updated_at,
        )


class AIUsageLogResponse(BaseModel):
    id: int
    user_id: int
    prompt_tokens: int
    completion_tokens: int
    model_name: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
