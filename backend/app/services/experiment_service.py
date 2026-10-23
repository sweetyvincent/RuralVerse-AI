from typing import List, Optional
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.experiment import Experiment, ExperimentSession
from app.schemas.experiment import ExperimentCreate, ExperimentUpdate


def get_experiments(
    db: Session,
    subject: Optional[str] = None,
    grade_level: Optional[str] = None,
    published_only: bool = True,
) -> List[Experiment]:
    query = db.query(Experiment)
    if subject:
        query = query.filter(Experiment.subject == subject)
    if grade_level:
        query = query.filter(Experiment.grade_level == grade_level)
    if published_only:
        query = query.filter(Experiment.is_published == True)
    return query.order_by(Experiment.id).all()


def get_experiment_by_id(db: Session, experiment_id: int) -> Experiment:
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiment not found")
    return exp


def create_experiment(db: Session, data: ExperimentCreate) -> Experiment:
    exp = Experiment(
        title=data.title,
        description=data.description,
        subject=data.subject,
        experiment_type=data.experiment_type,
        instructions=data.instructions,
        safety_notes=data.safety_notes,
        grade_level=data.grade_level,
        is_published=data.is_published,
        model_config_json=data.model_config_json,
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


def update_experiment(db: Session, experiment_id: int, data: ExperimentUpdate) -> Experiment:
    exp = get_experiment_by_id(db, experiment_id)
    if data.title is not None:
        exp.title = data.title
    if data.description is not None:
        exp.description = data.description
    if data.subject is not None:
        exp.subject = data.subject
    if data.experiment_type is not None:
        exp.experiment_type = data.experiment_type
    if data.instructions is not None:
        exp.instructions = data.instructions
    if data.safety_notes is not None:
        exp.safety_notes = data.safety_notes
    if data.grade_level is not None:
        exp.grade_level = data.grade_level
    if data.is_published is not None:
        exp.is_published = data.is_published
    if data.model_config_json is not None:
        exp.model_config_json = data.model_config_json
    db.commit()
    db.refresh(exp)
    return exp


def start_experiment_session(db: Session, experiment_id: int, student_id: int) -> ExperimentSession:
    get_experiment_by_id(db, experiment_id)
    session = ExperimentSession(
        experiment_id=experiment_id,
        student_id=student_id,
        status="started",
        started_at=datetime.utcnow(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def complete_experiment_session(db: Session, session_id: int, student_id: int) -> ExperimentSession:
    session = (
        db.query(ExperimentSession)
        .filter(ExperimentSession.id == session_id, ExperimentSession.student_id == student_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiment session not found")
    session.status = "completed"
    session.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session
