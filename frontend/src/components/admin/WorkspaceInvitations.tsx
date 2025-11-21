import { useState, useEffect } from 'react';
import { workspacesApi, WorkspaceMember, InviteMemberRequest } from '../../api/workspaces';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Dropdown from '../common/Dropdown';
import { PlusIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { formatDateOnly } from '../../utils/uiHelpers';
import { getApiErrorMessage } from '../../utils/errorHandling';
import { UI_CONFIG } from '../../constants/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { ROLE_OPTIONS } from '../../constants/dropdownOptions';

interface WorkspaceInvitationsProps {
  workspaceId: number;
  workspaceName: string;
}

export default function WorkspaceInvitations({ workspaceId, workspaceName }: WorkspaceInvitationsProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles();
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
    <div className="rounded-lg shadow-md" style={{ backgroundColor: theme.colors.bgPrimary }}>
      {/* Header */}
      <div className="p-6" style={styles.borderBottom()}>
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
            <thead style={styles.table.header}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={styles.table.headerCell}>
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={styles.table.headerCell}>
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={styles.table.headerCell}>
                  Joined Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={styles.table.headerCell}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody style={styles.table.body}>
              {members.map((member) => (
                <tr key={member.id} style={styles.table.row}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    User #{member.user_id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-48">
                      <Dropdown
                        options={ROLE_OPTIONS}
                        value={member.role}
                        onChange={(value) => value && handleUpdateRole(member.user_id, value)}
                      />
                    </div>
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
          <div className="p-4 rounded-md" style={styles.statusBox('info')}>
            <p className="text-sm" style={styles.text.info}>
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

          <Dropdown
            label="Role"
            options={ROLE_OPTIONS}
            value={inviteFormData.role}
            onChange={(value) => setInviteFormData({ ...inviteFormData, role: value ?? 'viewer' })}
          />

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
