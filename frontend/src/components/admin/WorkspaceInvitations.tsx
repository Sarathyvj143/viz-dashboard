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
      <div className="p-3 sm:p-4 md:p-6" style={styles.borderBottom()}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-2 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.colors.textSecondary }} />
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold" style={{ color: theme.colors.textPrimary }}>Workspace Members</h2>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Invite Member</span>
            <span className="sm:hidden">Invite</span>
          </Button>
        </div>
        <p className="text-xs sm:text-sm break-words" style={{ color: theme.colors.textSecondary }}>
          Manage members for workspace: <span className="font-medium">{workspaceName}</span>
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mx-3 sm:mx-4 md:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 rounded-md" style={styles.statusBox('success')}>
          <p className="text-sm sm:text-base" style={styles.text.success}>{successMessage}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mx-3 sm:mx-4 md:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 rounded-md" style={styles.statusBox('error')}>
          <p className="text-sm sm:text-base" style={styles.text.error}>{error}</p>
        </div>
      )}

      {/* Members Table */}
      <div>
        {loading ? (
          <div className="p-8 sm:p-12 text-center text-sm sm:text-base" style={{ color: theme.colors.textSecondary }}>Loading members...</div>
        ) : members.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-sm sm:text-base" style={{ color: theme.colors.textSecondary }}>No members in this workspace</div>
        ) : (
          <>
            {/* Mobile view - Cards */}
            <div className="block md:hidden space-y-3 sm:space-y-4 p-3 sm:p-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="rounded-lg p-3 sm:p-4 shadow-sm"
                  style={{ backgroundColor: theme.colors.bgSecondary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary }}
                >
                  <div className="space-y-3">
                    {/* User ID */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs" style={{ color: theme.colors.textSecondary }}>User ID</div>
                        <div className="text-sm sm:text-base font-medium" style={{ color: theme.colors.textPrimary }}>
                          User #{member.user_id}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.user_id, `User #${member.user_id}`)}
                        className="hover:opacity-80 transition-opacity"
                        title="Remove Member"
                        aria-label="Remove member"
                      >
                        <TrashIcon className="w-5 h-5" style={{ color: theme.colors.error }} />
                      </button>
                    </div>

                    {/* Role Dropdown */}
                    <div>
                      <div className="text-xs mb-1" style={{ color: theme.colors.textSecondary }}>Role</div>
                      <Dropdown
                        options={ROLE_OPTIONS}
                        value={member.role}
                        onChange={(value) => value && handleUpdateRole(member.user_id, value)}
                      />
                    </div>

                    {/* Joined Date */}
                    <div className="text-xs sm:text-sm pt-2 border-t" style={{ color: theme.colors.textSecondary, borderColor: theme.colors.borderPrimary }}>
                      Joined: {formatDateOnly(member.joined_at)}
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
                      User ID
                    </th>
                    <th className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-left text-xs md:text-sm font-medium uppercase tracking-wider whitespace-nowrap" style={{ ...styles.table.headerCell, width: 'auto' }}>
                      Role
                    </th>
                    <th className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-left text-xs md:text-sm font-medium uppercase tracking-wider whitespace-nowrap" style={{ ...styles.table.headerCell, width: 'auto' }}>
                      Joined Date
                    </th>
                    <th className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-left text-xs md:text-sm font-medium uppercase tracking-wider whitespace-nowrap" style={{ ...styles.table.headerCell, width: 'auto' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody style={styles.table.body}>
                  {members.map((member) => (
                    <tr key={member.id} style={styles.table.row}>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm lg:text-base whitespace-nowrap" style={styles.table.cell}>
                        User #{member.user_id}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4">
                        <div className="w-full max-w-[180px] md:max-w-[200px] lg:max-w-[240px]">
                          <Dropdown
                            options={ROLE_OPTIONS}
                            value={member.role}
                            onChange={(value) => value && handleUpdateRole(member.user_id, value)}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm lg:text-base whitespace-nowrap" style={styles.table.cellSecondary}>
                        {formatDateOnly(member.joined_at)}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleRemoveMember(member.user_id, `User #${member.user_id}`)}
                          className="hover:opacity-80 transition-opacity"
                          title="Remove Member"
                          aria-label="Remove member"
                        >
                          <TrashIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" style={{ color: theme.colors.error }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
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
