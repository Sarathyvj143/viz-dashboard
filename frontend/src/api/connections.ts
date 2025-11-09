import apiClient from './client';
import {
  Connection,
  ConnectionCreate,
  ConnectionUpdate,
  ConnectionTestResult,
} from '../types/connection';

export const connectionsApi = {
  getAll: async () => {
    const response = await apiClient.get<Connection[]>('/connections');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<Connection>(`/connections/${id}`);
    return response.data;
  },

  create: async (data: ConnectionCreate) => {
    const response = await apiClient.post<Connection>('/connections', data);
    return response.data;
  },

  update: async (id: number, data: ConnectionUpdate) => {
    const response = await apiClient.put<Connection>(
      `/connections/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/connections/${id}`);
  },

  test: async (id: number) => {
    const response = await apiClient.post<ConnectionTestResult>(
      `/connections/${id}/test`
    );
    return response.data;
  },

  testCredentials: async (data: ConnectionCreate) => {
    const response = await apiClient.post<ConnectionTestResult>(
      '/connections/test-credentials',
      data
    );
    return response.data;
  },
};
