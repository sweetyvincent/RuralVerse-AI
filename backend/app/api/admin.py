from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
import json

from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User
from app.models.audit import AuditLog
from app.models.analytics import PlatformSetting
from app.models.ai_tutor import AITutorConfig
from app.schemas.user import UserPublic, AdminUserUpdateRequest, UserListResponse
from app.schemas.analytics import AdminOverview, PlatformAnalytics
from app.schemas.ai_tutor import AITutorConfigResponse, AITutorConfigUpdate
from app.services.analytics_service import get_admin_overview, get_platform_analytics
from app.services.ai_service import get_ai_config, test_ai_connection
from app.services.audit_service import log_action

router = APIRouter(prefix="/admin", tags=["Admin Management"], dependencies=[Depends(require_role(["admin"]))])


@router.get("/overview", response_model=AdminOverview)
def admin_overview(db: Session = Depends(get_db)):
    """Fetch real-time overview counts directly computed from database tables."""
    return get_admin_overview(db)


@router.get("/analytics", response_model=PlatformAnalytics)
def admin_analytics(db: Session = Depends(get_db)):
    """Fetch aggregated platform analytics based on actual student activity records."""
    return get_platform_analytics(db)


@router.get("/users", response_model=UserListResponse)
def list_users(
    role: Optional[str] = Query(None, description="Filter by role"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List registered users with pagination, role filtering, and search."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if search:
        search_filter = f"%{search}%"
        query = query.filter((User.email.ilike(search_filter)) | (User.full_name.ilike(search_filter)))

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return UserListResponse(users=users, total=total, page=page, page_size=page_size)


@router.get("/users/{user_id}", response_model=UserPublic)
def get_user_detail(user_id: int, db: Session = Depends(get_db)):
    """Get single user account details."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch("/users/{user_id}", response_model=UserPublic)
def update_user_status(
    user_id: int,
    data: AdminUserUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role(["admin"])),
):
    """
    Update user role or active status.
    Guards against accidental deactivation of the last active administrator.
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Safety check: Prevent deactivating the last active admin
    if target_user.role == "admin" and data.is_active is False:
        active_admin_count = db.query(User).filter(User.role == "admin", User.is_active == True).count()
        if active_admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate the last active administrator account.",
            )

    if data.role is not None:
        target_user.role = data.role
    if data.is_active is not None:
        target_user.is_active = data.is_active
    if data.full_name is not None:
        target_user.full_name = data.full_name

    db.commit()
    db.refresh(target_user)

    log_action(
        db,
        actor_id=current_admin.id,
        action="ADMIN_UPDATE_USER",
        target_type="user",
        target_id=user_id,
        details=f"Updated user {target_user.email}: role={target_user.role}, is_active={target_user.is_active}",
    )

    return target_user


@router.get("/audit-logs")
def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List system audit log entries in reverse chronological order."""
    query = db.query(AuditLog).order_by(AuditLog.created_at.desc())
    total = query.count()
    logs = query.offset((page - 1) * page_size).limit(page_size).all()
    
    result = []
    for l in logs:
        actor_email = l.actor.email if l.actor else "System"
        result.append({
            "id": l.id,
            "actor_id": l.actor_id,
            "actor_email": actor_email,
            "action": l.action,
            "target_type": l.target_type,
            "target_id": l.target_id,
            "details": l.details,
            "ip_address": l.ip_address,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        })
    return {"logs": result, "total": total, "page": page, "page_size": page_size}


@router.get("/ai-config", response_model=AITutorConfigResponse)
def fetch_ai_config(db: Session = Depends(get_db)):
    """Fetch current AI Tutor configuration (never exposes provider secret keys)."""
    config = get_ai_config(db)
    return AITutorConfigResponse.from_db(config)


@router.post("/ai-config", response_model=AITutorConfigResponse)
def update_ai_configuration(
    data: AITutorConfigUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role(["admin"])),
):
    """Update AI model parameters, system prompt, or supported languages."""
    config = get_ai_config(db)
    if data.provider is not None:
        config.provider = data.provider
    if data.model_name is not None:
        config.model_name = data.model_name
    if data.temperature is not None:
        config.temperature = data.temperature
    if data.max_tokens is not None:
        config.max_tokens = data.max_tokens
    if data.system_instructions is not None:
        config.system_instructions = data.system_instructions
    if data.supported_languages is not None:
        config.supported_languages = json.dumps(data.supported_languages)

    db.commit()
    db.refresh(config)

    log_action(
        db,
        actor_id=current_admin.id,
        action="UPDATE_AI_CONFIG",
        target_type="ai_tutor_config",
        target_id=config.id,
        details=f"Updated model={config.model_name}, temp={config.temperature}",
    )
    return AITutorConfigResponse.from_db(config)


@router.post("/ai-config/test")
def test_ai():
    """Verify live connection to configured LLM provider."""
    return test_ai_connection()


@router.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    """Retrieve all platform settings."""
    settings_records = db.query(PlatformSetting).all()
    return {s.key: s.value for s in settings_records}


@router.patch("/settings")
def update_settings(
    settings_data: dict,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role(["admin"])),
):
    """Update platform key-value settings."""
    for key, value in settings_data.items():
        setting = db.query(PlatformSetting).filter(PlatformSetting.key == key).first()
        if setting:
            setting.value = str(value)
            setting.updated_by = current_admin.id
        else:
            new_s = PlatformSetting(key=key, value=str(value), updated_by=current_admin.id)
            db.add(new_s)
    db.commit()

    log_action(
        db,
        actor_id=current_admin.id,
        action="UPDATE_PLATFORM_SETTINGS",
        target_type="settings",
        details=f"Updated settings keys: {list(settings_data.keys())}",
    )
    return {"message": "Settings updated successfully"}
