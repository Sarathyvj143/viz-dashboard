import { useState, useEffect } from 'react';
import { workspacesApi, WorkspaceMember, InviteMemberRequest } from '../../api/workspaces';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import { PlusIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { formatDateOnly, getRoleBadgeColor } from '../../utils/uiHelpers';
import { getApiErrorMessage } from '../../utils/errorHandling';
import { UI_CONFIG } from '../../constants/ui';

interface WorkspaceInvitationsProps {
  workspaceId: number;
  workspaceName: string;
}

export default function WorkspaceInvitations({ workspaceId, workspaceName }: WorkspaceInvitationsProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Form state
  const [inviteFormData, setInviteFormData] = useState<InviteMemberRequest>({
    email: '',
    role: 'viewer'
  });

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workspacesApi.listMembers(workspaceId);
      setMembers(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load workspace members'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [workspaceId]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const result = await workspacesApi.inviteMember(workspaceId, inviteFormData);
      setSuccessMessage(`Invitation sent to ${result.email} with ${result.role} role`);
      setIsInviteModalOpen(false);
      setInviteFormData({ email: '', role: 'viewer' });

      setTimeout(() => setSuccessMessage(null), UI_CONFIG.MESSAGE_DURATION_MS);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send invitation'));
    }
  };

  const handleRemoveMember = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to remove ${username} from this workspace?`)) return;

    try {
      await workspacesApi.removeMember(workspaceId, userId);
      setSuccessMessage('Member removed successfully');
      loadMembers();

      setTimeout(() => setSuccessMessage(null), UI_CONFIG.MESSAGE_DURATION_MS);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to remove member'));
    }
  };

  const handleUpdateRole = async (userId: number, newRole: 'admin' | 'editor' | 'viewer') => {
    try {
      await workspacesApi.updateMemberRole(workspaceId, userId, newRole);
      setSuccessMessage('Member role updated successfully');
      loadMembers();

      setTimeout(() => setSuccessMessage(null), UI_CONFIG.MESSAGE_DURATION_MS);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update member role'));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <UserGroupIcon className="w-6 h-6 text-gray-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Workspace Members</h2>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Invite Member
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Manage members for workspace: <span className="font-medium">{workspaceName}</span>
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

      {/* Members Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No members in this workspace</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    User #{member.user_id}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${getRoleBadgeColor(member.role)}`}
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.user_id, e.target.value as 'admin' | 'editor' | 'viewer')}
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDateOnly(member.joined_at)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleRemoveMember(member.user_id, `User #${member.user_id}`)}
                      className="text-red-600 hover:text-red-800"
                      title="Remove Member"
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

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Member to Workspace"
      >
        <form onSubmit={handleInviteMember} className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              An invitation email will be sent to the specified email address with a link to join this workspace.
            </p>
          </div>

          <Input
            label="Email Address"
            type="email"
            required
            value={inviteFormData.email}
            onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
            placeholder="user@example.com"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={inviteFormData.role}
              onChange={(e) => setInviteFormData({ ...inviteFormData, role: e.target.value as 'admin' | 'editor' | 'viewer' })}
            >
              <option value="viewer">Viewer - Can view resources</option>
              <option value="editor">Editor - Can create and edit resources</option>
              <option value="admin">Admin - Full access including member management</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="secondary" type="button" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
