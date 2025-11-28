import { useEffect, useState } from 'react';
import { useDataSourceStore } from '../../store/dataSourceStore';
import { Connection } from '../../types/connection';
import { DataSource, DiscoveredItem } from '../../types/dataSource';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { useToastStore } from '../../store/toastStore';
import { useTheme } from '../../contexts/ThemeContext';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface DataSourceManagerProps {
  connection: Connection;
}

export default function DataSourceManager({ connection }: DataSourceManagerProps) {
  const { theme } = useTheme();
  const {
    dataSources,
    isLoading,
    error,
    discoverResult,
    fetchDataSources,
    createDataSource,
    updateDataSource,
    deleteDataSource,
    discoverDataSources,
    clearDiscoverResult,
    clearError,
  } = useDataSourceStore();

  const { showToast } = useToastStore();
  const [isDiscoverModalOpen, setIsDiscoverModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingDataSource, setEditingDataSource] = useState<DataSource | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    source_identifier: '',
  });

  useEffect(() => {
    fetchDataSources(connection.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection.id]); // fetchDataSources is from Zustand, stable by design

  useEffect(() => {
    if (error) {
      showToast(error, 'error');
      clearError();
    }
  }, [error, showToast, clearError]);

  const handleDiscover = async () => {
    await discoverDataSources(connection.id);
    setIsDiscoverModalOpen(true);
  };

  const handleSelectDiscovered = (item: DiscoveredItem) => {
    setFormData({
      name: item.name,
      source_identifier: item.identifier,
    });
    setIsDiscoverModalOpen(false);
    setIsFormModalOpen(true);
  };

  const handleCreate = () => {
    setEditingDataSource(null);
    setFormData({ name: '', source_identifier: '' });
    setIsFormModalOpen(true);
  };

  const handleEdit = (dataSource: DataSource) => {
    setEditingDataSource(dataSource);
    setFormData({
      name: dataSource.name,
      source_identifier: dataSource.source_identifier,
    });
    setIsFormModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this data source?')) {
      return;
    }

    try {
      await deleteDataSource(id);
      showToast('Data source deleted successfully', 'success');
      fetchDataSources(connection.id);
    } catch (err) {
      // Error handled by store
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.source_identifier.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    const sourceType = ['mysql', 'postgresql'].includes(connection.type) ? 'database' : 'folder';

    try {
      if (editingDataSource) {
        await updateDataSource(editingDataSource.id, formData);
        showToast('Data source updated successfully', 'success');
      } else {
        await createDataSource({
          connection_id: connection.id,
          name: formData.name,
          source_type: sourceType,
          source_identifier: formData.source_identifier,
        });
        showToast('Data source created successfully', 'success');
      }
      setIsFormModalOpen(false);
      fetchDataSources(connection.id);
    } catch (err) {
      // Error handled by store
    }
  };

  const getSourceTypeLabel = () => {
    return ['mysql', 'postgresql'].includes(connection.type) ? 'Database' : 'Folder';
  };

  return (
    <div className="mt-6 border-t pt-6" style={{ borderColor: theme.colors.borderPrimary }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: theme.colors.textPrimary }}>
          {getSourceTypeLabel()}s
        </h3>
        <div className="flex gap-2">
          <Button
            onClick={handleDiscover}
            variant="secondary"
            disabled={isLoading}
          >
            <MagnifyingGlassIcon className="w-4 h-4 inline mr-1" />
            Discover
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            <PlusIcon className="w-4 h-4 inline mr-1" />
            Add {getSourceTypeLabel()}
          </Button>
        </div>
      </div>

      {/* Data Sources List */}
      {dataSources.length === 0 ? (
        <div className="text-center py-8 rounded-md" style={{ color: theme.colors.textSecondary, backgroundColor: theme.colors.bgTertiary }}>
          <p className="mb-2">No {getSourceTypeLabel().toLowerCase()}s configured</p>
          <p className="text-sm">
            Click "Discover" to auto-detect or "Add {getSourceTypeLabel()}" to create manually
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {dataSources.map((dataSource) => (
            <div
              key={dataSource.id}
              className="flex items-center justify-between p-3 rounded-md transition-all duration-200 hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5"
              style={{ backgroundColor: theme.colors.bgTertiary }}
            >
              <div className="flex items-center gap-3">
                {dataSource.is_active ? (
                  <CheckCircleIcon className="w-5 h-5" style={{ color: theme.colors.success }} />
                ) : (
                  <XCircleIcon className="w-5 h-5" style={{ color: theme.colors.textSecondary, opacity: 0.6 }} />
                )}
                <div>
                  <div className="font-medium" style={{ color: theme.colors.textPrimary }}>{dataSource.name}</div>
                  <div className="text-sm" style={{ color: theme.colors.textSecondary }}>{dataSource.source_identifier}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(dataSource)}
                  className="p-2 rounded-md transition-all duration-200 hover:scale-110"
                  style={{ color: theme.colors.textSecondary }}
                  title="Edit"
                >
                  <PencilIcon className="w-4 h-4 transition-transform duration-200" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(dataSource.id)}
                  className="p-2 rounded-md transition-all duration-200 hover:scale-110 hover:text-red-700"
                  style={{ color: theme.colors.error }}
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4 transition-transform duration-200" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Discover Modal */}
      <Modal
        isOpen={isDiscoverModalOpen}
        onClose={() => {
          setIsDiscoverModalOpen(false);
          clearDiscoverResult();
        }}
        title={`Discovered ${getSourceTypeLabel()}s`}
      >
        {discoverResult?.success ? (
          <div>
            <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>
              Found {discoverResult.items?.length || 0} {getSourceTypeLabel().toLowerCase()}
              {discoverResult.items?.length !== 1 ? 's' : ''}
            </p>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {discoverResult.items?.map((item) => (
                <button
                  key={item.identifier}
                  type="button"
                  onClick={() => handleSelectDiscovered(item)}
                  className="w-full text-left p-3 rounded-md transition-all duration-200 hover:shadow-sm hover:scale-[1.02] hover:-translate-y-0.5"
                  style={{ backgroundColor: theme.colors.bgTertiary }}
                >
                  <div className="font-medium transition-colors duration-200" style={{ color: theme.colors.textPrimary }}>{item.name}</div>
                  <div className="text-sm" style={{ color: theme.colors.textSecondary }}>{item.identifier}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p style={{ color: theme.colors.error }}>{discoverResult?.message || 'Discovery failed'}</p>
            {discoverResult?.error && (
              <p className="text-sm mt-2" style={{ color: theme.colors.textSecondary }}>{discoverResult.error}</p>
            )}
          </div>
        )}
      </Modal>

      {/* Create/Edit Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingDataSource ? `Edit ${getSourceTypeLabel()}` : `Add ${getSourceTypeLabel()}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
              Display Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
              style={{
                borderColor: theme.colors.borderPrimary,
                backgroundColor: theme.colors.bgPrimary,
                color: theme.colors.textPrimary
              }}
              placeholder="e.g., Sales Database"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
              {getSourceTypeLabel()} {['mysql', 'postgresql'].includes(connection.type) ? 'Name' : 'Path'}
            </label>
            <input
              type="text"
              value={formData.source_identifier}
              onChange={(e) => setFormData({ ...formData, source_identifier: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
              style={{
                borderColor: theme.colors.borderPrimary,
                backgroundColor: theme.colors.bgPrimary,
                color: theme.colors.textPrimary
              }}
              placeholder={
                ['mysql', 'postgresql'].includes(connection.type)
                  ? 'e.g., sales_db'
                  : 'e.g., data/reports/'
              }
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {editingDataSource ? 'Update' : 'Create'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsFormModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
