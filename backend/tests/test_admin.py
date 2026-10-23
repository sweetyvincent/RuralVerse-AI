def test_admin_route_forbidden_for_anonymous(client):
    response = client.get("/api/admin/overview")
    assert response.status_code == 401


def test_admin_route_forbidden_for_student(client):
    # Register student
    client.post(
        "/api/auth/register",
        json={
            "email": "teststudent_admin@example.com",
            "password": "Password123!",
            "full_name": "Test Student",
            "role": "student",
        },
    )

    # Log in as student
    login_res = client.post(
        "/api/auth/login",
        json={"email": "teststudent_admin@example.com", "password": "Password123!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # Try calling admin overview
    response = client.get("/api/admin/overview", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_admin_overview_metrics(client):
    # Log in as admin
    login_res = client.post(
        "/api/auth/login",
        json={"email": "testadmin@example.com", "password": "AdminPass123!"},
    )
    token = login_res.json()["access_token"]

    response = client.get("/api/admin/overview", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["total_admins"] >= 1
    # Lessons and quizzes are 0 before any are created (strict real data policy)
    assert data["total_lessons"] >= 0
    assert data["total_quizzes"] >= 0


def test_admin_user_management(client):
    login_res = client.post(
        "/api/auth/login",
        json={"email": "testadmin@example.com", "password": "AdminPass123!"},
    )
    token = login_res.json()["access_token"]

    # List users
    list_res = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert list_res.status_code == 200
    users_data = list_res.json()
    assert users_data["total"] >= 1
