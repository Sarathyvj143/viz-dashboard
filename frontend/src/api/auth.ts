import apiClient from './client';
import { User, LoginCredentials, RegisterData } from '../types/user';

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post<{ user: User; token: string }>(
      '/auth/login',
      credentials
    );
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await apiClient.post<{ user: User; token: string }>(
      '/auth/register',
      data
    );
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post<{ message: string }>('/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};
