import { useEffect, useState } from 'react';
import { useConnectionStore } from '../store/connectionStore';
import { Connection } from '../types/connection';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConnectionForm from '../components/admin/ConnectionForm';
import ConnectionsTable from '../components/connections/ConnectionsTable';
import ConnectionsGrid from '../components/connections/ConnectionsGrid';
import ConnectionPermissions from '../components/admin/ConnectionPermissions';
import { useToastStore } from '../store/toastStore';
import { ViewColumnsIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

type ViewMode = 'table' | 'grid';

export default function ConnectionsPage() {
  const {
    connections,
    isLoading,
    error,
    testResult,
    fetchConnections,
    deleteConnection,
    testConnection,
    clearTestResult,
  } = useConnectionStore();

  const { showToast } = useToastStore();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [selectedConnectionForPermissions, setSelectedConnectionForPermissions] = useState<Connection | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    if (error) {
      showToast(error, 'error');
    }
  }, [error, showToast]);

  useEffect(() => {
    if (testResult) {
      showToast(testResult.message, testResult.success ? 'success' : 'error');
      setTestingId(null);
      clearTestResult();
    }
  }, [testResult, showToast, clearTestResult]);

  const handleCreate = () => {
    setEditingConnection(null);
    setIsModalOpen(true);
  };

  const handleEdit = (connection: Connection) => {
    setEditingConnection(connection);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this connection?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteConnection(id);
      showToast('Connection deleted successfully', 'success');
    } catch (err) {
      // Error handled by store
    } finally {
      setDeletingId(null);
    }
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      await testConnection(id);
    } catch (err) {
      // Error handled by store
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    setEditingConnection(null);
    fetchConnections();
  };

  const handleManagePermissions = (connection: Connection) => {
    setSelectedConnectionForPermissions(connection);
    setIsPermissionsModalOpen(true);
  };

  return (
    <div>
      <Header
        title="Connections"
        subtitle="Manage database connections and external data sources"
      />

      <div className="p-6">
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600">
            {connections.length} connection{connections.length !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-3">
            {/* View Toggle */}
            {connections.length > 0 && (
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 text-sm font-medium border ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white border-blue-600 z-10'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } rounded-l-md transition-colors`}
                  aria-label="Table view"
                >
                  <ViewColumnsIcon className="w-4 h-4 inline mr-1" />
                  Table
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm font-medium border-t border-b border-r ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white border-blue-600 z-10'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } rounded-r-md transition-colors`}
                  aria-label="Grid view"
                >
                  <Squares2X2Icon className="w-4 h-4 inline mr-1" />
                  Grid
                </button>
              </div>
            )}

            <Button onClick={handleCreate}>
              + New Connection
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && connections.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Loading connections...
          </div>
        )}

        {/* Empty State */}
        {!isLoading && connections.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔌</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No connections configured
            </h3>
            <p className="text-gray-600 mb-6">
              Connect to databases or cloud storage to start visualizing your data
            </p>
            <Button onClick={handleCreate}>
              Create Connection
            </Button>
          </div>
        )}

        {/* Connections Display - Table or Grid */}
        {connections.length > 0 && (
          <>
            {viewMode === 'table' ? (
              <ConnectionsTable
                connections={connections}
                testingId={testingId}
                deletingId={deletingId}
                onTest={handleTest}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onManagePermissions={handleManagePermissions}
              />
            ) : (
              <ConnectionsGrid
                connections={connections}
                testingId={testingId}
                deletingId={deletingId}
                onTest={handleTest}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </>
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingConnection(null);
          }}
          title={editingConnection ? 'Edit Connection' : 'Create New Connection'}
        >
          <ConnectionForm
            connection={editingConnection}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingConnection(null);
            }}
          />
        </Modal>

        {/* Permissions Management Modal */}
        <Modal
          isOpen={isPermissionsModalOpen}
          onClose={() => {
            setIsPermissionsModalOpen(false);
            setSelectedConnectionForPermissions(null);
          }}
          title="Manage Connection Permissions"
        >
          {selectedConnectionForPermissions && (
            <ConnectionPermissions
              connectionId={selectedConnectionForPermissions.id}
              connectionName={selectedConnectionForPermissions.name}
            />
          )}
        </Modal>
      </div>
    </div>
  );
}
