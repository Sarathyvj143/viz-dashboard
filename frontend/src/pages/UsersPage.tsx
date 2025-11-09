import { useState } from 'react';
import Header from '../components/layout/Header';
import UserManagement from '../components/admin/UserManagement';
import WorkspaceInvitations from '../components/admin/WorkspaceInvitations';
import { useAuthStore } from '../store/authStore';

export default function UsersPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users');

  // Get current workspace ID from user
  const currentWorkspaceId = user?.current_workspace_id || 1;
  const workspaceName = 'Current Workspace'; // You can fetch this from workspace API

  return (
    <div>
      <Header
        title="User Management"
        subtitle="Manage users, roles, and permissions"
      />
      <div className="p-6">
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('users')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              System Users
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === 'invitations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Workspace Invitations
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'users' && (
            <div>
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">System-wide user management:</span> Create and manage users across the entire platform.
                  Only system administrators can access this section.
                </p>
              </div>
              <UserManagement />
            </div>
          )}

          {activeTab === 'invitations' && (
            <div>
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
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
