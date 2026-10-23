from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User
from app.schemas.analytics import SyncEventsRequest
from app.services import analytics_service

router = APIRouter(prefix="/sync", tags=["Offline Synchronization & Analytics"])


@router.post("/events")
def sync_offline_events(
    request: SyncEventsRequest,
    db: Session = Depends(get_db),
    current_student: User = Depends(require_role(["student", "teacher", "admin"])),
):
    """
    Synchronize offline queued learning events (lesson completion, quiz attempts,
    experiments, air-writing) when internet connectivity is re-established.
    Safely prevents duplicate attempts and reconciles progress.
    """
    return analytics_service.sync_offline_events(
        db=db,
        student_id=current_student.id,
        request=request,
    )
