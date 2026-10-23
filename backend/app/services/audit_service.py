from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models.audit import AuditLog


def log_action(
    db: Session,
    actor_id: Optional[int],
    action: str,
    target_type: str,
    target_id: Optional[Any] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """Create an audit log entry for significant administrative or system actions."""
    parsed_target_id = None
    if target_id is not None:
        try:
            parsed_target_id = int(target_id)
        except (ValueError, TypeError):
            parsed_target_id = None

    audit_entry = AuditLog(
        actor_id=actor_id or 1,
        action=action,
        target_type=target_type,
        target_id=parsed_target_id,
        details=details,
        ip_address=ip_address,
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry
