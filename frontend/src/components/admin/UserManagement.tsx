import { useState, useEffect } from 'react';
import { usersApi, UserListItem, UserCreate, UserUpdate, UserDetailResponse } from '../../api/users';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Dropdown from '../common/Dropdown';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, KeyIcon } from '@heroicons/react/24/outline';
import { useToastStore } from '../../store/toastStore';
import { formatDate, getRoleBadgeStyles } from '../../utils/uiHelpers';
import { getApiErrorMessage } from '../../utils/errorHandling';
import { ThemedIcon } from '../../utils/iconColors';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme } from '../../contexts/ThemeContext';
import { ROLE_OPTIONS, STATUS_OPTIONS } from '../../constants/dropdownOptions';

interface UserFormData {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'editor' | 'viewer';
}

interface EditFormData {
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  is_active: boolean;
}

export default function UserManagement() {
  const { showToast } = useToastStore();
  const styles = useThemedStyles();
  const { theme } = useTheme();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'admin' | 'editor' | 'viewer' | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetailResponse | null>(null);

  // Form states
  const [createFormData, setCreateFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    role: 'viewer'
  });
  const [editFormData, setEditFormData] = useState<EditFormData>({
    email: '',
    role: 'viewer',
    is_active: true
  });
  const [newPassword, setNewPassword] = useState('');
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.list({
        page,
        page_size: 20,
        search: search || undefined,
        role: roleFilter || undefined,
        is_active: activeFilter
      });
      setUsers(response.users);
      setTotal(response.total);
      setTotalPages(response.total_pages);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, search, roleFilter, activeFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userData: UserCreate = {
        username: createFormData.username,
        email: createFormData.email,
        password: createFormData.password,
        role: createFormData.role
      };
      await usersApi.create(userData);
      setIsCreateModalOpen(false);
      setCreateFormData({ username: '', email: '', password: '', role: 'viewer' });
      loadUsers();
      showToast('User created successfully', 'success');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create user'));
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const updateData: UserUpdate = {
        email: editFormData.email !== selectedUser.email ? editFormData.email : undefined,
        role: editFormData.role !== selectedUser.role ? editFormData.role : undefined,
        is_active: editFormData.is_active !== selectedUser.is_active ? editFormData.is_active : undefined
      };
      await usersApi.update(selectedUser.id, updateData);
      setIsEditModalOpen(false);
      setSelectedUser(null);
      loadUsers();
      showToast('User updated successfully', 'success');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update user'));
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      await usersApi.delete(userId);
      loadUsers();
      showToast('User deactivated successfully', 'success');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to deactivate user'));
    }
  };

  const handleViewUser = async (user: UserListItem) => {
    try {
      const details = await usersApi.getById(user.id);
      setUserDetails(details);
      setIsViewModalOpen(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load user details'));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await usersApi.adminResetPassword(selectedUser.id, { new_password: newPassword });
      setIsResetPasswordModalOpen(false);
      setSelectedUser(null);
      setNewPassword('');
      showToast('Password reset successfully', 'success');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to reset password'));
    }
  };

  const openEditModal = (user: UserListItem) => {
    setSelectedUser(user);
    setEditFormData({
      email: user.email,
      role: user.role,
      is_active: user.is_active
    });
    setIsEditModalOpen(true);
  };

  const openResetPasswordModal = (user: UserListItem) => {
    setSelectedUser(user);
    setNewPassword('');
    setIsResetPasswordModalOpen(true);
  };

  return (
    <div className="rounded-lg shadow-md" style={{ backgroundColor: theme.colors.bgPrimary }}>
      {/* Header */}
      <div className="p-3 sm:p-4 md:p-6" style={{ ...styles.borderBottom() }}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold" style={{ color: theme.colors.textPrimary }}>User Management</h2>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Create User</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 sm:gap-3 md:gap-4 flex-wrap">
          <div className="flex-1 min-w-[150px] sm:min-w-[200px]">
            <Input
              type="text"
              placeholder="Search by username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="min-w-[140px] sm:min-w-[180px] md:min-w-[200px]">
            <Dropdown
              options={ROLE_OPTIONS}
              value={roleFilter}
              onChange={(value) => setRoleFilter(value)}
              placeholder="All Roles"
              clearable
            />
          </div>
          <div className="min-w-[130px] sm:min-w-[160px] md:min-w-[180px]">
            <Dropdown
              options={STATUS_OPTIONS}
              value={activeFilter}
              onChange={(value) => setActiveFilter(value)}
              placeholder="All Status"
              clearable
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-3 sm:mx-4 md:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 rounded-md" style={styles.statusBox('error')}>
          <p className="text-sm sm:text-base" style={styles.text.error}>{error}</p>
        </div>
      )}

      {/* User Table */}
      <div>
        {loading ? (
          <div className="p-8 sm:p-12 text-center text-sm sm:text-base" style={{ color: theme.colors.textSecondary }}>Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-sm sm:text-base" style={{ color: theme.colors.textSecondary }}>No users found</div>
        ) : (
          <>
            {/* Mobile view - Cards */}
            <div className="block md:hidden space-y-3 sm:space-y-4 p-3 sm:p-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-lg p-3 sm:p-4 shadow-sm"
                  style={{ backgroundColor: theme.colors.bgSecondary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary }}
                >
                  <div className="space-y-2 sm:space-y-3">
                    {/* User Info */}
                    <div>
                      <div className="text-sm sm:text-base font-semibold break-words" style={{ color: theme.colors.textPrimary }}>{user.username}</div>
                      <div className="text-xs sm:text-sm break-words" style={{ color: theme.colors.textSecondary }}>{user.email}</div>
                    </div>

                    {/* Badges Row */}
                    <div className="flex flex-wrap gap-2">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={getRoleBadgeStyles(user.role, theme)}
                      >
                        {user.role}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={user.is_active ? styles.badge('success') : styles.badge('error')}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Details Row */}
                    <div className="flex justify-between items-center text-xs sm:text-sm" style={{ color: theme.colors.textSecondary }}>
                      <span>{user.workspace_count} workspace{user.workspace_count !== 1 ? 's' : ''}</span>
                      <span className="truncate ml-2">{formatDate(user.last_login)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2 border-t" style={{ borderColor: theme.colors.borderPrimary }}>
                      <button
                        onClick={() => handleViewUser(user)}
                        className="hover:opacity-80 transition-opacity"
                        title="View Details"
                        aria-label="View user details"
                      >
                        <ThemedIcon Icon={EyeIcon} variant="info" className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openEditModal(user)}
                        className="hover:opacity-80 transition-opacity"
                        title="Edit User"
                        aria-label="Edit user"
                      >
                        <ThemedIcon Icon={PencilIcon} variant="accent" className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openResetPasswordModal(user)}
                        className="hover:opacity-80 transition-opacity"
                        title="Reset Password"
                        aria-label="Reset password"
                      >
                        <ThemedIcon Icon={KeyIcon} variant="warning" className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="hover:opacity-80 transition-opacity"
                        title="Deactivate User"
                        aria-label="Deactivate user"
                      >
                        <ThemedIcon Icon={TrashIcon} variant="error" className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop view - Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full w-full" style={{ tableLayout: 'auto' }}>
                <thead style={styles.table.header}>
                  <tr>
                    <th className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-left text-xs md:text-sm font-medium uppercase tracking-wider whitespace-nowrap" style={{ ...styles.table.headerCell, width: 'auto' }}>
                      User
                    </th>
                    <th className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-left text-xs md:text-sm font-medium uppercase tracking-wider whitespace-nowrap" style={{ ...styles.table.headerCell, width: 'auto' }}>
                      Role
                    </th>
                    <th className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-left text-xs md:text-sm font-medium uppercase tracking-wider whitespace-nowrap" style={{ ...styles.table.headerCell, width: 'auto' }}>
                      Status
                    </th>
                    <th className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-left text-xs md:text-sm font-medium uppercase tracking-wider whitespace-nowrap" style={{ ...styles.table.headerCell, width: 'auto' }}>
                      Workspaces
                    </th>
                    <th className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-left text-xs md:text-sm font-medium uppercase tracking-wider whitespace-nowrap" style={{ ...styles.table.headerCell, width: 'auto' }}>
                      Last Login
                    </th>
                    <th className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-left text-xs md:text-sm font-medium uppercase tracking-wider whitespace-nowrap" style={{ ...styles.table.headerCell, width: 'auto' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody style={styles.table.body}>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      style={{
                        ...styles.table.row,
                        ...(hoveredRowId === user.id ? styles.table.rowHover : {}),
                      }}
                      onMouseEnter={() => setHoveredRowId(user.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                    >
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 whitespace-nowrap">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs md:text-sm lg:text-base font-medium truncate" style={styles.table.cell}>{user.username}</span>
                          <span className="text-xs md:text-sm lg:text-base truncate" style={styles.table.cellSecondary}>{user.email}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium"
                          style={getRoleBadgeStyles(user.role, theme)}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium" style={user.is_active ? styles.badge('success') : styles.badge('error')}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm lg:text-base whitespace-nowrap" style={styles.table.cell}>
                        {user.workspace_count}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm lg:text-base whitespace-nowrap" style={styles.table.cellSecondary}>
                        {formatDate(user.last_login)}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4">
                        <div className="flex gap-1 md:gap-2">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="hover:opacity-80 transition-opacity"
                            title="View Details"
                            aria-label="View user details"
                          >
                            <ThemedIcon Icon={EyeIcon} variant="info" className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="hover:opacity-80 transition-opacity"
                            title="Edit User"
                            aria-label="Edit user"
                          >
                            <ThemedIcon Icon={PencilIcon} variant="accent" className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                          <button
                            onClick={() => openResetPasswordModal(user)}
                            className="hover:opacity-80 transition-opacity"
                            title="Reset Password"
                            aria-label="Reset password"
                          >
                            <ThemedIcon Icon={KeyIcon} variant="warning" className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="hover:opacity-80 transition-opacity"
                            title="Deactivate User"
                            aria-label="Deactivate user"
                          >
                            <ThemedIcon Icon={TrashIcon} variant="error" className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: `1px solid ${theme.colors.borderPrimary}` }}>
          <div className="text-xs sm:text-sm" style={{ color: theme.colors.textPrimary }}>
            Showing {users.length} of {total} users
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            <span className="px-2 sm:px-4 py-2 text-xs sm:text-sm" style={{ color: theme.colors.textPrimary }}>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="text-xs sm:text-sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Username"
            type="text"
            required
            value={createFormData.username}
            onChange={(e) => setCreateFormData({ ...createFormData, username: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            required
            value={createFormData.email}
            onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            required
            value={createFormData.password}
            onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
          />
          <Dropdown
            label="Role"
            options={ROLE_OPTIONS}
            value={createFormData.role}
            onChange={(value) => setCreateFormData({ ...createFormData, role: value ?? 'viewer' })}
          />
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="secondary" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
      >
        <form onSubmit={handleEditUser} className="space-y-4">
          <div className="mb-4 p-4 rounded-md" style={{ backgroundColor: theme.colors.bgSecondary }}>
            <p className="text-sm" style={styles.text.secondary}>
              <span className="font-medium">Username:</span> {selectedUser?.username}
            </p>
          </div>
          <Input
            label="Email"
            type="email"
            required
            value={editFormData.email}
            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
          />
          <Dropdown
            label="Role"
            options={ROLE_OPTIONS}
            value={editFormData.role}
            onChange={(value) => setEditFormData({ ...editFormData, role: value ?? 'viewer' })}
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={editFormData.is_active}
              onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
              className="h-4 w-4 rounded"
              style={{
                accentColor: theme.colors.accentPrimary,
                borderColor: theme.colors.borderPrimary
              }}
            />
            <label htmlFor="is_active" className="ml-2 block text-sm" style={{ color: theme.colors.textPrimary }}>
              Active
            </label>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="secondary" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* View User Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="User Details"
      >
        {userDetails && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>Username</label>
                <p style={{ color: theme.colors.textPrimary }}>{userDetails.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>Email</label>
                <p style={{ color: theme.colors.textPrimary }}>{userDetails.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>Role</label>
                <p>
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={getRoleBadgeStyles(userDetails.role, theme)}
                  >
                    {userDetails.role}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>Status</label>
                <p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={userDetails.is_active ? styles.badge('success') : styles.badge('error')}>
                    {userDetails.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>Email Verified</label>
                <p style={{ color: theme.colors.textPrimary }}>{userDetails.email_verified ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>Created At</label>
                <p style={{ color: theme.colors.textPrimary }}>{formatDate(userDetails.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>Last Login</label>
                <p style={{ color: theme.colors.textPrimary }}>{formatDate(userDetails.last_login)}</p>
              </div>
            </div>

            {userDetails.workspaces.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: theme.colors.textSecondary }}>Workspace Memberships</label>
                <div className="rounded-md overflow-hidden" style={{ border: `1px solid ${theme.colors.borderPrimary}` }}>
                  <table className="w-full">
                    <thead style={styles.table.header}>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium" style={styles.table.headerCell}>Workspace</th>
                        <th className="px-4 py-2 text-left text-xs font-medium" style={styles.table.headerCell}>Role</th>
                        <th className="px-4 py-2 text-left text-xs font-medium" style={styles.table.headerCell}>Joined</th>
                      </tr>
                    </thead>
                    <tbody style={styles.table.body}>
                      {userDetails.workspaces.map((ws) => (
                        <tr key={ws.workspace_id} style={styles.table.row}>
                          <td className="px-4 py-2 text-sm" style={styles.table.cell}>{ws.workspace_name}</td>
                          <td className="px-4 py-2">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                              style={getRoleBadgeStyles(ws.role, theme)}
                            >
                              {ws.role}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm" style={styles.table.cellSecondary}>{formatDate(ws.joined_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title="Reset User Password"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="mb-4 p-4 rounded-md" style={styles.statusBox('warning')}>
            <p className="text-sm" style={styles.text.warning}>
              You are about to reset the password for <span className="font-medium">{selectedUser?.username}</span>
            </p>
          </div>
          <Input
            label="New Password"
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password (min 8 characters)"
          />
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="secondary" type="button" onClick={() => setIsResetPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Reset Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
