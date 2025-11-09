import apiClient from './client';
import {
  DataSource,
  DataSourceCreate,
  DataSourceUpdate,
  DiscoverResponse,
} from '../types/dataSource';

export const dataSourcesApi = {
  getAll: async (connectionId?: number) => {
    const params = connectionId ? { connection_id: connectionId } : {};
    const response = await apiClient.get<DataSource[]>('/data-sources', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<DataSource>(`/data-sources/${id}`);
    return response.data;
  },

  create: async (data: DataSourceCreate) => {
    const response = await apiClient.post<DataSource>('/data-sources', data);
    return response.data;
  },

  update: async (id: number, data: DataSourceUpdate) => {
    const response = await apiClient.put<DataSource>(
      `/data-sources/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/data-sources/${id}`);
  },

  discover: async (connectionId: number) => {
    const response = await apiClient.get<DiscoverResponse>(
      `/data-sources/connection/${connectionId}/discover`
    );
    return response.data;
  },
};
