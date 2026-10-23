import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set test environment
os.environ["DATABASE_URL"] = "sqlite:///./test_ruralverse.db"
os.environ["SECRET_KEY"] = "test-secret-key-at-least-32-chars-long"

from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.main import app

engine = create_engine("sqlite:///./test_ruralverse.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # Seed one test admin user for authenticated testing
    db = TestingSessionLocal()
    admin = User(
        email="testadmin@example.com",
        hashed_password=get_password_hash("AdminPass123!"),
        full_name="Test Administrator",
        role="admin",
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_ruralverse.db"):
        try:
            os.remove("./test_ruralverse.db")
        except OSError:
            pass


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
