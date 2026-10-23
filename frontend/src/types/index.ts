export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  preferred_language: string;
  grade?: string | null;
  is_active: boolean;
  must_change_password?: boolean;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Subject {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  created_at?: string;
}

export interface Course {
  id: number;
  subject_id: number;
  title: string;
  description?: string;
  grade_level?: string;
  is_published: boolean;
  created_at?: string;
  subject?: Subject;
  lessons?: Lesson[];
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  content?: string;
  order: number;
  duration_minutes?: number;
  is_published: boolean;
  language: string;
  created_at?: string;
  resources?: LessonResource[];
  translations?: LessonTranslation[];
}

export interface LessonResource {
  id: number;
  lesson_id: number;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  created_at?: string;
}

export interface LessonTranslation {
  id: number;
  lesson_id: number;
  language: string;
  title: string;
  content?: string;
}

export interface QuestionOption {
  id?: number;
  option_text: string;
  is_correct?: boolean;
}

export interface Question {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'short_answer';
  points: number;
  order: number;
  explanation?: string;
  options: QuestionOption[];
}

export interface Quiz {
  id: number;
  course_id: number;
  lesson_id?: number | null;
  title: string;
  description?: string;
  time_limit_minutes?: number | null;
  passing_score: number;
  is_published: boolean;
  created_by?: number;
  created_at?: string;
  questions?: Question[];
}

export interface QuizAnswer {
  id?: number;
  question_id: number;
  selected_option_id?: number | null;
  answer_text?: string | null;
  is_correct?: boolean;
  points_earned?: number;
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  student_id: number;
  score: number;
  total_points: number;
  started_at: string;
  completed_at?: string | null;
  answers?: QuizAnswer[];
}

export interface Experiment {
  id: number;
  title: string;
  description?: string;
  subject?: string;
  experiment_type?: string;
  instructions?: string;
  safety_notes?: string;
  grade_level?: string;
  is_published: boolean;
  model_config_json?: string;
  created_at?: string;
}

export interface AirWritingSession {
  id: number;
  student_id: number;
  mode: string;
  duration_seconds?: number;
  drawing_data_path?: string;
  created_at?: string;
}

export interface AirWritingConfig {
  id: number;
  is_enabled: boolean;
  available_colors: string[];
  available_brush_sizes: number[];
  updated_at?: string;
}

export interface DocumentItem {
  id: number;
  title: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  status: 'pending' | 'indexed' | 'failed';
  uploaded_by: number;
  created_at?: string;
}

export interface ProgressRecord {
  id: number;
  student_id: number;
  lesson_id?: number | null;
  quiz_id?: number | null;
  experiment_id?: number | null;
  activity_type: string;
  status: string;
  score?: number | null;
  time_spent_seconds: number;
  created_at?: string;
}

export interface StudentDashboardData {
  total_lessons_completed: number;
  total_quizzes_taken: number;
  total_experiments_completed: number;
  average_quiz_score: number;
  total_time_spent_seconds: number;
  recent_activity: ProgressRecord[];
}

export interface AdminOverviewData {
  total_users: number;
  total_students: number;
  total_teachers: number;
  total_admins: number;
  total_lessons: number;
  total_quizzes: number;
  total_experiments: number;
  total_courses: number;
  total_subjects: number;
  recent_users: Array<{
    id: number;
    email: string;
    full_name: string;
    role: string;
    created_at?: string;
  }>;
}

export interface PlatformAnalyticsData {
  total_quiz_attempts: number;
  average_quiz_score: number;
  total_experiment_sessions: number;
  total_ai_chats: number;
  total_air_writing_sessions: number;
  active_students_count: number;
  progress_by_activity: Record<string, number>;
}

export interface AuditLogItem {
  id: number;
  actor_id: number;
  actor_email?: string;
  action: string;
  target_type?: string;
  target_id?: number;
  details?: string;
  ip_address?: string;
  created_at?: string;
}
