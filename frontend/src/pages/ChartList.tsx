import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChartStore } from '../store/chartStore';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import StatusBadge from '../components/common/StatusBadge';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function ChartList() {
  const navigate = useNavigate();
  const styles = useThemedStyles();
  const { theme } = useTheme();
  const { charts, isLoading, fetchCharts } = useChartStore();

  useEffect(() => {
    fetchCharts();
  }, [fetchCharts]);

  if (isLoading || !charts) {
    return (
      <div>
        <Header
          title="Charts"
          subtitle="Manage and view your charts"
          actions={
            <Button onClick={() => navigate('/charts/new')}>
              Create Chart
            </Button>
          }
        />
        <div className="p-3 sm:p-4 md:p-6 text-center" style={{ color: theme.colors.textSecondary }}>
          Loading charts...
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Charts"
        subtitle="Manage and view your charts"
        actions={
          <Button onClick={() => navigate('/charts/new')}>
            Create Chart
          </Button>
        }
      />
      <div className="p-3 sm:p-4 md:p-6 w-full">
        {charts.length === 0 ? (
          <EmptyState
            icon={ChartBarIcon}
            title="No charts"
            description="Get started by creating a new chart."
            action={{
              label: 'Create Chart',
              onClick: () => navigate('/charts/new'),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {charts.map((chart) => (
              <div
                key={chart.id}
                className="p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                style={{
                  backgroundColor: theme.colors.bgPrimary,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: theme.colors.borderPrimary,
                }}
                onClick={() => navigate(`/charts/${chart.id}`)}
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold mb-1 break-words" style={styles.heading.primary}>
                      {chart.name}
                    </h3>
                    {chart.description && (
                      <p className="text-xs sm:text-sm line-clamp-2 break-words" style={{ color: theme.colors.textSecondary }}>
                        {chart.description}
                      </p>
                    )}
                  </div>
                  <StatusBadge
                    label={chart.type}
                    type="info"
                    size="sm"
                    variant="subtle"
                    className="ml-2"
                  />
                </div>

                <div style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: theme.colors.borderPrimary }} className="pt-3 sm:pt-4">
                  <div className="flex items-center justify-between text-xs sm:text-sm" style={{ color: theme.colors.textSecondary }}>
                    <span className="truncate">Created {new Date(chart.createdAt).toLocaleDateString()}</span>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/charts/${chart.id}`);
                      }}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
