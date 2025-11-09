import apiClient from './client';

export interface SystemSettings {
  allowRegistration: boolean;
  defaultRole: string;
  sessionTimeout: number;
}

export const settingsApi = {
  getSystemSettings: async () => {
    const response = await apiClient.get<SystemSettings>('/settings/system');
    return response.data;
  },

  updateSystemSettings: async (data: Partial<SystemSettings>) => {
    const response = await apiClient.put<SystemSettings>(
      '/settings/system',
      data
    );
    return response.data;
  },
};
