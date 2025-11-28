import { useState } from 'react';
import Header from '../components/layout/Header';
import UserManagement from '../components/admin/UserManagement';
import WorkspaceInvitations from '../components/admin/WorkspaceInvitations';
import { useAuthStore } from '../store/authStore';
import { getCurrentWorkspaceId } from '../config/env';
import { useTheme } from '../contexts/ThemeContext';
import { useThemedHover } from '../hooks/useThemedHover';
import { useThemedStyles } from '../hooks/useThemedStyles';

export default function UsersPage() {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const styles = useThemedStyles();
  const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users');

  // Memoized hover handlers for tabs
  const usersTabHover = useThemedHover({
    hoverColor: theme.colors.textPrimary,
    normalColor: theme.colors.textSecondary,
    hoverBorder: theme.colors.borderSecondary,
    normalBorder: 'transparent',
    condition: activeTab !== 'users',
  });

  const invitationsTabHover = useThemedHover({
    hoverColor: theme.colors.textPrimary,
    normalColor: theme.colors.textSecondary,
    hoverBorder: theme.colors.borderSecondary,
    normalBorder: 'transparent',
    condition: activeTab !== 'invitations',
  });

  // Get current workspace ID
  // In development: uses VITE_DEV_DEFAULT_WORKSPACE_ID from .env if user doesn't have one
  // In production: requires user to have current_workspace_id set after registration
  const currentWorkspaceId = getCurrentWorkspaceId(user?.current_workspace_id) || 1;
  const workspaceName = 'Current Workspace'; // You can fetch this from workspace API

  return (
    <div>
      <Header
        title="User Management"
        subtitle="Manage users, roles, and permissions"
      />
      <div className="p-3 sm:p-4 md:p-6 w-full">
        {/* Tab Navigation */}
        <div className="mb-4 sm:mb-6" style={styles.borderBottom()}>
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('users')}
              className="whitespace-nowrap py-3 sm:py-4 px-1 font-medium text-xs sm:text-sm"
              style={{
                borderBottomColor: activeTab === 'users' ? theme.colors.accentPrimary : 'transparent',
                borderBottomWidth: '2px',
                borderBottomStyle: 'solid',
                color: activeTab === 'users' ? theme.colors.accentPrimary : theme.colors.textSecondary,
              }}
              {...usersTabHover}
            >
              System Users
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className="whitespace-nowrap py-3 sm:py-4 px-1 font-medium text-xs sm:text-sm"
              style={{
                borderBottomColor: activeTab === 'invitations' ? theme.colors.accentPrimary : 'transparent',
                borderBottomWidth: '2px',
                borderBottomStyle: 'solid',
                color: activeTab === 'invitations' ? theme.colors.accentPrimary : theme.colors.textSecondary,
              }}
              {...invitationsTabHover}
            >
              Workspace Invitations
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-4 sm:mt-6">
          {activeTab === 'users' && (
            <div>
              <div className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg" style={styles.statusBox('info')}>
                <p className="text-xs sm:text-sm" style={styles.text.info}>
                  <span className="font-semibold">System-wide user management:</span> Create and manage users across the entire platform.
                  Only system administrators can access this section.
                </p>
              </div>
              <UserManagement />
            </div>
          )}

          {activeTab === 'invitations' && (
            <div>
              <div className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg" style={styles.statusBox('info')}>
                <p className="text-xs sm:text-sm" style={styles.text.info}>
                  <span className="font-semibold">Workspace invitations:</span> Invite users to join your workspace and manage workspace memberships.
                  Workspace administrators can invite users and assign roles within their workspace.
                </p>
              </div>
              <WorkspaceInvitations
                workspaceId={currentWorkspaceId}
                workspaceName={workspaceName}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
