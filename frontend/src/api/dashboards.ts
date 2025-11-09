import apiClient from './client';
import { Dashboard, DashboardCreate, DashboardUpdate } from '../types/dashboard';

export const dashboardsApi = {
  getAll: async () => {
    const response = await apiClient.get<Dashboard[]>('/dashboards');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<Dashboard>(`/dashboards/${id}`);
    return response.data;
  },

  create: async (data: DashboardCreate) => {
    const response = await apiClient.post<Dashboard>('/dashboards', data);
    return response.data;
  },

  update: async (id: number, data: DashboardUpdate) => {
    const response = await apiClient.put<Dashboard>(
      `/dashboards/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/dashboards/${id}`);
  },

  generateShareToken: async (id: number, expiresInDays: number = 30) => {
    const response = await apiClient.post<Dashboard>(
      `/dashboards/${id}/share`,
      null,
      { params: { expires_in_days: expiresInDays } }
    );
    return response.data;
  },

  revokeShareToken: async (id: number) => {
    await apiClient.delete(`/dashboards/${id}/share`);
  },

  getPublic: async (shareToken: string) => {
    const response = await apiClient.get<Dashboard>(
      `/dashboards/public/${shareToken}`
    );
    return response.data;
  },
};
