import apiClient from './client';

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceCreate {
  name: string;
}

export interface WorkspaceUpdate {
  name?: string;
}

export interface WorkspaceMember {
  id: number;
  workspace_id: number;
  user_id: number;
  role: 'admin' | 'editor' | 'viewer';
  invited_by: number;
  joined_at: string;
}

export interface InviteMemberRequest {
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface AcceptInvitationRequest {
  token: string;
}

export const workspacesApi = {
  list: async () => {
    const response = await apiClient.get<Workspace[]>('/workspaces');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<Workspace>(`/workspaces/${id}`);
    return response.data;
  },

  create: async (data: WorkspaceCreate) => {
    const response = await apiClient.post<Workspace>('/workspaces', data);
    return response.data;
  },

  update: async (id: number, data: WorkspaceUpdate) => {
    const response = await apiClient.patch<Workspace>(`/workspaces/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/workspaces/${id}`);
  },

  switch: async (id: number) => {
    const response = await apiClient.post<{ message: string; workspace_id: number }>(
      `/workspaces/${id}/switch`
    );
    return response.data;
  },

  listMembers: async (workspaceId: number) => {
    const response = await apiClient.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
    return response.data;
  },

  inviteMember: async (workspaceId: number, data: InviteMemberRequest) => {
    const response = await apiClient.post<{ message: string; email: string; role: string }>(
      `/workspaces/${workspaceId}/invite`,
      data
    );
    return response.data;
  },

  acceptInvitation: async (data: AcceptInvitationRequest) => {
    const response = await apiClient.post<{ message: string; workspace_id: number }>(
      '/workspaces/accept-invitation',
      data
    );
    return response.data;
  },

  removeMember: async (workspaceId: number, userId: number) => {
    await apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`);
  },

  updateMemberRole: async (workspaceId: number, userId: number, role: 'admin' | 'editor' | 'viewer') => {
    const response = await apiClient.patch<WorkspaceMember>(
      `/workspaces/${workspaceId}/members/${userId}/role`,
      { role }
    );
    return response.data;
  },
};
