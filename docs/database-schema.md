# RuralVerse AI — Database Schema

## Entity Relationship Diagram

### Users & Authentication
- **users** — Core user table (admin, teacher, student roles)

### Educational Content
- **subjects** — Academic subjects (Math, Science, etc.)
- **courses** — Courses within subjects, tied to grade levels
- **lessons** — Individual lessons within courses
- **lesson_translations** — Multilingual lesson content
- **learning_resources** — Uploaded files (PDFs, images, videos) attached to lessons

### AI & Knowledge Base
- **documents** — Uploaded reference documents for RAG
- **document_chunks** — Chunked text with embeddings for retrieval
- **ai_tutor_config** — Singleton AI configuration
- **ai_usage_logs** — AI request tracking

### Assessments
- **quizzes** — Quiz definitions
- **questions** — Quiz questions
- **question_options** — Multiple-choice options
- **quiz_attempts** — Student attempt records
- **quiz_answers** — Individual answer records

### Science Lab
- **experiments** — Experiment definitions
- **experiment_assets** — 3D models and assets
- **experiment_sessions** — Student experiment records

### Air-Writing
- **air_writing_sessions** — Practice session records
- **air_writing_config** — Singleton configuration

### Classes & Enrollment
- **classes** — School classes
- **class_enrollments** — Student-class mapping
- **teacher_class_assignments** — Teacher-class mapping

### Analytics & System
- **student_progress** — Activity tracking
- **learning_recommendations** — AI-generated recommendations
- **notifications** — User notifications
- **platform_settings** — Key-value configuration
- **audit_logs** — Admin action audit trail

## Key Relationships
- User (1) → (N) QuizAttempts
- User (1) → (N) ExperimentSessions
- User (1) → (N) AirWritingSessions
- User (1) → (N) StudentProgress
- Subject (1) → (N) Courses
- Course (1) → (N) Lessons
- Course (1) → (N) Quizzes
- Lesson (1) → (N) LessonTranslations
- Lesson (1) → (N) LearningResources
- Quiz (1) → (N) Questions
- Question (1) → (N) QuestionOptions
- QuizAttempt (1) → (N) QuizAnswers
- Experiment (1) → (N) ExperimentAssets
- Class (1) → (N) ClassEnrollments
- Class (1) → (N) TeacherClassAssignments
