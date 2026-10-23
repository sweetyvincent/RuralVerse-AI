from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ExperimentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    experiment_type: Optional[str] = None
    instructions: Optional[str] = None
    safety_notes: Optional[str] = None
    grade_level: Optional[str] = None
    is_published: bool = False
    model_config_json: Optional[str] = None


class ExperimentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    experiment_type: Optional[str] = None
    instructions: Optional[str] = None
    safety_notes: Optional[str] = None
    grade_level: Optional[str] = None
    is_published: Optional[bool] = None
    model_config_json: Optional[str] = None


class ExperimentAssetResponse(BaseModel):
    id: int
    experiment_id: int
    asset_name: str
    asset_path: str
    asset_type: Optional[str] = None

    model_config = {"from_attributes": True}


class ExperimentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    experiment_type: Optional[str] = None
    instructions: Optional[str] = None
    safety_notes: Optional[str] = None
    grade_level: Optional[str] = None
    is_published: bool
    model_config_json: Optional[str] = None
    created_at: Optional[datetime] = None
    assets: List[ExperimentAssetResponse] = []

    model_config = {"from_attributes": True}


class ExperimentSessionCreate(BaseModel):
    pass  # No extra fields needed, experiment_id comes from URL


class ExperimentSessionResponse(BaseModel):
    id: int
    experiment_id: int
    student_id: int
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ExperimentSessionUpdate(BaseModel):
    status: str = "completed"
