import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChartStore } from '../../store/chartStore';
import { useToastStore } from '../../store/toastStore';
import { dataSourcesApi } from '../../api/dataSources';
import { DataSource } from '../../types/dataSource';
import { ChartType } from '../../types/chart';
import Button from '../common/Button';
import Input from '../common/Input';
import DataSourceQuickCreate from '../dataSources/DataSourceQuickCreate';
import {
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  ServerIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

export default function ChartBuilder() {
  const navigate = useNavigate();
  const { createChart, isLoading } = useChartStore();
  const { showToast } = useToastStore();
  const [loadingDataSources, setLoadingDataSources] = useState(true);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [filteredDataSources, setFilteredDataSources] = useState<DataSource[]>([]);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    chart_type: 'bar' as ChartType,
    data_source_id: 0,
    query: '',
    config: {
      xAxis: '',
      yAxis: '',
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      legend: true,
      grid: true,
    },
  });

  useEffect(() => {
    loadDataSources();
  }, []);

  useEffect(() => {
    // Filter data sources based on search term
    if (searchTerm.trim() === '') {
      setFilteredDataSources(dataSources);
    } else {
      const filtered = dataSources.filter((source) =>
        source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        source.source_identifier.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDataSources(filtered);
    }
  }, [searchTerm, dataSources]);

  const loadDataSources = async () => {
    setLoadingDataSources(true);
    try {
      const sources = await dataSourcesApi.getAll();
      setDataSources(sources);
      setFilteredDataSources(sources);
      if (sources.length > 0 && !formData.data_source_id) {
        setFormData((prev) => ({ ...prev, data_source_id: sources[0].id }));
      }
    } catch (error) {
      showToast('Failed to load data sources. Please refresh the page.', 'error');
    } finally {
      setLoadingDataSources(false);
    }
  };

  const handleDataSourceCreated = async (newDataSourceId: number) => {
    // Reload data sources to include the newly created one
    await loadDataSources();
    // Select the newly created data source
    setFormData((prev) => ({ ...prev, data_source_id: newDataSourceId }));
    // Close the quick create form
    setShowQuickCreate(false);
    showToast('Data source created and selected', 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createChart({
        name: formData.name,
        description: formData.description,
        chart_type: formData.chart_type,
        data_source_id: formData.data_source_id,
        query: formData.query,
        config: formData.config,
      });
      showToast('Chart created successfully', 'success');
      navigate('/charts');
    } catch (error) {
      showToast('Failed to create chart. Please try again.', 'error');
    }
  };

  const chartTypes: { value: ChartType; label: string; icon: string }[] = [
    { value: 'bar', label: 'Bar Chart', icon: '📊' },
    { value: 'line', label: 'Line Chart', icon: '📈' },
    { value: 'pie', label: 'Pie Chart', icon: '🥧' },
    { value: 'area', label: 'Area Chart', icon: '📉' },
    { value: 'scatter', label: 'Scatter Chart', icon: '⚫' },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Create New Chart</h2>
        <p className="mt-1 text-sm text-gray-600">
          Build a chart by selecting a data source and defining your query
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Chart Name *
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter chart name"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter chart description (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
        </div>

        {/* Chart Type Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Chart Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {chartTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, chart_type: type.value })}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  formData.chart_type === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">{type.icon}</div>
                <div className="text-sm font-medium text-gray-900">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Data Source Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Data Source</h3>
            <button
              type="button"
              onClick={() => setShowQuickCreate(!showQuickCreate)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              {showQuickCreate ? (
                <>
                  <ChevronUpIcon className="w-4 h-4 mr-1" />
                  Hide Quick Create
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Create New Data Source
                </>
              )}
            </button>
          </div>

          {/* Quick Create Section (Collapsible) */}
          {showQuickCreate && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <DataSourceQuickCreate
                onCreated={handleDataSourceCreated}
                onCancel={() => setShowQuickCreate(false)}
              />
            </div>
          )}

          {/* Data Source Selection with Advanced Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Data Source *
            </label>
            {loadingDataSources ? (
              <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md">
                Loading data sources...
              </div>
            ) : dataSources.length === 0 ? (
              <div className="text-sm text-gray-600 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                No data sources available. {!showQuickCreate && 'Click "Create New Data Source" above to get started.'}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Search Input */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search data sources by name or identifier..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Data Source Cards */}
                <div className="max-h-80 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-2 bg-gray-50">
                  {filteredDataSources.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No data sources match your search
                    </div>
                  ) : (
                    filteredDataSources.map((source) => (
                      <button
                        key={source.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, data_source_id: source.id })}
                        className={`w-full text-left p-3 rounded-md border-2 transition-all ${
                          formData.data_source_id === source.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {source.source_type === 'database' ? (
                              <ServerIcon className="h-5 w-5 text-blue-600" />
                            ) : (
                              <FolderIcon className="h-5 w-5 text-yellow-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {source.name}
                              </h4>
                              <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                                source.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {source.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              <span className="font-medium">
                                {source.source_type === 'database' ? 'Database:' : 'Path:'}
                              </span>{' '}
                              {source.source_identifier}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <span className="capitalize">{source.source_type}</span>
                              {source.connection && (
                                <>
                                  <span>•</span>
                                  <span>Connection: {source.connection.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <p className="text-xs text-gray-500">
                  {filteredDataSources.length} of {dataSources.length} data source{dataSources.length !== 1 ? 's' : ''} shown
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SQL Query */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">SQL Query</h3>

          <div>
            <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
              SQL Query *
            </label>
            <textarea
              id="query"
              value={formData.query}
              onChange={(e) => setFormData({ ...formData, query: e.target.value })}
              placeholder="SELECT column1 as label, column2 as value FROM table_name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              rows={6}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Write a SQL query that returns data for the chart. For most charts, use 'label' and 'value' columns.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Query Examples:</h4>
            <div className="space-y-2 text-xs text-blue-800 font-mono">
              <div>
                <strong>Bar/Line/Area Charts:</strong>
                <code className="block mt-1 bg-white p-2 rounded">
                  SELECT category_name as label, COUNT(*) as value FROM products GROUP BY category_name
                </code>
              </div>
              <div>
                <strong>Pie Chart:</strong>
                <code className="block mt-1 bg-white p-2 rounded">
                  SELECT status as label, COUNT(*) as value FROM orders GROUP BY status
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Chart Configuration</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="xAxis" className="block text-sm font-medium text-gray-700 mb-1">
                X-Axis Label
              </label>
              <Input
                id="xAxis"
                type="text"
                value={formData.config.xAxis}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, xAxis: e.target.value },
                  })
                }
                placeholder="Enter X-axis label"
              />
            </div>

            <div>
              <label htmlFor="yAxis" className="block text-sm font-medium text-gray-700 mb-1">
                Y-Axis Label
              </label>
              <Input
                id="yAxis"
                type="text"
                value={formData.config.yAxis}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, yAxis: e.target.value },
                  })
                }
                placeholder="Enter Y-axis label"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.config.legend}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, legend: e.target.checked },
                  })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Show Legend</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.config.grid}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, grid: e.target.checked },
                  })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Show Grid</span>
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/charts')}
            disabled={isLoading || loadingDataSources}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || loadingDataSources || dataSources.length === 0}>
            {isLoading ? 'Creating...' : 'Create Chart'}
          </Button>
        </div>
      </form>
    </div>
  );
}
