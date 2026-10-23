from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User
from app.schemas.air_writing import (
    AirWritingSessionCreate,
    AirWritingSessionResponse,
    AirWritingConfigResponse,
    AirWritingConfigUpdate,
)
from app.services import air_writing_service
from app.services.audit_service import log_action

router = APIRouter(prefix="/air-writing", tags=["Air-Writing Studio"])


@router.get("/config", response_model=AirWritingConfigResponse)
def get_air_writing_config(db: Session = Depends(get_db)):
    """Retrieve global air-writing studio settings and palette."""
    cfg = air_writing_service.get_or_create_config(db)
    return AirWritingConfigResponse.from_db(cfg)


@router.patch("/admin/config", response_model=AirWritingConfigResponse)
def update_air_writing_config(
    data: AirWritingConfigUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"])),
):
    """Update air-writing studio settings (Admin only)."""
    cfg = air_writing_service.update_config(db, data)
    log_action(db, actor_id=admin.id, action="UPDATE_AIR_WRITING_CONFIG", target_type="air_writing_config")
    return AirWritingConfigResponse.from_db(cfg)


@router.post("/sessions", response_model=AirWritingSessionResponse, status_code=status.HTTP_201_CREATED)
def record_air_writing_session(
    data: AirWritingSessionCreate,
    db: Session = Depends(get_db),
    current_student: User = Depends(require_role(["student", "teacher", "admin"])),
):
    """Save an air-writing practice session record."""
    return air_writing_service.record_session(db, student_id=current_student.id, data=data)


@router.get("/student/sessions", response_model=List[AirWritingSessionResponse])
def get_student_air_writing_sessions(
    db: Session = Depends(get_db),
    current_student: User = Depends(require_role(["student", "teacher", "admin"])),
):
    """Retrieve air-writing activity history for the current student."""
    return air_writing_service.get_student_sessions(db, student_id=current_student.id)
