import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChartStore } from '../../store/chartStore';
import { useToastStore } from '../../store/toastStore';
import { useTheme } from '../../contexts/ThemeContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { getDefaultChartColors } from '../../constants/themes';
import { dataSourcesApi } from '../../api/dataSources';
import { connectionsApi } from '../../api/connections';
import { DataSource } from '../../types/dataSource';
import { Connection } from '../../types/connection';
import { ChartType } from '../../types/chart';
import Button from '../common/Button';
import Input from '../common/Input';
import Dropdown from '../common/Dropdown';
import Spinner from '../common/Spinner';
import DataSourceQuickCreate from '../dataSources/DataSourceQuickCreate';
import {
  PlusIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  ServerIcon,
  FolderIcon,
  TableCellsIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';

export default function ChartBuilder() {
  const navigate = useNavigate();
  const styles = useThemedStyles();
  const { createChart, isLoading } = useChartStore();
  const { showToast } = useToastStore();
  const { theme, currentTheme, customColors } = useTheme();
  const [loadingDataSources, setLoadingDataSources] = useState(true);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Data source mode: 'datasource' | 'connection'
  const [dataSourceMode, setDataSourceMode] = useState<'datasource' | 'connection'>('datasource');

  // Query mode: 'table' | 'custom'
  const [queryMode, setQueryMode] = useState<'table' | 'custom'>('table');

  // Connection-related state
  const [selectedConnectionId, setSelectedConnectionId] = useState<number>(0);
  const [tables, setTables] = useState<Array<{ name: string; type: string }>>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [loadingTables, setLoadingTables] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    chart_type: 'bar' as ChartType,
    data_source_id: 0,
    query: '',
    config: {
      xAxis: '',
      yAxis: '',
      colors: getDefaultChartColors(currentTheme, customColors),
      legend: true,
      grid: true,
    },
  });

  useEffect(() => {
    loadDataSources();
    loadConnections();
  }, []);

  useEffect(() => {
    if (selectedConnectionId && dataSourceMode === 'connection') {
      loadTables();
    } else {
      setTables([]);
      setSelectedTable('');
    }
  }, [selectedConnectionId, dataSourceMode]);

  // Update chart colors when theme changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        colors: getDefaultChartColors(currentTheme, customColors),
      },
    }));
  }, [currentTheme, customColors]);

  // Use useMemo for efficient filtering
  const filteredDataSources = useMemo(() => {
    if (searchTerm.trim() === '') {
      return dataSources;
    }

    const lowerSearch = searchTerm.toLowerCase();
    return dataSources.filter((source) =>
      source.name.toLowerCase().includes(lowerSearch) ||
      source.source_identifier.toLowerCase().includes(lowerSearch)
    );
  }, [searchTerm, dataSources]);

  const loadDataSources = async () => {
    setLoadingDataSources(true);
    try {
      const sources = await dataSourcesApi.getAll();
      setDataSources(sources);
      if (sources.length > 0 && !formData.data_source_id) {
        setFormData((prev) => ({ ...prev, data_source_id: sources[0].id }));
      }
    } catch (error) {
      showToast('Failed to load data sources. Please refresh the page.', 'error');
    } finally {
      setLoadingDataSources(false);
    }
  };

  const loadConnections = async () => {
    try {
      const conns = await connectionsApi.getAll();
      setConnections(conns);
      if (conns.length > 0 && !selectedConnectionId) {
        setSelectedConnectionId(conns[0].id);
      }
    } catch (error) {
      showToast('Failed to load connections.', 'error');
    }
  };

  const loadTables = async () => {
    if (!selectedConnectionId) return;

    setLoadingTables(true);
    try {
      const fetchedTables = await connectionsApi.getTables(selectedConnectionId);
      setTables(fetchedTables);
      if (fetchedTables.length > 0) {
        setSelectedTable(fetchedTables[0].name);
      }
    } catch (error) {
      showToast('Failed to load tables from connection.', 'error');
      setTables([]);
    } finally {
      setLoadingTables(false);
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

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    if (queryMode === 'table') {
      // Auto-generate query for the selected table
      const generatedQuery = `SELECT * FROM ${tableName} LIMIT 100`;
      setFormData((prev) => ({ ...prev, query: generatedQuery }));
    }
  };

  const handleDataSourceModeChange = (mode: 'datasource' | 'connection') => {
    setDataSourceMode(mode);
    // Reset related state
    if (mode === 'connection') {
      setFormData((prev) => ({ ...prev, data_source_id: 0 }));
    } else {
      setSelectedConnectionId(0);
      setSelectedTable('');
      setTables([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createChart({
        name: formData.name,
        description: formData.description,
        type: formData.chart_type,
        dataSourceId: formData.data_source_id.toString(),
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
    <div className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: theme.colors.bgSecondary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary }}>
          <div className="px-6 py-4" style={{ backgroundColor: theme.colors.bgSecondary, borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: theme.colors.borderPrimary }}>
            <h3 className="text-lg font-semibold flex items-center" style={styles.heading.primary}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm" style={{ backgroundColor: theme.colors.accentPrimary, color: 'white' }}>1</span>
              Basic Information
            </h3>
            <p className="text-sm mt-1 ml-11" style={{ color: theme.colors.textSecondary }}>Set up your chart name and description</p>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
                Chart Name *
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Monthly Sales Report, User Activity Dashboard"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide a brief description of what this chart visualizes..."
                className="w-full px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200"
                style={{
                  backgroundColor: theme.colors.bgPrimary,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: theme.colors.borderPrimary,
                  color: theme.colors.textPrimary
                }}
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Chart Type Selection Section */}
        <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: theme.colors.bgSecondary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary }}>
          <div className="px-6 py-4" style={{ backgroundColor: theme.colors.bgSecondary, borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: theme.colors.borderPrimary }}>
            <h3 className="text-lg font-semibold flex items-center" style={styles.heading.primary}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm" style={{ backgroundColor: theme.colors.accentPrimary, color: 'white' }}>2</span>
              Chart Type
            </h3>
            <p className="text-sm mt-1 ml-11" style={{ color: theme.colors.textSecondary }}>Choose the visualization type for your data</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {chartTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, chart_type: type.value })}
                  className="p-5 rounded-xl text-center transition-all duration-200 transform hover:scale-105 shadow-sm"
                  style={{
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: formData.chart_type === type.value ? theme.colors.accentPrimary : theme.colors.borderPrimary,
                    backgroundColor: formData.chart_type === type.value ? theme.colors.bgTertiary : theme.colors.bgSecondary
                  }}
                >
                  <div className="text-4xl mb-3">{type.icon}</div>
                  <div className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>{type.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Source Mode Selection */}
        <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: theme.colors.bgSecondary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary }}>
          <div className="px-6 py-4" style={{ backgroundColor: theme.colors.bgSecondary, borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: theme.colors.borderPrimary }}>
            <h3 className="text-lg font-semibold flex items-center" style={styles.heading.primary}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm" style={{ backgroundColor: theme.colors.accentPrimary, color: 'white' }}>3</span>
              Data Source Mode
            </h3>
            <p className="text-sm mt-1 ml-11" style={{ color: theme.colors.textSecondary }}>Choose how you want to provide data for the chart</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleDataSourceModeChange('connection')}
                className="p-6 rounded-xl transition-all duration-200 shadow-sm"
                style={{
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: dataSourceMode === 'connection' ? theme.colors.accentPrimary : theme.colors.borderPrimary,
                  backgroundColor: dataSourceMode === 'connection' ? theme.colors.bgTertiary : theme.colors.bgSecondary
                }}
              >
                <ServerIcon className="w-8 h-8 mx-auto mb-3" style={{ color: theme.colors.accentPrimary }} />
                <div className="text-sm font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>Direct Connection</div>
                <div className="text-xs" style={{ color: theme.colors.textSecondary }}>Select a connection and table directly</div>
              </button>
              <button
                type="button"
                onClick={() => handleDataSourceModeChange('datasource')}
                className="p-6 rounded-xl transition-all duration-200 shadow-sm"
                style={{
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: dataSourceMode === 'datasource' ? theme.colors.accentPrimary : theme.colors.borderPrimary,
                  backgroundColor: dataSourceMode === 'datasource' ? theme.colors.bgTertiary : theme.colors.bgSecondary
                }}
              >
                <FolderIcon className="w-8 h-8 mx-auto mb-3" style={{ color: theme.colors.accentPrimary }} />
                <div className="text-sm font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>Data Source</div>
                <div className="text-xs" style={{ color: theme.colors.textSecondary }}>Use an existing data source configuration</div>
              </button>
            </div>
          </div>
        </div>

        {/* Connection/Table Selection Section - Only shown when connection mode is selected */}
        {dataSourceMode === 'connection' && (
          <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: theme.colors.bgSecondary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary }}>
            <div className="px-6 py-4" style={{ backgroundColor: theme.colors.bgSecondary, borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: theme.colors.borderPrimary }}>
              <h3 className="text-lg font-semibold flex items-center" style={styles.heading.primary}>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm" style={{ backgroundColor: theme.colors.accentPrimary, color: 'white' }}>4</span>
                Connection & Table
              </h3>
              <p className="text-sm mt-1 ml-11" style={{ color: theme.colors.textSecondary }}>Select a database connection and table</p>
            </div>
            <div className="p-6 space-y-5">
              {/* Connection Selection */}
              <div>
                {connections.length === 0 ? (
                  <div className="text-sm p-5 rounded-lg" style={{ backgroundColor: theme.colors.bgTertiary, borderWidth: '2px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary, color: theme.colors.textPrimary }}>
                    <p className="font-semibold mb-1">No database connections available</p>
                    <p style={{ color: theme.colors.textSecondary }}>Create a database connection first from the Connections page.</p>
                  </div>
                ) : (
                  <Dropdown
                    label="Select Connection *"
                    options={connections.map(conn => ({
                      value: conn.id,
                      label: `${conn.name} (${conn.type})`,
                      icon: ServerIcon,
                      badge: conn.type
                    }))}
                    value={selectedConnectionId || undefined}
                    onChange={(value) => setSelectedConnectionId(value || 0)}
                    searchable
                    placeholder="Choose a connection..."
                  />
                )}
              </div>

              {/* Table Selection */}
              {selectedConnectionId > 0 && (
                <div>
                  {loadingTables ? (
                    <div className="text-sm p-4 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.colors.bgTertiary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary, color: theme.colors.textSecondary }}>
                      <Spinner size="md" color="gray" className="mr-3" />
                      Loading tables...
                    </div>
                  ) : tables.length === 0 ? (
                    <div className="text-sm p-5 rounded-lg" style={{ backgroundColor: theme.colors.bgTertiary, borderWidth: '2px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary, color: theme.colors.textPrimary }}>
                      <p className="font-semibold mb-1">No tables found</p>
                      <p style={{ color: theme.colors.textSecondary }}>The selected connection has no accessible tables.</p>
                    </div>
                  ) : (
                    <Dropdown
                      label="Select Table *"
                      options={tables.map(table => ({
                        value: table.name,
                        label: `${table.name} (${table.type})`,
                        icon: TableCellsIcon,
                        badge: table.type
                      }))}
                      value={selectedTable || undefined}
                      onChange={(value) => handleTableSelect(value || '')}
                      searchable
                      placeholder="Choose a table..."
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data Source Selection Section - Only shown when datasource mode is selected */}
        {dataSourceMode === 'datasource' && (
          <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: theme.colors.bgSecondary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary }}>
            <div className="px-6 py-4" style={{ backgroundColor: theme.colors.bgSecondary, borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: theme.colors.borderPrimary }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center" style={styles.heading.primary}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm" style={{ backgroundColor: theme.colors.accentPrimary, color: 'white' }}>4</span>
                    Data Source
                  </h3>
                  <p className="text-sm mt-1 ml-11" style={{ color: theme.colors.textSecondary }}>Select or create a data source connection</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickCreate(!showQuickCreate)}
                  className="px-4 py-2 text-sm rounded-lg font-medium flex items-center transition-all duration-200 shadow-sm"
                  style={{
                    backgroundColor: theme.colors.bgSecondary,
                    color: theme.colors.accentPrimary,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: theme.colors.accentPrimary
                  }}
                >
                  {showQuickCreate ? (
                    <>
                      <ChevronUpIcon className="w-4 h-4 mr-1.5" />
                      Hide Quick Create
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4 mr-1.5" />
                      Create New
                    </>
                  )}
                </button>
              </div>
            </div>

          <div className="p-6 space-y-5">
            {/* Quick Create Section (Collapsible) */}
            {showQuickCreate && (
              <div className="rounded-xl p-5" style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: theme.colors.accentPrimary, backgroundColor: theme.colors.bgTertiary }}>
                <DataSourceQuickCreate
                  embedded={true}
                  onCreated={handleDataSourceCreated}
                  onCancel={() => setShowQuickCreate(false)}
                />
              </div>
            )}

            {/* Data Source Selection with Advanced Features */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: theme.colors.textPrimary }}>
                Select Data Source *
              </label>
              {loadingDataSources ? (
                <div className="text-sm p-4 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.colors.bgTertiary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary, color: theme.colors.textSecondary }}>
                  <Spinner size="md" color="gray" className="mr-3" />
                  Loading data sources...
                </div>
              ) : dataSources.length === 0 ? (
                <div className="text-sm p-5 rounded-lg" style={{ backgroundColor: theme.colors.bgTertiary, borderWidth: '2px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary, color: theme.colors.textPrimary }}>
                  <p className="font-semibold mb-1">No data sources available</p>
                  <p style={{ color: theme.colors.textSecondary }}>{!showQuickCreate && 'Click "Create New" above to get started.'}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: theme.colors.textSecondary }} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search data sources by name or identifier..."
                      className="w-full pl-11 pr-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200"
                      style={{
                        backgroundColor: theme.colors.bgPrimary,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: theme.colors.borderPrimary,
                        color: theme.colors.textPrimary
                      }}
                    />
                  </div>

                  {/* Data Source Cards */}
                  <div className="max-h-96 overflow-y-auto space-y-3 rounded-lg p-3" style={{ backgroundColor: theme.colors.bgTertiary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary }}>
                    {filteredDataSources.length === 0 ? (
                      <div className="text-center py-12" style={{ color: theme.colors.textSecondary }}>
                        <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-3" style={{ color: theme.colors.textSecondary }} />
                        <p className="text-sm font-medium">No data sources match your search</p>
                      </div>
                    ) : (
                      filteredDataSources.map((source) => (
                        <button
                          key={source.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, data_source_id: source.id })}
                          className="w-full text-left p-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-sm"
                          style={{
                            borderWidth: '2px',
                            borderStyle: 'solid',
                            borderColor: formData.data_source_id === source.id ? theme.colors.accentPrimary : theme.colors.borderPrimary,
                            backgroundColor: formData.data_source_id === source.id ? theme.colors.bgTertiary : theme.colors.bgSecondary
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {source.source_type === 'database' ? (
                                <ServerIcon className="h-6 w-6" style={{ color: theme.colors.accentPrimary }} />
                              ) : (
                                <FolderIcon className="h-6 w-6" style={{ color: theme.colors.accentSecondary }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold truncate" style={styles.heading.primary}>
                                  {source.name}
                                </h4>
                                <span className="ml-2 px-2.5 py-1 text-xs font-semibold rounded-full" style={{
                                  backgroundColor: source.is_active ? theme.colors.bgTertiary : theme.colors.bgSecondary,
                                  color: theme.colors.textPrimary
                                }}>
                                  {source.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <p className="text-xs mt-1.5" style={{ color: theme.colors.textSecondary }}>
                                <span className="font-semibold">
                                  {source.source_type === 'database' ? 'Database:' : 'Path:'}
                                </span>{' '}
                                {source.source_identifier}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 text-xs" style={{ color: theme.colors.textSecondary }}>
                                <span className="capitalize font-medium">{source.source_type}</span>
                                {source.connection_id && connections.find(c => c.id === source.connection_id) && (
                                  <>
                                    <span>•</span>
                                    <span>Connection: {connections.find(c => c.id === source.connection_id)?.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <p className="text-xs flex items-center justify-between" style={{ color: theme.colors.textSecondary }}>
                    <span>{filteredDataSources.length} of {dataSources.length} data source{dataSources.length !== 1 ? 's' : ''} shown</span>
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="font-medium"
                        style={{ color: theme.colors.accentPrimary }}
                      >
                        Clear search
                      </button>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Query Configuration */}
        <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: theme.colors.bgSecondary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary }}>
          <div className="px-6 py-4" style={{ backgroundColor: theme.colors.bgSecondary, borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: theme.colors.borderPrimary }}>
            <h3 className="text-lg font-semibold flex items-center" style={styles.heading.primary}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm" style={{ backgroundColor: theme.colors.accentPrimary, color: 'white' }}>5</span>
              Query Configuration
            </h3>
            <p className="text-sm mt-1 ml-11" style={{ color: theme.colors.textSecondary }}>Choose how to build your data query</p>
          </div>
          <div className="p-6 space-y-5">
            {/* Query Mode Toggle - Only show for connection mode */}
            {dataSourceMode === 'connection' && (
              <div className="flex items-center gap-4 pb-4" style={{ borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: theme.colors.borderPrimary }}>
                <button
                  type="button"
                  onClick={() => setQueryMode('table')}
                  className="flex-1 p-4 rounded-lg transition-all duration-200"
                  style={{
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: queryMode === 'table' ? theme.colors.accentPrimary : theme.colors.borderPrimary,
                    backgroundColor: queryMode === 'table' ? theme.colors.bgTertiary : theme.colors.bgSecondary
                  }}
                >
                  <TableCellsIcon className="w-6 h-6 mx-auto mb-2" style={{ color: theme.colors.accentPrimary }} />
                  <div className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>Table Mode</div>
                  <div className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>Auto-generate query from table</div>
                </button>
                <button
                  type="button"
                  onClick={() => setQueryMode('custom')}
                  className="flex-1 p-4 rounded-lg transition-all duration-200"
                  style={{
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: queryMode === 'custom' ? theme.colors.accentPrimary : theme.colors.borderPrimary,
                    backgroundColor: queryMode === 'custom' ? theme.colors.bgTertiary : theme.colors.bgSecondary
                  }}
                >
                  <CodeBracketIcon className="w-6 h-6 mx-auto mb-2" style={{ color: theme.colors.accentPrimary }} />
                  <div className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>Custom Query</div>
                  <div className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>Write your own SQL query</div>
                </button>
              </div>
            )}

            {/* Query Text Area */}
            <div>
              <label htmlFor="query" className="block text-sm font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
                SQL Query *
              </label>
              <textarea
                id="query"
                value={formData.query}
                onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                placeholder="SELECT column1 as label, column2 as value FROM table_name"
                className="w-full px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 font-mono text-sm transition-all duration-200"
                style={{
                  backgroundColor: theme.colors.bgPrimary,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: theme.colors.borderPrimary,
                  color: theme.colors.textPrimary
                }}
                rows={6}
                required
                readOnly={dataSourceMode === 'connection' && queryMode === 'table'}
              />
              <p className="mt-2 text-xs" style={{ color: theme.colors.textSecondary }}>
                {dataSourceMode === 'connection' && queryMode === 'table'
                  ? 'Query is auto-generated from the selected table. Switch to Custom Query mode to edit manually.'
                  : 'Write a SQL query that returns data for the chart. For most charts, use \'label\' and \'value\' columns.'}
              </p>
            </div>

            <div className="rounded-xl p-5" style={{ backgroundColor: theme.colors.bgTertiary, borderWidth: '2px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary }}>
              <h4 className="text-sm font-bold mb-3 flex items-center" style={{ color: theme.colors.textPrimary }}>
                <span className="mr-2">💡</span> Query Examples
              </h4>
              <div className="space-y-3 text-xs" style={{ color: theme.colors.textPrimary }}>
                <div>
                  <strong className="block mb-1">Bar/Line/Area Charts:</strong>
                  <code className="block p-3 rounded-lg shadow-sm font-mono" style={{ backgroundColor: theme.colors.bgPrimary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary, color: theme.colors.textPrimary }}>
                    SELECT category_name as label, COUNT(*) as value FROM products GROUP BY category_name
                  </code>
                </div>
                <div>
                  <strong className="block mb-1">Pie Chart:</strong>
                  <code className="block p-3 rounded-lg shadow-sm font-mono" style={{ backgroundColor: theme.colors.bgPrimary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary, color: theme.colors.textPrimary }}>
                    SELECT status as label, COUNT(*) as value FROM orders GROUP BY status
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Configuration Section */}
        <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: theme.colors.bgSecondary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary }}>
          <div className="px-6 py-4" style={{ backgroundColor: theme.colors.bgSecondary, borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: theme.colors.borderPrimary }}>
            <h3 className="text-lg font-semibold flex items-center" style={styles.heading.primary}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm" style={{ backgroundColor: theme.colors.accentPrimary, color: 'white' }}>6</span>
              Chart Configuration
            </h3>
            <p className="text-sm mt-1 ml-11" style={{ color: theme.colors.textSecondary }}>Customize your chart appearance and labels</p>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="xAxis" className="block text-sm font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
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
                  placeholder="e.g., Categories, Time Period"
                />
              </div>

              <div>
                <label htmlFor="yAxis" className="block text-sm font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
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
                  placeholder="e.g., Count, Revenue, Percentage"
                />
              </div>
            </div>

            <div className="flex items-center space-x-6 pt-2">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.config.legend}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...formData.config, legend: e.target.checked },
                    })
                  }
                  className="h-5 w-5 rounded transition-all duration-200"
                  style={{ accentColor: theme.colors.accentPrimary }}
                />
                <span className="ml-3 text-sm font-medium" style={{ color: theme.colors.textPrimary }}>Show Legend</span>
              </label>

              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.config.grid}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...formData.config, grid: e.target.checked },
                    })
                  }
                  className="h-5 w-5 rounded transition-all duration-200"
                  style={{ accentColor: theme.colors.accentPrimary }}
                />
                <span className="ml-3 text-sm font-medium" style={{ color: theme.colors.textPrimary }}>Show Grid</span>
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-8" style={{ borderTopWidth: '2px', borderTopStyle: 'solid', borderTopColor: theme.colors.borderPrimary }}>
          <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
            <span className="font-medium">Ready to create?</span> Make sure all required fields are filled
          </div>
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/charts')}
              disabled={isLoading || loadingDataSources}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || loadingDataSources || dataSources.length === 0}
              className="px-8"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Spinner size="sm" color="white" className="mr-2" />
                  Creating...
                </span>
              ) : (
                'Create Chart'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
