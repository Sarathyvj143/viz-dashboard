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

  if (isLoading) {
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
        <div className="p-6 text-center" style={{ color: theme.colors.textSecondary }}>
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
      <div className="p-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {charts.map((chart) => (
              <div
                key={chart.id}
                className="p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                style={{
                  backgroundColor: theme.colors.bgPrimary,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: theme.colors.borderPrimary,
                }}
                onClick={() => navigate(`/charts/${chart.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1" style={styles.heading.primary}>
                      {chart.name}
                    </h3>
                    {chart.description && (
                      <p className="text-sm line-clamp-2" style={{ color: theme.colors.textSecondary }}>
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

                <div style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: theme.colors.borderPrimary }} className="pt-4">
                  <div className="flex items-center justify-between text-xs" style={{ color: theme.colors.textSecondary }}>
                    <span>Created {new Date(chart.createdAt).toLocaleDateString()}</span>
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
