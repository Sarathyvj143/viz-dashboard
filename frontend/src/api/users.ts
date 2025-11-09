import apiClient from './client';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  email_verified: boolean;
  current_workspace_id: number | null;
}

export interface UserListItem {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  workspace_count: number;
}

export interface UserWorkspaceMembership {
  workspace_id: number;
  workspace_name: string;
  role: 'admin' | 'editor' | 'viewer';
  joined_at: string;
}

export interface UserDetailResponse {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  email_verified: boolean;
  current_workspace_id: number | null;
  workspaces: UserWorkspaceMembership[];
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface UserUpdate {
  email?: string;
  role?: 'admin' | 'editor' | 'viewer';
  is_active?: boolean;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface AdminPasswordResetRequest {
  new_password: string;
}

export interface UserListParams {
  page?: number;
  page_size?: number;
  search?: string;
  role?: 'admin' | 'editor' | 'viewer';
  is_active?: boolean;
}

export const usersApi = {
  list: async (params?: UserListParams) => {
    const response = await apiClient.get<UserListResponse>('/users', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<UserDetailResponse>(`/users/${id}`);
    return response.data;
  },

  create: async (data: UserCreate) => {
    const response = await apiClient.post<User>('/users', data);
    return response.data;
  },

  update: async (id: number, data: UserUpdate) => {
    const response = await apiClient.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/users/${id}`);
  },

  getWorkspaces: async (id: number) => {
    const response = await apiClient.get<UserWorkspaceMembership[]>(`/users/${id}/workspaces`);
    return response.data;
  },

  changePassword: async (id: number, data: PasswordChangeRequest) => {
    const response = await apiClient.post<{ message: string }>(`/users/${id}/password`, data);
    return response.data;
  },

  adminResetPassword: async (id: number, data: AdminPasswordResetRequest) => {
    const response = await apiClient.post<{ message: string }>(`/users/${id}/reset-password`, data);
    return response.data;
  },
};
