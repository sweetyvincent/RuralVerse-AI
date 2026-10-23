"""Common dependencies shared across the application."""

from app.core.database import get_db
from app.core.security import get_current_user, require_role, get_optional_user

__all__ = ["get_db", "get_current_user", "require_role", "get_optional_user"]
