import api from './api';
import { AuthResponse, User } from '../types';

export const authService = {
  async register(data: {
    email: string;
    password: string;
    full_name: string;
    role: 'student' | 'teacher';
    preferred_language?: string;
    grade?: string;
  }): Promise<User> {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore network errors, 404, or 405 on static hosting
      console.warn('API logout ignored or offline:', err);
    } finally {
      localStorage.removeItem('ruralverse_token');
      localStorage.removeItem('ruralverse_user');
    }
  },

  async getProfile(): Promise<User> {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async updateProfile(data: { full_name?: string; preferred_language?: string; grade?: string }): Promise<User> {
    const res = await api.patch('/auth/me', data);
    return res.data;
  },

  async changePassword(data: { current_password: string; new_password: string }): Promise<{ message: string }> {
    const res = await api.post('/auth/change-password', data);
    return res.data;
  },
};
