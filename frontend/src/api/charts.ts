import apiClient from './client';
import { QueryParams } from '../types/api';
import { Chart } from '../types/chart';

export const chartsApi = {
  getAll: async (params?: QueryParams) => {
    const response = await apiClient.get<Chart[]>(
      '/charts',
      { params }
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Chart>(`/charts/${id}`);
    return response.data;
  },

  create: async (data: Partial<Chart>) => {
    const response = await apiClient.post<Chart>('/charts', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Chart>) => {
    const response = await apiClient.put<Chart>(`/charts/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<{ message: string }>(`/charts/${id}`);
    return response.data;
  },

  executeQuery: async (id: string, params?: Record<string, unknown>) => {
    const response = await apiClient.post<unknown>(
      `/charts/${id}/execute`,
      params
    );
    return response.data;
  },
};
