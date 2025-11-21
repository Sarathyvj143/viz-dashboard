import { useState, useEffect } from 'react';
import { useConnectionStore } from '../../store/connectionStore';
import { useDataSourceStore } from '../../store/dataSourceStore';
import { useToastStore } from '../../store/toastStore';
import { Connection } from '../../types/connection';
import { DiscoveredItem } from '../../types/dataSource';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Dropdown from '../common/Dropdown';
import { PlusIcon, MagnifyingGlassIcon, ServerIcon } from '@heroicons/react/24/outline';

interface DataSourceQuickCreateProps {
  onCreated?: (dataSourceId: number) => void;
  onCancel?: () => void;
  embedded?: boolean; // If true, renders without form wrapper for embedding in other forms
}

export default function DataSourceQuickCreate({ onCreated, onCancel, embedded = false }: DataSourceQuickCreateProps) {
  const { connections, fetchConnections } = useConnectionStore();
  const {
    createDataSource,
    discoverDataSources,
    discoverResult,
    clearDiscoverResult,
    isLoading,
  } = useDataSourceStore();
  const { showToast } = useToastStore();

  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [isDiscoverModalOpen, setIsDiscoverModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    source_identifier: '',
  });

  useEffect(() => {
    fetchConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchConnections is from Zustand store, stable by design

  useEffect(() => {
    if (connections.length > 0 && !selectedConnection) {
      setSelectedConnection(connections[0]);
    }
  }, [connections, selectedConnection]);

  const handleDiscover = async () => {
    if (!selectedConnection) {
      showToast('Please select a connection first', 'error');
      return;
    }
    await discoverDataSources(selectedConnection.id);
    setIsDiscoverModalOpen(true);
  };

  const handleSelectDiscovered = (item: DiscoveredItem) => {
    setFormData({
      name: item.name,
      source_identifier: item.identifier,
    });
    setIsDiscoverModalOpen(false);
    clearDiscoverResult();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedConnection) {
      showToast('Please select a connection', 'error');
      return;
    }

    if (!formData.name.trim() || !formData.source_identifier.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    const sourceType = ['mysql', 'postgresql'].includes(selectedConnection.type)
      ? 'database'
      : 'folder';

    try {
      const result = await createDataSource({
        connection_id: selectedConnection.id,
        name: formData.name,
        source_type: sourceType,
        source_identifier: formData.source_identifier,
      });

      if (!result) {
        throw new Error('Data source creation returned no result');
      }

      showToast('Data source created successfully', 'success');

      if (onCreated) {
        onCreated(result.id);
      }

      // Reset form only on success
      setFormData({ name: '', source_identifier: '' });
    } catch (error) {
      // Enhanced error messages based on error type
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to create data source';

      // Provide specific guidance based on common error scenarios
      if (errorMessage.toLowerCase().includes('already exists')) {
        showToast(`A data source named "${formData.name}" already exists`, 'error');
      } else if (errorMessage.toLowerCase().includes('connection')) {
        showToast('Failed to connect to the data source. Check the connection settings.', 'error');
      } else if (errorMessage.toLowerCase().includes('permission') || errorMessage.toLowerCase().includes('access')) {
        showToast('Access denied. Check your permissions for this connection.', 'error');
      } else {
        showToast(errorMessage, 'error');
      }

      // Form stays populated so user can correct without re-entering
    }
  };

  const getSourceTypeLabel = () => {
    if (!selectedConnection) return 'Source';
    return ['mysql', 'postgresql'].includes(selectedConnection.type) ? 'Database' : 'Folder';
  };

  if (connections.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">No Connections Available</h3>
        <p className="text-sm text-yellow-800 mb-3">
          You need to create a connection before you can add data sources.
        </p>
        <Button size="sm" onClick={() => window.location.href = '/connections'}>
          Go to Connections
        </Button>
      </div>
    );
  }

  const FormWrapper = embedded ? 'div' : 'form';
  const formProps = embedded ? {} : { onSubmit: handleSubmit };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 transition-colors duration-200">Quick Create Data Source</h3>
        <Button
          type="button"
          onClick={handleDiscover}
          variant="secondary"
          size="sm"
          disabled={isLoading || !selectedConnection}
        >
          <MagnifyingGlassIcon className={`w-4 h-4 inline mr-1 transition-transform duration-300 ${isLoading ? 'animate-spin' : 'group-hover:scale-110'}`} />
          Discover
        </Button>
      </div>

      <FormWrapper {...formProps} className="space-y-4">
        {/* Connection Selection */}
        <div>
          <Dropdown
            label="Connection *"
            options={connections.map(conn => ({
              value: conn.id,
              label: `${conn.name} (${conn.type})`,
              icon: ServerIcon,
              badge: conn.type
            }))}
            value={selectedConnection?.id}
            onChange={(value) => {
              const conn = connections.find((c) => c.id === value);
              setSelectedConnection(conn || null);
            }}
            placeholder="Choose a connection..."
            searchable
          />
          <p className="mt-1 text-xs text-gray-500">
            Select the connection to create a data source from
          </p>
        </div>

        {/* Display Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Display Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-blue-400 focus:scale-[1.01]"
            placeholder="e.g., Sales Database"
            required
          />
        </div>

        {/* Source Identifier */}
        <div>
          <label htmlFor="source_identifier" className="block text-sm font-medium text-gray-700 mb-1">
            {getSourceTypeLabel()}{' '}
            {selectedConnection && ['mysql', 'postgresql'].includes(selectedConnection.type)
              ? 'Name'
              : 'Path'}{' '}
            *
          </label>
          <input
            type="text"
            id="source_identifier"
            value={formData.source_identifier}
            onChange={(e) => setFormData({ ...formData, source_identifier: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-blue-400 focus:scale-[1.01]"
            placeholder={
              selectedConnection && ['mysql', 'postgresql'].includes(selectedConnection.type)
                ? 'e.g., visualization_test'
                : 'e.g., data/reports/'
            }
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            {selectedConnection && ['mysql', 'postgresql'].includes(selectedConnection.type)
              ? 'The database name on your server'
              : 'The folder path in your storage'}
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type={embedded ? "button" : "submit"}
            onClick={embedded ? handleSubmit : undefined}
            disabled={isLoading}
          >
            <PlusIcon className="w-4 h-4 inline mr-1" />
            {isLoading ? 'Creating...' : 'Create Data Source'}
          </Button>
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </FormWrapper>

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
            <p className="text-sm text-gray-600 mb-4">
              Found {discoverResult.items?.length || 0} {getSourceTypeLabel().toLowerCase()}
              {discoverResult.items?.length !== 1 ? 's' : ''}
            </p>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {discoverResult.items?.map((item) => (
                <button
                  key={item.identifier}
                  type="button"
                  onClick={() => handleSelectDiscovered(item)}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-md transition-all duration-200 hover:shadow-sm hover:scale-[1.02] hover:-translate-y-0.5"
                >
                  <div className="font-medium text-gray-900 transition-colors duration-200">{item.name}</div>
                  <div className="text-sm text-gray-600">{item.identifier}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-red-600">{discoverResult?.message || 'Discovery failed'}</p>
            {discoverResult?.error && (
              <p className="text-sm text-gray-600 mt-2">{discoverResult.error}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
