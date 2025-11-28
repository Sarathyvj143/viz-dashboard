import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartBarIcon, ShareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import { useThemedHover } from '../hooks/useThemedHover';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useViewportDebug } from '../hooks/useViewportDebug';
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

  // Debug viewport and responsive behavior (dev only, set to true to enable)
  useViewportDebug(false, 'DashboardList');

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
      <div className="p-3 sm:p-4 md:p-6 w-full">
        {/* Mobile view - Cards */}
        <div className="block md:hidden space-y-3 sm:space-y-4">
          {dashboards.map((dashboard) => (
            <div
              key={dashboard.id}
              className="rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer"
              style={{
                backgroundColor: theme.colors.bgSecondary,
                borderColor: theme.colors.borderPrimary,
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
              onClick={() => navigate(`/dashboards/${dashboard.id}`)}
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <h3 className="text-sm sm:text-base font-semibold flex-1 break-words" style={{ color: theme.colors.textPrimary }}>
                  {dashboard.name}
                </h3>
                {dashboard.is_public && (
                  <ShareIcon className="ml-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: theme.colors.info }} />
                )}
              </div>

              {dashboard.description && (
                <p className="text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 break-words" style={{ color: theme.colors.textSecondary }}>
                  {dashboard.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs mb-2 sm:mb-3" style={styles.text.secondary}>
                <span className="truncate">Updated {new Date(dashboard.updated_at).toLocaleDateString()}</span>
                {dashboard.public_access_count > 0 && (
                  <span className="px-2 py-1 rounded text-xs flex-shrink-0 ml-2" style={styles.badge('info')}>
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
                  className="w-full flex items-center justify-center gap-1 text-xs sm:text-sm rounded px-3 py-2 transition-colors"
                  style={{
                    color: theme.colors.error,
                    ...styles.border.primary,
                    borderColor: theme.colors.error,
                    backgroundColor: 'transparent',
                  }}
                  {...deleteButtonHoverMobile}
                >
                  <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
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
            <table className="min-w-full w-full" style={{ borderColor: theme.colors.borderPrimary, tableLayout: 'auto' }}>
              <thead style={{ backgroundColor: theme.colors.bgTertiary }}>
                <tr>
                  <th className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-left text-xs md:text-sm font-medium uppercase tracking-wider whitespace-nowrap" style={{ color: theme.colors.textSecondary, width: 'auto' }}>
                    Dashboard Name
                  </th>
                  <th className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-left text-xs md:text-sm font-medium uppercase tracking-wider whitespace-nowrap" style={{ color: theme.colors.textSecondary, width: 'auto' }}>
                    Description
                  </th>
                  <th className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-left text-xs md:text-sm font-medium uppercase tracking-wider whitespace-nowrap" style={{ color: theme.colors.textSecondary, width: 'auto' }}>
                    Status
                  </th>
                  <th className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-left text-xs md:text-sm font-medium uppercase tracking-wider whitespace-nowrap" style={{ color: theme.colors.textSecondary, width: 'auto' }}>
                    Views
                  </th>
                  <th className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-left text-xs md:text-sm font-medium uppercase tracking-wider whitespace-nowrap" style={{ color: theme.colors.textSecondary, width: 'auto' }}>
                    Updated
                  </th>
                  <th className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-right text-xs md:text-sm font-medium uppercase tracking-wider whitespace-nowrap" style={{ color: theme.colors.textSecondary, width: 'auto' }}>
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
                    <td className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 whitespace-nowrap">
                      <div className="flex items-center min-w-0">
                        <ChartBarIcon className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3 flex-shrink-0" style={{ color: theme.colors.textSecondary }} />
                        <div className="text-xs md:text-sm lg:text-base font-medium" style={{ color: theme.colors.textPrimary }}>
                          {dashboard.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4">
                      <div className="text-xs md:text-sm lg:text-base max-w-md truncate" style={{ color: theme.colors.textSecondary }} title={dashboard.description || ''}>
                        {dashboard.description || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 whitespace-nowrap">
                      {dashboard.is_public ? (
                        <span className="inline-flex items-center px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap" style={styles.badge('info')}>
                          <ShareIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
                          <span className="hidden lg:inline">Public</span>
                          <span className="lg:hidden">Pub</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap" style={styles.bg.tertiary}>
                          <span style={styles.text.secondary} className="hidden lg:inline">Private</span>
                          <span style={styles.text.secondary} className="lg:hidden">Priv</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm lg:text-base whitespace-nowrap" style={{ color: theme.colors.textSecondary }}>
                      {dashboard.public_access_count > 0 ? dashboard.public_access_count : '-'}
                    </td>
                    <td className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-xs md:text-sm lg:text-base whitespace-nowrap" style={{ color: theme.colors.textSecondary }}>
                      <span className="hidden lg:inline">{new Date(dashboard.updated_at).toLocaleDateString()}</span>
                      <span className="lg:hidden">{new Date(dashboard.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </td>
                    <td className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4 text-right whitespace-nowrap">
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
                          <TrashIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
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
