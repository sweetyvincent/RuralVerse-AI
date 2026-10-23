import api from './api';
import { Experiment } from '../types';

export const experimentService = {
  async getExperiments(subject?: string, gradeLevel?: string): Promise<Experiment[]> {
    const res = await api.get('/experiments', { params: { subject, grade_level: gradeLevel } });
    return res.data;
  },

  async getAdminExperiments(): Promise<Experiment[]> {
    const res = await api.get('/admin/experiments');
    return res.data;
  },

  async getExperiment(id: number): Promise<Experiment> {
    const res = await api.get(`/experiments/${id}`);
    return res.data;
  },

  async createExperiment(data: Partial<Experiment>): Promise<Experiment> {
    const res = await api.post('/admin/experiments', data);
    return res.data;
  },

  async updateExperiment(id: number, data: Partial<Experiment>): Promise<Experiment> {
    const res = await api.patch(`/admin/experiments/${id}`, data);
    return res.data;
  },

  async startSession(experimentId: number): Promise<{ id: number; status: string }> {
    const res = await api.post(`/experiments/${experimentId}/sessions`);
    return res.data;
  },

  async completeSession(sessionId: number): Promise<{ id: number; status: string }> {
    const res = await api.patch(`/experiments/sessions/${sessionId}`, { status: 'completed' });
    return res.data;
  },
};
