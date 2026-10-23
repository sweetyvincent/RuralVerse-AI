# RuralVerse AI — REST API Documentation

Base URL: `/api`
Interactive Swagger UI: `http://localhost:8000/api/docs`

---

## Authentication & Users
- `POST /api/auth/register`: Register new student or teacher account.
- `POST /api/auth/login`: Authenticate and receive JWT access token.
- `POST /api/auth/logout`: Sign out.
- `GET /api/users/me`: Current authenticated profile.
- `PATCH /api/users/me`: Update profile attributes (name, preferred language, grade).
- `POST /api/auth/change-password`: Update password and clear bootstrap flag.

## Courses & Lessons
- `GET /api/subjects`: List active academic subjects.
- `POST /api/admin/subjects`: Create new subject (Admin).
- `GET /api/courses`: List published courses.
- `POST /api/admin/courses`: Create new course (Admin).
- `GET /api/lessons`: List published lessons.
- `GET /api/lessons/{id}`: Detailed lesson view with attached resources and translations.
- `POST /api/admin/lessons`: Create new lesson module (Admin/Teacher).
- `PATCH /api/admin/lessons/{id}`: Update or publish lesson.
- `DELETE /api/admin/lessons/{id}`: Delete lesson.
- `POST /api/admin/lessons/{id}/resources`: Upload attached PDF/media files.

## AI Tutor & RAG Knowledge Base
- `POST /api/ai/chat`: Multilingual pedagogical chat grounded in retrieved textbook passages.
- `POST /api/ai/generate-questions/{document_id}`: RAG model that generates assessment questions directly from uploaded lesson PDFs.
- `GET /api/ai/knowledge-base/documents`: List uploaded textbook reference documents.
- `POST /api/ai/knowledge-base/documents`: Upload educational PDF for RAG.
- `POST /api/ai/knowledge-base/documents/{id}/index`: Extract text, chunk, and index document passages.
- `DELETE /api/ai/knowledge-base/documents/{id}`: Remove document and its semantic chunks.

## Assessments & Quizzes
- `GET /api/quizzes`: List published quizzes.
- `GET /api/quizzes/{id}`: Fetch quiz questions and options.
- `POST /api/quizzes/{id}/attempts`: Start a quiz attempt.
- `POST /api/quizzes/{id}/attempts/{attempt_id}/submit`: Submit answers for immediate server evaluation and scoring.
- `GET /api/student/quiz-attempts`: Student's attempt history with scores.

## AR Science Lab
- `GET /api/experiments`: List published 3D science simulations.
- `GET /api/experiments/{id}`: Get experiment metadata and 3D configuration.
- `POST /api/experiments/{id}/sessions`: Record start of interactive experiment session.
- `PATCH /api/experiments/sessions/{id}`: Record experiment completion.

## Air-Writing Studio
- `GET /api/air-writing/config`: Retrieve studio configuration and color palette.
- `PATCH /api/air-writing/admin/config`: Update global air-writing settings (Admin).
- `POST /api/air-writing/sessions`: Save student practice session.
- `GET /api/air-writing/student/sessions`: History of student's practice sessions.

## Administration & Analytics
- `GET /api/admin/overview`: Real DB metrics (counts of users, students, teachers, lessons, quizzes, experiments).
- `GET /api/admin/analytics`: Aggregated platform learning analytics.
- `GET /api/admin/users`: Search, filter, and paginate users.
- `PATCH /api/admin/users/{id}`: Update user role or active status (guarded against last admin deletion).
- `GET /api/admin/audit-logs`: Audit trail of security and content lifecycle events.
- `GET /api/admin/ai-config`: LLM model configuration.
- `POST /api/admin/ai-config`: Update LLM parameters.
- `POST /api/admin/ai-config/test`: Test live LLM connection.
- `GET /api/admin/settings`: Platform key-value settings.
- `PATCH /api/admin/settings`: Update platform settings.
- `POST /api/sync/events`: Offline progress event synchronization.
