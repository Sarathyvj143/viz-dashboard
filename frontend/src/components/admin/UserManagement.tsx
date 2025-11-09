import { useState, useEffect } from 'react';
import { usersApi, UserListItem, UserCreate, UserUpdate, UserDetailResponse } from '../../api/users';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, KeyIcon } from '@heroicons/react/24/outline';
import { useToastStore } from '../../store/toastStore';
import { formatDate, getRoleBadgeColor } from '../../utils/uiHelpers';
import { getApiErrorMessage } from '../../utils/errorHandling';

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
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'admin' | 'editor' | 'viewer' | ''>('');
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
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">User Management</h2>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Create User
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder="Search by username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'admin' | 'editor' | 'viewer' | '')}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={activeFilter === undefined ? '' : activeFilter.toString()}
            onChange={(e) => setActiveFilter(e.target.value === '' ? undefined : e.target.value === 'true')}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* User Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No users found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workspaces
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{user.username}</span>
                      <span className="text-sm text-gray-500">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.workspace_count}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(user.last_login)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-yellow-600 hover:text-yellow-800"
                        title="Edit User"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openResetPasswordModal(user)}
                        className="text-green-600 hover:text-green-800"
                        title="Reset Password"
                      >
                        <KeyIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Deactivate User"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {users.length} of {total} users
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={createFormData.role}
              onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as 'admin' | 'editor' | 'viewer' })}
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
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
          <div className="mb-4 p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={editFormData.role}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'admin' | 'editor' | 'viewer' })}
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={editFormData.is_active}
              onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
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
                <label className="text-sm font-medium text-gray-500">Username</label>
                <p className="text-gray-900">{userDetails.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{userDetails.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Role</label>
                <p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(userDetails.role)}`}>
                    {userDetails.role}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    userDetails.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {userDetails.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email Verified</label>
                <p className="text-gray-900">{userDetails.email_verified ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created At</label>
                <p className="text-gray-900">{formatDate(userDetails.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Login</label>
                <p className="text-gray-900">{formatDate(userDetails.last_login)}</p>
              </div>
            </div>

            {userDetails.workspaces.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Workspace Memberships</label>
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Workspace</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Role</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {userDetails.workspaces.map((ws) => (
                        <tr key={ws.workspace_id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{ws.workspace_name}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(ws.role)}`}>
                              {ws.role}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">{formatDate(ws.joined_at)}</td>
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
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
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
