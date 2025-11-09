import { useState, useEffect } from 'react';
import { connectionPermissionsApi, ConnectionPermission, ConnectionPermissionCreate } from '../../api/connectionPermissions';
import { usersApi, UserListItem } from '../../api/users';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { PlusIcon, TrashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { formatDate, getPermissionBadgeColor } from '../../utils/uiHelpers';
import { getApiErrorMessage } from '../../utils/errorHandling';
import { UI_CONFIG } from '../../constants/ui';

interface ConnectionPermissionsProps {
  connectionId: number;
  connectionName: string;
}

export default function ConnectionPermissions({ connectionId, connectionName }: ConnectionPermissionsProps) {
  const [permissions, setPermissions] = useState<ConnectionPermission[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);

  // Form state
  const [grantFormData, setGrantFormData] = useState<ConnectionPermissionCreate>({
    user_id: 0,
    permission_level: 'viewer'
  });

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await connectionPermissionsApi.list(connectionId);
      setPermissions(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load connection permissions'));
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await usersApi.list({ page: 1, page_size: 100 });
      setAvailableUsers(response.users);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load users'));
    }
  };

  useEffect(() => {
    loadPermissions();
    loadAvailableUsers();
  }, [connectionId]);

  const handleGrantPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await connectionPermissionsApi.grant(connectionId, grantFormData);
      setSuccessMessage('Permission granted successfully');
      setIsGrantModalOpen(false);
      setGrantFormData({ user_id: 0, permission_level: 'viewer' });
      loadPermissions();

      setTimeout(() => setSuccessMessage(null), UI_CONFIG.MESSAGE_DURATION_MS);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to grant permission'));
    }
  };

  const handleRevokePermission = async (userId: number) => {
    if (!confirm('Are you sure you want to revoke this permission?')) return;

    try {
      await connectionPermissionsApi.revoke(connectionId, userId);
      setSuccessMessage('Permission revoked successfully');
      loadPermissions();

      setTimeout(() => setSuccessMessage(null), UI_CONFIG.MESSAGE_DURATION_MS);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to revoke permission'));
    }
  };

  const handleUpdatePermission = async (userId: number, newLevel: 'owner' | 'editor' | 'viewer') => {
    try {
      await connectionPermissionsApi.update(connectionId, userId, { permission_level: newLevel });
      setSuccessMessage('Permission level updated successfully');
      loadPermissions();

      setTimeout(() => setSuccessMessage(null), UI_CONFIG.MESSAGE_DURATION_MS);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update permission'));
    }
  };

  const getUserName = (userId: number) => {
    const user = availableUsers.find(u => u.id === userId);
    return user ? `${user.username} (${user.email})` : `User #${userId}`;
  };

  const getAvailableUsersForGrant = () => {
    const permittedUserIds = permissions.map(p => p.user_id);
    return availableUsers.filter(user => !permittedUserIds.includes(user.id));
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="w-6 h-6 text-gray-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Connection Permissions</h2>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsGrantModalOpen(true)}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Grant Permission
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Manage user access to connection: <span className="font-medium">{connectionName}</span>
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Permission Levels Info */}
      <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm font-medium text-blue-900 mb-2">Permission Levels:</p>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><span className="font-medium">Owner:</span> Can manage permissions, edit connection, and view data</li>
          <li><span className="font-medium">Editor:</span> Can edit connection and view data</li>
          <li><span className="font-medium">Viewer:</span> Can only view connection and data</li>
        </ul>
      </div>

      {/* Permissions Table */}
      <div className="overflow-x-auto mt-4">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading permissions...</div>
        ) : permissions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No permissions granted yet. Grant permissions to allow users to access this connection.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permission Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Granted By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Granted At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {permissions.map((permission) => (
                <tr key={permission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {getUserName(permission.user_id)}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${getPermissionBadgeColor(permission.permission_level)}`}
                      value={permission.permission_level}
                      onChange={(e) => handleUpdatePermission(
                        permission.user_id,
                        e.target.value as 'owner' | 'editor' | 'viewer'
                      )}
                    >
                      <option value="owner">Owner</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {getUserName(permission.granted_by)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(permission.granted_at)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleRevokePermission(permission.user_id)}
                      className="text-red-600 hover:text-red-800"
                      title="Revoke Permission"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Grant Permission Modal */}
      <Modal
        isOpen={isGrantModalOpen}
        onClose={() => setIsGrantModalOpen(false)}
        title="Grant Connection Permission"
      >
        <form onSubmit={handleGrantPermission} className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              Grant access to this connection to a specific user. The user must be a member of the current workspace.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={grantFormData.user_id}
              onChange={(e) => setGrantFormData({ ...grantFormData, user_id: parseInt(e.target.value) })}
              required
            >
              <option value={0}>Select a user...</option>
              {getAvailableUsersForGrant().map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Permission Level</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={grantFormData.permission_level}
              onChange={(e) => setGrantFormData({ ...grantFormData, permission_level: e.target.value as 'owner' | 'editor' | 'viewer' })}
            >
              <option value="viewer">Viewer - Can view connection and data</option>
              <option value="editor">Editor - Can edit and view</option>
              <option value="owner">Owner - Full access including permission management</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="secondary" type="button" onClick={() => setIsGrantModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Grant Permission
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
