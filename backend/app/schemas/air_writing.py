from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import json


class AirWritingSessionCreate(BaseModel):
    mode: str = "free"
    duration_seconds: Optional[int] = None
    drawing_data_path: Optional[str] = None


class AirWritingSessionResponse(BaseModel):
    id: int
    student_id: int
    mode: str
    duration_seconds: Optional[int] = None
    drawing_data_path: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AirWritingConfigUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    available_colors: Optional[List[str]] = None
    available_brush_sizes: Optional[List[int]] = None


class AirWritingConfigResponse(BaseModel):
    id: int
    is_enabled: bool
    available_colors: List[str] = []
    available_brush_sizes: List[int] = []
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_db(cls, config):
        """Convert DB model with JSON strings to response."""
        colors = json.loads(config.available_colors) if config.available_colors else []
        sizes = json.loads(config.available_brush_sizes) if config.available_brush_sizes else []
        return cls(
            id=config.id,
            is_enabled=config.is_enabled,
            available_colors=colors,
            available_brush_sizes=sizes,
            updated_at=config.updated_at,
        )
