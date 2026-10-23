import api from './api';
import { AdminOverviewData, PlatformAnalyticsData, User, AuditLogItem } from '../types';

export const adminService = {
  async getOverview(): Promise<AdminOverviewData> {
    const res = await api.get('/admin/overview');
    return res.data;
  },

  async getAnalytics(): Promise<PlatformAnalyticsData> {
    const res = await api.get('/admin/analytics');
    return res.data;
  },

  async getUsers(params?: { role?: string; search?: string; page?: number; page_size?: number }): Promise<{
    users: User[];
    total: number;
    page: number;
    page_size: number;
  }> {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  async updateUser(userId: number, data: { role?: string; is_active?: boolean; full_name?: string }): Promise<User> {
    const res = await api.patch(`/admin/users/${userId}`, data);
    return res.data;
  },

  async getAuditLogs(params?: { page?: number; page_size?: number }): Promise<{
    logs: AuditLogItem[];
    total: number;
    page: number;
    page_size: number;
  }> {
    const res = await api.get('/admin/audit-logs', { params });
    return res.data;
  },

  async getAiConfig(): Promise<{
    id: number;
    provider: string;
    model_name: string;
    temperature: number;
    max_tokens: number;
    system_instructions: string;
    supported_languages: string[];
  }> {
    const res = await api.get('/admin/ai-config');
    return res.data;
  },

  async updateAiConfig(data: {
    model_name?: string;
    temperature?: number;
    max_tokens?: number;
    system_instructions?: string;
    supported_languages?: string[];
  }): Promise<any> {
    const res = await api.post('/admin/ai-config', data);
    return res.data;
  },

  async testAiConnection(): Promise<{ status: string; message?: string; model?: string; response?: string }> {
    const res = await api.post('/admin/ai-config/test');
    return res.data;
  },

  async getSettings(): Promise<Record<string, string>> {
    const res = await api.get('/admin/settings');
    return res.data;
  },

  async updateSettings(data: Record<string, string>): Promise<{ message: string }> {
    const res = await api.patch('/admin/settings', data);
    return res.data;
  },
};
