import json
from typing import List, Optional
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.air_writing import AirWritingSession, AirWritingConfig
from app.schemas.air_writing import AirWritingSessionCreate, AirWritingConfigUpdate


def get_or_create_config(db: Session) -> AirWritingConfig:
    config = db.query(AirWritingConfig).first()
    if not config:
        config = AirWritingConfig(
            is_enabled=True,
            available_colors=json.dumps(["#00E5FF", "#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#FFFFFF"]),
            available_brush_sizes=json.dumps([2, 4, 8, 12, 16]),
            updated_at=datetime.utcnow(),
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


def update_config(db: Session, data: AirWritingConfigUpdate) -> AirWritingConfig:
    config = get_or_create_config(db)
    if data.is_enabled is not None:
        config.is_enabled = data.is_enabled
    if data.available_colors is not None:
        config.available_colors = json.dumps(data.available_colors)
    if data.available_brush_sizes is not None:
        config.available_brush_sizes = json.dumps(data.available_brush_sizes)
    config.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(config)
    return config


def record_session(db: Session, student_id: int, data: AirWritingSessionCreate) -> AirWritingSession:
    session = AirWritingSession(
        student_id=student_id,
        mode=data.mode,
        duration_seconds=data.duration_seconds,
        drawing_data_path=data.drawing_data_path,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_student_sessions(db: Session, student_id: int) -> List[AirWritingSession]:
    return (
        db.query(AirWritingSession)
        .filter(AirWritingSession.student_id == student_id)
        .order_by(AirWritingSession.created_at.desc())
        .all()
    )
