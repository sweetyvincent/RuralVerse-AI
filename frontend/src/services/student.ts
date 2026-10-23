import api from './api';
import { StudentDashboardData, ProgressRecord } from '../types';

export const studentService = {
  async getDashboard(): Promise<StudentDashboardData> {
    const res = await api.get('/student/dashboard');
    return res.data;
  },

  async getProgress(): Promise<ProgressRecord[]> {
    const res = await api.get('/student/progress');
    return res.data;
  },

  async getRecommendations(): Promise<Array<{ id: number; recommendation_text: string; subject?: string }>> {
    const res = await api.get('/student/recommendations');
    return res.data;
  },

  async syncOfflineEvents(events: Array<{ event_type: string; data: Record<string, any> }>): Promise<{
    synced_count: number;
    total_received: number;
    errors: string[];
  }> {
    const res = await api.post('/sync/events', { events });
    return res.data;
  },
};
