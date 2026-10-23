def test_lesson_lifecycle(client):
    # Log in as admin
    login_res = client.post(
        "/api/auth/login",
        json={"email": "testadmin@example.com", "password": "AdminPass123!"},
    )
    admin_token = login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create subject
    sub_res = client.post(
        "/api/admin/subjects",
        json={"name": "Physics", "description": "Fundamentals of physics", "icon": "atom"},
        headers=admin_headers,
    )
    assert sub_res.status_code == 201
    subject_id = sub_res.json()["id"]

    # 2. Create course
    course_res = client.post(
        "/api/admin/courses",
        json={
            "subject_id": subject_id,
            "title": "Basic Electricity",
            "description": "Circuits and currents",
            "grade_level": "8th Grade",
            "is_published": True,
        },
        headers=admin_headers,
    )
    assert course_res.status_code == 201
    course_id = course_res.json()["id"]

    # 3. Create lesson
    lesson_res = client.post(
        "/api/admin/lessons",
        json={
            "course_id": course_id,
            "title": "Electric Circuits & Components",
            "content": "A circuit requires a closed loop connecting a power source to a load.",
            "duration_minutes": 30,
            "is_published": True,
            "language": "en",
        },
        headers=admin_headers,
    )
    assert lesson_res.status_code == 201
    lesson_id = lesson_res.json()["id"]

    # 4. Public/student view of published lessons
    lessons_list = client.get("/api/lessons")
    assert lessons_list.status_code == 200
    lessons = lessons_list.json()
    assert any(l["id"] == lesson_id for l in lessons)

    # 5. Lesson detail
    detail_res = client.get(f"/api/lessons/{lesson_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["title"] == "Electric Circuits & Components"
