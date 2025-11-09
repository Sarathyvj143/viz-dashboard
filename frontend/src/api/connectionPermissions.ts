import apiClient from './client';

export interface ConnectionPermission {
  id: number;
  connection_id: number;
  user_id: number;
  permission_level: 'owner' | 'editor' | 'viewer';
  granted_by: number;
  granted_at: string;
}

export interface ConnectionPermissionCreate {
  user_id: number;
  permission_level: 'owner' | 'editor' | 'viewer';
}

export interface ConnectionPermissionUpdate {
  permission_level?: 'owner' | 'editor' | 'viewer';
}

export const connectionPermissionsApi = {
  list: async (connectionId: number) => {
    const response = await apiClient.get<ConnectionPermission[]>(
      `/connections/${connectionId}/permissions`
    );
    return response.data;
  },

  grant: async (connectionId: number, data: ConnectionPermissionCreate) => {
    const response = await apiClient.post<ConnectionPermission>(
      `/connections/${connectionId}/permissions`,
      data
    );
    return response.data;
  },

  update: async (connectionId: number, userId: number, data: ConnectionPermissionUpdate) => {
    const response = await apiClient.patch<ConnectionPermission>(
      `/connections/${connectionId}/permissions/${userId}`,
      data
    );
    return response.data;
  },

  revoke: async (connectionId: number, userId: number) => {
    await apiClient.delete(`/connections/${connectionId}/permissions/${userId}`);
  },

  getAccessibleConnections: async () => {
    const response = await apiClient.get('/connections/user/accessible');
    return response.data;
  },
};
