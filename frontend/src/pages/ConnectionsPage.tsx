import { useEffect, useState } from 'react';
import { useConnectionStore } from '../store/connectionStore';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useTheme } from '../contexts/ThemeContext';
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
  const styles = useThemedStyles();
  const { theme } = useTheme();
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
    <div style={{ backgroundColor: theme.colors.bgPrimary, minHeight: '100vh' }}>
      <Header
        title="Connections"
        subtitle="Manage database connections and external data sources"
      />

      <div className="p-3 sm:p-4 md:p-6 w-full">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <div className="text-xs sm:text-sm" style={{ color: theme.colors.textSecondary }}>
            {connections.length} connection{connections.length !== 1 ? 's' : ''}
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            {/* View Toggle */}
            {connections.length > 0 && (
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  onClick={() => setViewMode('table')}
                  className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium border rounded-l-md transition-colors"
                  style={{
                    backgroundColor: viewMode === 'table' ? theme.colors.accentPrimary : theme.colors.bgSecondary,
                    color: viewMode === 'table' ? 'white' : theme.colors.textPrimary,
                    borderColor: viewMode === 'table' ? theme.colors.accentPrimary : theme.colors.borderPrimary,
                    zIndex: viewMode === 'table' ? 10 : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    if (viewMode !== 'table') {
                      e.currentTarget.style.backgroundColor = theme.colors.bgTertiary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (viewMode !== 'table') {
                      e.currentTarget.style.backgroundColor = theme.colors.bgSecondary;
                    }
                  }}
                  aria-label="Table view"
                >
                  <ViewColumnsIcon className="w-3 h-3 sm:w-4 sm:h-4 inline sm:mr-1" />
                  <span className="hidden sm:inline">Table</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium border-t border-b border-r rounded-r-md transition-colors"
                  style={{
                    backgroundColor: viewMode === 'grid' ? theme.colors.accentPrimary : theme.colors.bgSecondary,
                    color: viewMode === 'grid' ? 'white' : theme.colors.textPrimary,
                    borderColor: viewMode === 'grid' ? theme.colors.accentPrimary : theme.colors.borderPrimary,
                    zIndex: viewMode === 'grid' ? 10 : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    if (viewMode !== 'grid') {
                      e.currentTarget.style.backgroundColor = theme.colors.bgTertiary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (viewMode !== 'grid') {
                      e.currentTarget.style.backgroundColor = theme.colors.bgSecondary;
                    }
                  }}
                  aria-label="Grid view"
                >
                  <Squares2X2Icon className="w-3 h-3 sm:w-4 sm:h-4 inline sm:mr-1" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>
            )}

            <Button onClick={handleCreate} className="text-sm sm:text-base">
              + New Connection
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && connections.length === 0 && (
          <div className="text-center py-12" style={{ color: theme.colors.textSecondary }}>
            Loading connections...
          </div>
        )}

        {/* Empty State */}
        {!isLoading && connections.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔌</div>
            <h3 className="text-lg font-semibold mb-2" style={styles.heading.primary}>
              No connections configured
            </h3>
            <p className="mb-6" style={{ color: theme.colors.textSecondary }}>
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
