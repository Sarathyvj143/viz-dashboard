import { useState, useEffect } from 'react';
import { connectionPermissionsApi, ConnectionPermission, ConnectionPermissionCreate } from '../../api/connectionPermissions';
import { usersApi, UserListItem } from '../../api/users';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Alert from '../common/Alert';
import Icon from '../common/Icon';
import Dropdown from '../common/Dropdown';
import { PlusIcon, TrashIcon, ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/uiHelpers';
import { getApiErrorMessage } from '../../utils/errorHandling';
import { UI_CONFIG } from '../../constants/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { PERMISSION_LEVEL_OPTIONS } from '../../constants/dropdownOptions';

interface ConnectionPermissionsProps {
  connectionId: number;
  connectionName: string;
}

export default function ConnectionPermissions({ connectionId, connectionName }: ConnectionPermissionsProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles();
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
    <div className="rounded-lg shadow-md" style={{ backgroundColor: theme.colors.bgPrimary }}>
      {/* Header */}
      <div className="p-6" style={styles.borderBottom()}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <Icon Icon={ShieldCheckIcon} variant="secondary" size="lg" />
            <h2 style={styles.typography.h2}>Connection Permissions</h2>
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
        <p style={styles.typography.smallSecondary}>
          Manage user access to connection: <span className="font-medium">{connectionName}</span>
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mx-6 mt-4">
          <Alert type="success" message={successMessage} dismissible onClose={() => setSuccessMessage(null)} />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4">
          <Alert type="error" message={error} dismissible onClose={() => setError(null)} />
        </div>
      )}

      {/* Permission Levels Info */}
      <div className="mx-6 mt-4 p-4 rounded-md" style={styles.statusBox('info')}>
        <p className="text-sm font-medium mb-2" style={styles.text.info}>Permission Levels:</p>
        <ul className="text-sm space-y-1" style={styles.text.info}>
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
            <thead style={styles.table.header}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={styles.table.headerCell}>
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={styles.table.headerCell}>
                  Permission Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={styles.table.headerCell}>
                  Granted By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={styles.table.headerCell}>
                  Granted At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={styles.table.headerCell}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody style={styles.table.body}>
              {permissions.map((permission) => (
                <tr key={permission.id} style={styles.table.row}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {getUserName(permission.user_id)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-48">
                      <Dropdown
                        options={PERMISSION_LEVEL_OPTIONS}
                        value={permission.permission_level}
                        onChange={(value) => value && handleUpdatePermission(permission.user_id, value)}
                      />
                    </div>
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
          <div className="p-4 rounded-md" style={styles.statusBox('info')}>
            <p className="text-sm" style={styles.text.info}>
              Grant access to this connection to a specific user. The user must be a member of the current workspace.
            </p>
          </div>

          <Dropdown
            label="User"
            options={getAvailableUsersForGrant().map(user => ({
              value: user.id,
              label: `${user.username} (${user.email})`,
              icon: UserIcon
            }))}
            value={grantFormData.user_id === 0 ? undefined : grantFormData.user_id}
            onChange={(value) => setGrantFormData({ ...grantFormData, user_id: value || 0 })}
            placeholder="Select a user..."
            searchable
          />

          <Dropdown
            label="Permission Level"
            options={PERMISSION_LEVEL_OPTIONS}
            value={grantFormData.permission_level}
            onChange={(value) => setGrantFormData({ ...grantFormData, permission_level: value ?? 'viewer' })}
          />

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
