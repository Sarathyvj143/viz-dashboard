import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartBarIcon, ShareIcon, TrashIcon } from '@heroicons/react/24/outline';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';
import { dashboardsApi } from '../api/dashboards';
import { Dashboard } from '../types/dashboard';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { getErrorMessage } from '../utils/errors';

export default function DashboardList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboards();
  }, []);

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardsApi.getAll();
      setDashboards(data);
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to load dashboards. Please try again.');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this dashboard?')) {
      return;
    }

    try {
      await dashboardsApi.delete(id);
      setDashboards(dashboards.filter((d) => d.id !== id));
      showToast('Dashboard deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete dashboard. Please try again.', 'error');
    }
  };

  const canEdit = (dashboard: Dashboard) => {
    return user?.role === 'admin' || dashboard.created_by === user?.id;
  };

  const canDelete = (dashboard: Dashboard) => {
    return user?.role === 'admin' || dashboard.created_by === user?.id;
  };

  if (loading) {
    return (
      <div>
        <Header
          title="Dashboards"
          subtitle="Manage and view your dashboards"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboards...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header
          title="Dashboards"
          subtitle="Manage and view your dashboards"
        />
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <Button onClick={fetchDashboards} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (dashboards.length === 0) {
    return (
      <div>
        <Header
          title="Dashboards"
          subtitle="Manage and view your dashboards"
          actions={
            (user?.role === 'admin' || user?.role === 'editor') && (
              <Button onClick={() => navigate('/dashboards/new')}>
                Create Dashboard
              </Button>
            )
          }
        />
        <div className="p-6">
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No dashboards</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new dashboard.</p>
            {(user?.role === 'admin' || user?.role === 'editor') && (
              <div className="mt-6">
                <Button onClick={() => navigate('/dashboards/new')}>
                  Create Dashboard
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Dashboards"
        subtitle="Manage and view your dashboards"
        actions={
          (user?.role === 'admin' || user?.role === 'editor') && (
            <Button onClick={() => navigate('/dashboards/new')}>
              Create Dashboard
            </Button>
          )
        }
      />
      <div className="p-4 sm:p-6">
        {/* Mobile view - Cards */}
        <div className="block md:hidden space-y-4">
          {dashboards.map((dashboard) => (
            <div
              key={dashboard.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              onClick={() => navigate(`/dashboards/${dashboard.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900 flex-1">
                  {dashboard.name}
                </h3>
                {dashboard.is_public && (
                  <ShareIcon className="ml-2 h-5 w-5 text-blue-500 flex-shrink-0" />
                )}
              </div>

              {dashboard.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {dashboard.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>Updated {new Date(dashboard.updated_at).toLocaleDateString()}</span>
                {dashboard.public_access_count > 0 && (
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    {dashboard.public_access_count} views
                  </span>
                )}
              </div>

              {canDelete(dashboard) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(dashboard.id);
                  }}
                  className="w-full flex items-center justify-center gap-1 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded px-3 py-2 hover:bg-red-50 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete Dashboard
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Desktop view - Table */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dashboard Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboards.map((dashboard) => (
                  <tr
                    key={dashboard.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/dashboards/${dashboard.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ChartBarIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div className="text-sm font-medium text-gray-900">
                          {dashboard.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {dashboard.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {dashboard.is_public ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <ShareIcon className="h-3 w-3 mr-1" />
                          Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Private
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dashboard.public_access_count > 0 ? dashboard.public_access_count : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(dashboard.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {canDelete(dashboard) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(dashboard.id);
                          }}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
