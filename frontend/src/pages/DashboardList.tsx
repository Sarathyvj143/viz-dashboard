import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartBarIcon, ShareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import { useThemedHover } from '../hooks/useThemedHover';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { ThemedIcon } from '../utils/iconColors';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';
import { dashboardsApi } from '../api/dashboards';
import { Dashboard } from '../types/dashboard';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { getErrorMessage } from '../utils/errors';
import { withOpacity } from '../utils/colorHelpers';

export default function DashboardList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();
  const { theme } = useTheme();
  const styles = useThemedStyles();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized hover handlers
  const deleteButtonHoverMobile = useThemedHover({
    hoverBg: withOpacity(theme.colors.error, 10),
    normalBg: 'transparent',
  });

  const tableRowHover = useThemedHover({
    hoverBg: theme.colors.bgTertiary,
    normalBg: 'transparent',
  });

  const deleteButtonHoverDesktop = useThemedHover({
    hoverOpacity: 0.7,
  });

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

  const canDelete = (dashboard: Dashboard) => {
    return user?.role === 'admin' || dashboard.created_by === Number(user?.id);
  };

  if (loading) {
    return (
      <div>
        <Header
          title="Dashboards"
          subtitle="Manage and view your dashboards"
        />
        <div className="flex items-center justify-center h-64">
          <div style={{ color: theme.colors.textSecondary }}>Loading dashboards...</div>
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
          <div className="rounded-lg p-4" style={styles.statusBox('error')}>
            <p style={{ color: theme.colors.error }}>{error}</p>
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
            <ThemedIcon Icon={ChartBarIcon} variant="secondary" className="mx-auto h-12 w-12" />
            <h3 className="mt-2 text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>No dashboards</h3>
            <p className="mt-1 text-sm" style={{ color: theme.colors.textSecondary }}>Get started by creating a new dashboard.</p>
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
              className="rounded-lg p-4 hover:shadow-md transition-shadow"
              style={{
                backgroundColor: theme.colors.bgSecondary,
                borderColor: theme.colors.borderPrimary,
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
              onClick={() => navigate(`/dashboards/${dashboard.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold flex-1" style={{ color: theme.colors.textPrimary }}>
                  {dashboard.name}
                </h3>
                {dashboard.is_public && (
                  <ShareIcon className="ml-2 h-5 w-5 flex-shrink-0" style={{ color: theme.colors.info }} />
                )}
              </div>

              {dashboard.description && (
                <p className="text-sm mb-3 line-clamp-2" style={{ color: theme.colors.textSecondary }}>
                  {dashboard.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs mb-3" style={styles.text.secondary}>
                <span>Updated {new Date(dashboard.updated_at).toLocaleDateString()}</span>
                {dashboard.public_access_count > 0 && (
                  <span className="px-2 py-1 rounded" style={styles.badge('info')}>
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
                  className="w-full flex items-center justify-center gap-1 text-sm rounded px-3 py-2 transition-colors"
                  style={{
                    color: theme.colors.error,
                    ...styles.border.primary,
                    borderColor: theme.colors.error,
                    backgroundColor: 'transparent',
                  }}
                  {...deleteButtonHoverMobile}
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete Dashboard
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Desktop view - Table */}
        <div
          className="hidden md:block rounded-lg overflow-hidden"
          style={{
            backgroundColor: theme.colors.bgSecondary,
            borderColor: theme.colors.borderPrimary,
            borderWidth: '1px',
            borderStyle: 'solid',
          }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full" style={{ borderColor: theme.colors.borderPrimary }}>
              <thead style={{ backgroundColor: theme.colors.bgTertiary }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                    Dashboard Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: theme.colors.bgSecondary }}>
                {dashboards.map((dashboard) => (
                  <tr
                    key={dashboard.id}
                    className="cursor-pointer transition-colors"
                    style={styles.borderBottom('secondary')}
                    onClick={() => navigate(`/dashboards/${dashboard.id}`)}
                    {...tableRowHover}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ChartBarIcon className="h-5 w-5 mr-3" style={{ color: theme.colors.textSecondary }} />
                        <div className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
                          {dashboard.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm max-w-xs truncate" style={{ color: theme.colors.textSecondary }}>
                        {dashboard.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {dashboard.is_public ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={styles.badge('info')}>
                          <ShareIcon className="h-3 w-3 mr-1" />
                          Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={styles.bg.tertiary}>
                          <span style={styles.text.secondary}>Private</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.colors.textSecondary }}>
                      {dashboard.public_access_count > 0 ? dashboard.public_access_count : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.colors.textSecondary }}>
                      {new Date(dashboard.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {canDelete(dashboard) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(dashboard.id);
                          }}
                          className="transition-opacity"
                          style={{ color: theme.colors.error }}
                          {...deleteButtonHoverDesktop}
                          aria-label={`Delete dashboard ${dashboard.name}`}
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
