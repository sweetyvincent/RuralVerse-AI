import api from './api';
import { AirWritingConfig, AirWritingSession } from '../types';

export const airWritingService = {
  async getConfig(): Promise<AirWritingConfig> {
    const res = await api.get('/air-writing/config');
    return res.data;
  },

  async updateConfig(data: Partial<AirWritingConfig>): Promise<AirWritingConfig> {
    const res = await api.patch('/air-writing/admin/config', data);
    return res.data;
  },

  async recordSession(data: {
    mode: string;
    duration_seconds?: number;
    drawing_data_path?: string;
  }): Promise<AirWritingSession> {
    const res = await api.post('/air-writing/sessions', data);
    return res.data;
  },

  async getMySessions(): Promise<AirWritingSession[]> {
    const res = await api.get('/air-writing/student/sessions');
    return res.data;
  },
};
