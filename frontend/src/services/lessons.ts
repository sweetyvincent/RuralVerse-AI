import api from './api';
import { Subject, Course, Lesson, LessonResource } from '../types';

export const lessonService = {
  async getSubjects(): Promise<Subject[]> {
    const res = await api.get('/subjects');
    return res.data;
  },

  async createSubject(data: { name: string; description?: string; icon?: string }): Promise<Subject> {
    const res = await api.post('/admin/subjects', data);
    return res.data;
  },

  async getCourses(subjectId?: number): Promise<Course[]> {
    const res = await api.get('/courses', { params: { subject_id: subjectId } });
    return res.data;
  },

  async getAdminCourses(subjectId?: number): Promise<Course[]> {
    const res = await api.get('/admin/courses', { params: { subject_id: subjectId } });
    return res.data;
  },

  async getCourse(id: number): Promise<Course> {
    const res = await api.get(`/courses/${id}`);
    return res.data;
  },

  async createCourse(data: {
    subject_id: number;
    title: string;
    description?: string;
    grade_level?: string;
    is_published?: boolean;
  }): Promise<Course> {
    const res = await api.post('/admin/courses', data);
    return res.data;
  },

  async getLessons(courseId?: number, language?: string): Promise<Lesson[]> {
    const res = await api.get('/lessons', { params: { course_id: courseId, language } });
    return res.data;
  },

  async getAdminLessons(courseId?: number): Promise<Lesson[]> {
    const res = await api.get('/admin/lessons', { params: { course_id: courseId } });
    return res.data;
  },

  async getLesson(id: number): Promise<Lesson> {
    const res = await api.get(`/lessons/${id}`);
    return res.data;
  },

  async createLesson(data: {
    course_id: number;
    title: string;
    content?: string;
    order?: number;
    duration_minutes?: number;
    is_published?: boolean;
    language?: string;
  }): Promise<Lesson> {
    const res = await api.post('/admin/lessons', data);
    return res.data;
  },

  async updateLesson(id: number, data: Partial<Lesson>): Promise<Lesson> {
    const res = await api.patch(`/admin/lessons/${id}`, data);
    return res.data;
  },

  async deleteLesson(id: number): Promise<void> {
    await api.delete(`/admin/lessons/${id}`);
  },

  async uploadResource(lessonId: number, file: File): Promise<LessonResource> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/admin/lessons/${lessonId}/resources`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
