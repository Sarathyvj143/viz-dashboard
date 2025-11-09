import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChartStore } from '../store/chartStore';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';

export default function ChartList() {
  const navigate = useNavigate();
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
        <div className="p-6 text-center text-gray-500">Loading charts...</div>
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
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No charts</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new chart.</p>
            <div className="mt-6">
              <Button onClick={() => navigate('/charts/new')}>
                Create Chart
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {charts.map((chart) => (
              <div
                key={chart.id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                onClick={() => navigate(`/charts/${chart.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {chart.name}
                    </h3>
                    {chart.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {chart.description}
                      </p>
                    )}
                  </div>
                  <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {chart.type}
                  </span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
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
