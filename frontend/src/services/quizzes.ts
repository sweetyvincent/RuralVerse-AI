import api from './api';
import { Quiz, QuizAttempt, Question } from '../types';

export const quizService = {
  async getQuizzes(courseId?: number): Promise<Quiz[]> {
    const res = await api.get('/quizzes', { params: { course_id: courseId } });
    return res.data;
  },

  async getAdminQuizzes(courseId?: number): Promise<Quiz[]> {
    const res = await api.get('/admin/quizzes', { params: { course_id: courseId } });
    return res.data;
  },

  async getQuiz(id: number): Promise<Quiz> {
    const res = await api.get(`/quizzes/${id}`);
    return res.data;
  },

  async createQuiz(data: {
    course_id: number;
    title: string;
    description?: string;
    time_limit_minutes?: number;
    passing_score?: number;
    is_published?: boolean;
  }): Promise<Quiz> {
    const res = await api.post('/admin/quizzes', data);
    return res.data;
  },

  async updateQuiz(id: number, data: Partial<Quiz>): Promise<Quiz> {
    const res = await api.patch(`/admin/quizzes/${id}`, data);
    return res.data;
  },

  async addQuestion(quizId: number, data: {
    question_text: string;
    question_type: 'multiple_choice' | 'short_answer';
    points: number;
    explanation?: string;
    options: Array<{ option_text: string; is_correct: boolean }>;
  }): Promise<Question> {
    const res = await api.post(`/admin/quizzes/${quizId}/questions`, data);
    return res.data;
  },

  async startAttempt(quizId: number): Promise<QuizAttempt> {
    const res = await api.post(`/quizzes/${quizId}/attempts`);
    return res.data;
  },

  async submitAttempt(quizId: number, attemptId: number, answers: Array<{
    question_id: number;
    selected_option_id?: number | null;
    answer_text?: string | null;
  }>): Promise<QuizAttempt> {
    const res = await api.post(`/quizzes/${quizId}/attempts/${attemptId}/submit`, { answers });
    return res.data;
  },

  async getMyAttempts(): Promise<QuizAttempt[]> {
    const res = await api.get('/student/quiz-attempts');
    return res.data;
  },
};
