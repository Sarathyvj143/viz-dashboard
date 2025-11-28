import { useState } from 'react';
import { Connection } from '../../types/connection';
import { getConnectionTypeLabel, getConnectionDetails } from '../../utils/connectionHelpers';
import ResponsiveTable from '../common/ResponsiveTable';
import {
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  BeakerIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme } from '../../contexts/ThemeContext';

interface ConnectionsTableProps {
  connections: Connection[];
  testingId: number | null;
  deletingId: number | null;
  onTest: (id: number) => void;
  onEdit: (connection: Connection) => void;
  onDelete: (id: number) => void;
  onManagePermissions?: (connection: Connection) => void;
}

export default function ConnectionsTable({
  connections,
  testingId,
  deletingId,
  onTest,
  onEdit,
  onDelete,
  onManagePermissions,
}: ConnectionsTableProps) {
  const styles = useThemedStyles();
  const { theme } = useTheme();
  const [hoveredButtonId, setHoveredButtonId] = useState<string | null>(null);

  return (
    <ResponsiveTable
      data={connections}
      getRowKey={(connection) => connection.id}
      emptyMessage="No connections available"
      containerClassName="shadow-md rounded-lg overflow-hidden"
      containerStyle={{ backgroundColor: theme.colors.bgPrimary }}
      columns={[
          {
            key: 'name',
            label: 'Name',
            width: '15%',
            minWidth: '120px',
            render: (connection) => (
              <div className="text-xs md:text-sm lg:text-base font-medium" style={styles.table.cell}>
                {connection.name}
              </div>
            )
          },
          {
            key: 'type',
            label: 'Type',
            width: '12%',
            minWidth: '100px',
            render: (connection) => (
              <div className="text-xs md:text-sm lg:text-base" style={styles.table.cell}>
                {getConnectionTypeLabel(connection.type)}
              </div>
            )
          },
          {
            key: 'details',
            label: 'Details',
            width: '25%',
            minWidth: '200px',
            render: (connection) => (
              <div className="text-xs md:text-sm lg:text-base max-w-md truncate" style={styles.table.cellSecondary} title={getConnectionDetails(connection)}>
                {getConnectionDetails(connection)}
              </div>
            )
          },
          {
            key: 'status',
            label: 'Status',
            width: '12%',
            minWidth: '100px',
            render: (connection) => (
              connection.is_active ? (
                <span className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium" style={styles.badge('success')}>
                  <CheckCircleIcon className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium" style={styles.badge('info')}>
                  <XCircleIcon className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  Inactive
                </span>
              )
            )
          },
          {
            key: 'created',
            label: 'Created',
            width: '12%',
            minWidth: '100px',
            render: (connection) => (
              <span className="text-xs md:text-sm lg:text-base whitespace-nowrap" style={styles.table.cellSecondary}>
                {new Date(connection.created_at).toLocaleDateString()}
              </span>
            )
          },
          {
            key: 'actions',
            label: 'Actions',
            width: '24%',
            minWidth: '200px',
            align: 'right',
            render: (connection) => (
              <div className="flex items-center justify-end gap-1 md:gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTest(connection.id);
                  }}
                  disabled={testingId === connection.id}
                  onMouseEnter={() => setHoveredButtonId(`test-${connection.id}`)}
                  onMouseLeave={() => setHoveredButtonId(null)}
                  className="inline-flex items-center p-1.5 md:p-2 rounded-md transition-colors disabled:opacity-50 focus:outline-none focus:ring-2"
                  style={{
                    color: theme.colors.info,
                    backgroundColor: hoveredButtonId === `test-${connection.id}` ? theme.colors.bgSecondary : 'transparent',
                    outlineColor: theme.colors.info,
                  }}
                  title="Test connection"
                  aria-label={`Test connection ${connection.name}`}
                >
                  <BeakerIcon className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                {onManagePermissions && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onManagePermissions(connection);
                    }}
                    onMouseEnter={() => setHoveredButtonId(`permissions-${connection.id}`)}
                    onMouseLeave={() => setHoveredButtonId(null)}
                    className="inline-flex items-center p-1.5 md:p-2 rounded-md transition-colors focus:outline-none focus:ring-2"
                    style={{
                      color: theme.colors.accentSecondary || '#9333ea',
                      backgroundColor: hoveredButtonId === `permissions-${connection.id}` ? theme.colors.bgSecondary : 'transparent',
                      outlineColor: theme.colors.accentSecondary || '#9333ea',
                    }}
                    title="Manage permissions"
                    aria-label={`Manage permissions for ${connection.name}`}
                  >
                    <ShieldCheckIcon className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(connection);
                  }}
                  onMouseEnter={() => setHoveredButtonId(`edit-${connection.id}`)}
                  onMouseLeave={() => setHoveredButtonId(null)}
                  className="inline-flex items-center p-1.5 md:p-2 rounded-md transition-colors focus:outline-none focus:ring-2"
                  style={{
                    color: theme.colors.textSecondary,
                    backgroundColor: hoveredButtonId === `edit-${connection.id}` ? theme.colors.bgSecondary : 'transparent',
                    outlineColor: theme.colors.textSecondary,
                  }}
                  title="Edit connection"
                  aria-label={`Edit connection ${connection.name}`}
                >
                  <PencilIcon className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(connection.id);
                  }}
                  disabled={deletingId === connection.id}
                  onMouseEnter={() => setHoveredButtonId(`delete-${connection.id}`)}
                  onMouseLeave={() => setHoveredButtonId(null)}
                  className="inline-flex items-center p-1.5 md:p-2 rounded-md transition-colors disabled:opacity-50 focus:outline-none focus:ring-2"
                  style={{
                    color: theme.colors.error,
                    backgroundColor: hoveredButtonId === `delete-${connection.id}` ? theme.colors.bgSecondary : 'transparent',
                    outlineColor: theme.colors.error,
                  }}
                  title="Delete connection"
                  aria-label={`Delete connection ${connection.name}`}
                >
                  <TrashIcon className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            )
          }
        ]}
        mobileCardRender={(connection) => (
          <div className="space-y-3">
            {/* Connection Name and Type */}
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm sm:text-base font-medium break-words" style={{ color: theme.colors.textPrimary }}>
                  {connection.name}
                </div>
                <div className="text-xs sm:text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                  {getConnectionTypeLabel(connection.type)}
                </div>
              </div>
              <div>
                {connection.is_active ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={styles.badge('success')}>
                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={styles.badge('info')}>
                    <XCircleIcon className="w-3 h-3 mr-1" />
                    Inactive
                  </span>
                )}
              </div>
            </div>

            {/* Details */}
            <div>
              <div className="text-xs" style={{ color: theme.colors.textSecondary }}>Details</div>
              <div className="text-xs sm:text-sm break-words mt-1" style={{ color: theme.colors.textPrimary }}>
                {getConnectionDetails(connection)}
              </div>
            </div>

            {/* Created Date */}
            <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
              Created: {new Date(connection.created_at).toLocaleDateString()}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t" style={{ borderColor: theme.colors.borderPrimary }}>
              <button
                onClick={() => onTest(connection.id)}
                disabled={testingId === connection.id}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-opacity disabled:opacity-50"
                style={{ backgroundColor: theme.colors.info, color: 'white' }}
                aria-label="Test connection"
              >
                <BeakerIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Test</span>
              </button>
              {onManagePermissions && (
                <button
                  onClick={() => onManagePermissions(connection)}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-opacity"
                  style={{ backgroundColor: theme.colors.accentSecondary || '#9333ea', color: 'white' }}
                  aria-label="Manage permissions"
                >
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Permissions</span>
                </button>
              )}
              <button
                onClick={() => onEdit(connection)}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-opacity"
                style={{ backgroundColor: theme.colors.bgSecondary, color: theme.colors.textPrimary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary }}
                aria-label="Edit connection"
              >
                <PencilIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Edit</span>
              </button>
              <button
                onClick={() => onDelete(connection.id)}
                disabled={deletingId === connection.id}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-opacity disabled:opacity-50"
                style={{ backgroundColor: theme.colors.error, color: 'white' }}
                aria-label="Delete connection"
              >
                <TrashIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Delete</span>
              </button>
            </div>
          </div>
        )}
      />
  );
}
