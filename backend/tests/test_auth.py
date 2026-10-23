def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["platform"] == "RuralVerse AI"


def test_student_registration(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "student1@example.com",
            "password": "Password123!",
            "full_name": "Arun Kumar",
            "role": "student",
            "preferred_language": "ta",
            "grade": "8th Grade",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "student1@example.com"
    assert data["role"] == "student"
    assert data["preferred_language"] == "ta"


def test_teacher_registration(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "teacher1@example.com",
            "password": "TeacherPass123!",
            "full_name": "Dr. Meenakshi",
            "role": "teacher",
            "preferred_language": "en",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["role"] == "teacher"


def test_prevent_admin_registration(client):
    """Public registration cannot be used to escalate to admin role."""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "fakeadmin@example.com",
            "password": "Password123!",
            "full_name": "Fake Admin",
            "role": "admin",
        },
    )
    assert response.status_code in (400, 422)


def test_student_login(client):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "student1@example.com",
            "password": "Password123!",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "student1@example.com"


def test_invalid_login(client):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "student1@example.com",
            "password": "WrongPassword",
        },
    )
    assert response.status_code == 401
