import { useState, useEffect } from 'react';
import { connectionPermissionsApi, ConnectionPermission, ConnectionPermissionCreate } from '../../api/connectionPermissions';
import { usersApi, UserListItem } from '../../api/users';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Alert from '../common/Alert';
import Icon from '../common/Icon';
import Dropdown from '../common/Dropdown';
import ResponsiveTable from '../common/ResponsiveTable';
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
      <div className="p-3 sm:p-4 md:p-6" style={styles.borderBottom()}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-2 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Icon Icon={ShieldCheckIcon} variant="secondary" size="lg" className="w-5 h-5 sm:w-6 sm:h-6" />
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold" style={{ color: theme.colors.textPrimary }}>
              Connection Permissions
            </h2>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsGrantModalOpen(true)}
            className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Grant Permission</span>
            <span className="sm:hidden">Grant</span>
          </Button>
        </div>
        <p className="text-xs sm:text-sm" style={{ color: theme.colors.textSecondary }}>
          Manage user access to connection: <span className="font-medium">{connectionName}</span>
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mx-3 sm:mx-4 md:mx-6 mt-3 sm:mt-4">
          <Alert type="success" message={successMessage} dismissible onClose={() => setSuccessMessage(null)} />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mx-3 sm:mx-4 md:mx-6 mt-3 sm:mt-4">
          <Alert type="error" message={error} dismissible onClose={() => setError(null)} />
        </div>
      )}

      {/* Permission Levels Info */}
      <div className="mx-3 sm:mx-4 md:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 rounded-md" style={styles.statusBox('info')}>
        <p className="text-xs sm:text-sm font-medium mb-2" style={styles.text.info}>Permission Levels:</p>
        <ul className="text-xs sm:text-sm space-y-1" style={styles.text.info}>
          <li><span className="font-medium">Owner:</span> Can manage permissions, edit connection, and view data</li>
          <li><span className="font-medium">Editor:</span> Can edit connection and view data</li>
          <li><span className="font-medium">Viewer:</span> Can only view connection and data</li>
        </ul>
      </div>

      {/* Permissions Table */}
      <div className="mt-3 sm:mt-4">
        <ResponsiveTable
          data={permissions}
          loading={loading}
          loadingMessage="Loading permissions..."
          emptyMessage="No permissions granted yet. Grant permissions to allow users to access this connection."
          getRowKey={(permission) => permission.id}
          columns={[
            {
              key: 'user',
              label: 'User',
              width: '25%',
              minWidth: '200px',
              render: (permission) => (
                <span className="text-xs md:text-sm" style={styles.table.cell}>
                  {getUserName(permission.user_id)}
                </span>
              )
            },
            {
              key: 'permission_level',
              label: 'Permission Level',
              width: '25%',
              minWidth: '200px',
              render: (permission) => (
                <div className="w-full max-w-[180px] md:max-w-[200px] lg:max-w-[240px]">
                  <Dropdown
                    options={PERMISSION_LEVEL_OPTIONS}
                    value={permission.permission_level}
                    onChange={(value) => value && handleUpdatePermission(permission.user_id, value)}
                  />
                </div>
              )
            },
            {
              key: 'granted_by',
              label: 'Granted By',
              width: '20%',
              minWidth: '150px',
              render: (permission) => (
                <span className="text-xs md:text-sm" style={styles.table.cellSecondary}>
                  {getUserName(permission.granted_by)}
                </span>
              )
            },
            {
              key: 'granted_at',
              label: 'Granted At',
              width: '20%',
              minWidth: '120px',
              render: (permission) => (
                <span className="text-xs md:text-sm" style={styles.table.cellSecondary}>
                  {formatDate(permission.granted_at)}
                </span>
              )
            },
            {
              key: 'actions',
              label: 'Actions',
              width: '10%',
              minWidth: '80px',
              align: 'center',
              render: (permission) => (
                <button
                  onClick={() => handleRevokePermission(permission.user_id)}
                  className="hover:opacity-80 active:opacity-60 transition-opacity"
                  title="Revoke Permission"
                  aria-label="Revoke permission"
                >
                  <TrashIcon className="w-4 h-4 md:w-5 md:h-5" style={{ color: theme.colors.error }} />
                </button>
              )
            }
          ]}
          mobileCardRender={(permission) => (
            <div className="space-y-3">
              {/* User */}
              <div>
                <div className="text-xs" style={{ color: theme.colors.textSecondary }}>User</div>
                <div className="text-sm sm:text-base font-medium break-words" style={{ color: theme.colors.textPrimary }}>
                  {getUserName(permission.user_id)}
                </div>
              </div>

              {/* Permission Level Dropdown */}
              <div>
                <div className="text-xs mb-1" style={{ color: theme.colors.textSecondary }}>Permission Level</div>
                <Dropdown
                  options={PERMISSION_LEVEL_OPTIONS}
                  value={permission.permission_level}
                  onChange={(value) => value && handleUpdatePermission(permission.user_id, value)}
                />
              </div>

              {/* Granted Details */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t" style={{ borderColor: theme.colors.borderPrimary }}>
                <div>
                  <div className="text-xs" style={{ color: theme.colors.textSecondary }}>Granted By</div>
                  <div className="text-xs sm:text-sm truncate" style={{ color: theme.colors.textPrimary }}>
                    {getUserName(permission.granted_by)}
                  </div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: theme.colors.textSecondary }}>Granted At</div>
                  <div className="text-xs sm:text-sm" style={{ color: theme.colors.textPrimary }}>
                    {formatDate(permission.granted_at)}
                  </div>
                </div>
              </div>

              {/* Revoke Button */}
              <div className="pt-2 border-t" style={{ borderColor: theme.colors.borderPrimary }}>
                <button
                  onClick={() => handleRevokePermission(permission.user_id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md hover:opacity-90 active:opacity-80 transition-opacity"
                  style={{ backgroundColor: theme.colors.error, color: 'white' }}
                  aria-label="Revoke permission"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Revoke Permission</span>
                </button>
              </div>
            </div>
          )}
        />
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
