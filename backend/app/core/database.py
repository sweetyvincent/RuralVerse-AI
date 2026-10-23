from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

# Enable WAL mode and foreign keys for SQLite
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables and bootstrap admin if configured."""
    # Import all models to register them with Base
    import app.models.user  # noqa: F401
    import app.models.course  # noqa: F401
    import app.models.lesson  # noqa: F401
    import app.models.quiz  # noqa: F401
    import app.models.experiment  # noqa: F401
    import app.models.air_writing  # noqa: F401
    import app.models.ai_tutor  # noqa: F401
    import app.models.analytics  # noqa: F401
    import app.models.audit  # noqa: F401

    Base.metadata.create_all(bind=engine)

    # Bootstrap admin if configured
    from app.services.auth_service import bootstrap_admin
    db = SessionLocal()
    try:
        bootstrap_admin(db)
    finally:
        db.close()
