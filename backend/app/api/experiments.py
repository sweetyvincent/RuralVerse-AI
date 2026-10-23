from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User
from app.schemas.experiment import (
    ExperimentCreate,
    ExperimentUpdate,
    ExperimentResponse,
    ExperimentSessionResponse,
    ExperimentSessionUpdate,
)
from app.services import experiment_service
from app.services.audit_service import log_action

router = APIRouter(tags=["AR Science Laboratory"])


@router.get("/experiments", response_model=List[ExperimentResponse])
def get_experiments(
    subject: Optional[str] = Query(None),
    grade_level: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List published science lab experiments."""
    return experiment_service.get_experiments(db, subject=subject, grade_level=grade_level, published_only=True)


@router.get("/admin/experiments", response_model=List[ExperimentResponse])
def get_all_experiments_admin(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(["admin", "teacher"])),
):
    """List all science experiments including unpublished drafts."""
    return experiment_service.get_experiments(db, published_only=False)


@router.get("/experiments/{experiment_id}", response_model=ExperimentResponse)
def get_experiment_detail(experiment_id: int, db: Session = Depends(get_db)):
    """Fetch complete metadata and configuration for a 3D science experiment."""
    return experiment_service.get_experiment_by_id(db, experiment_id)


@router.post("/admin/experiments", response_model=ExperimentResponse, status_code=status.HTTP_201_CREATED)
def create_experiment(
    data: ExperimentCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"])),
):
    """Register a new interactive 3D science experiment (Admin only)."""
    exp = experiment_service.create_experiment(db, data)
    log_action(db, actor_id=admin.id, action="CREATE_EXPERIMENT", target_type="experiment", target_id=exp.id)
    return exp


@router.patch("/admin/experiments/{experiment_id}", response_model=ExperimentResponse)
def update_experiment(
    experiment_id: int,
    data: ExperimentUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"])),
):
    """Update experiment parameters or publication status."""
    exp = experiment_service.update_experiment(db, experiment_id, data)
    log_action(db, actor_id=admin.id, action="UPDATE_EXPERIMENT", target_type="experiment", target_id=exp.id)
    return exp


@router.post("/experiments/{experiment_id}/sessions", response_model=ExperimentSessionResponse)
def start_session(
    experiment_id: int,
    db: Session = Depends(get_db),
    current_student: User = Depends(require_role(["student", "teacher", "admin"])),
):
    """Record commencement of an interactive experiment session."""
    return experiment_service.start_experiment_session(db, experiment_id, current_student.id)


@router.patch("/experiments/sessions/{session_id}", response_model=ExperimentSessionResponse)
def complete_session(
    session_id: int,
    data: ExperimentSessionUpdate,
    db: Session = Depends(get_db),
    current_student: User = Depends(require_role(["student", "teacher", "admin"])),
):
    """Record completion of an experiment session."""
    return experiment_service.complete_experiment_session(db, session_id, current_student.id)
