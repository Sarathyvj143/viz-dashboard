import { useState } from 'react';
import { Connection } from '../../types/connection';
import { getConnectionTypeLabel, getConnectionDetails } from '../../utils/connectionHelpers';
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
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null);
  const [hoveredButtonId, setHoveredButtonId] = useState<string | null>(null);

  return (
    <div className="shadow-md rounded-lg overflow-hidden" style={{ backgroundColor: theme.colors.bgPrimary }}>
      <table className="min-w-full" style={{ borderTopColor: theme.colors.borderPrimary, borderTopWidth: '1px', borderTopStyle: 'solid' }} aria-label="Database connections">
        <caption className="sr-only">
          List of {connections.length} database and storage connections
        </caption>
        <thead style={styles.table.header}>
          <tr>
            <th
              scope="col"
              id="connection-name"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
              style={styles.table.headerCell}
            >
              Name
            </th>
            <th
              scope="col"
              id="connection-type"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
              style={styles.table.headerCell}
            >
              Type
            </th>
            <th
              scope="col"
              id="connection-details"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
              style={styles.table.headerCell}
            >
              Details
            </th>
            <th
              scope="col"
              id="connection-status"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
              style={styles.table.headerCell}
            >
              Status
            </th>
            <th
              scope="col"
              id="connection-created"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
              style={styles.table.headerCell}
            >
              Created
            </th>
            <th
              scope="col"
              id="connection-actions"
              className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"
              style={styles.table.headerCell}
            >
              <span className="sr-only">Actions</span>
              Actions
            </th>
          </tr>
        </thead>
        <tbody style={styles.table.body}>
          {connections.map((connection) => (
            <tr
              key={connection.id}
              className="transition-colors"
              style={{
                ...styles.table.row,
                ...(hoveredRowId === connection.id ? styles.table.rowHover : {}),
              }}
              onMouseEnter={() => setHoveredRowId(connection.id)}
              onMouseLeave={() => setHoveredRowId(null)}
            >
              <td headers="connection-name" className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium" style={styles.table.cell}>
                  {connection.name}
                </div>
              </td>
              <td headers="connection-type" className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm" style={styles.table.cell}>
                  {getConnectionTypeLabel(connection.type)}
                </div>
              </td>
              <td headers="connection-details" className="px-6 py-4">
                <div className="text-sm max-w-md truncate" style={styles.table.cellSecondary}>
                  {getConnectionDetails(connection)}
                </div>
              </td>
              <td headers="connection-status" className="px-6 py-4 whitespace-nowrap">
                {connection.is_active ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={styles.badge('success')}>
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={styles.badge('info')}>
                    <XCircleIcon className="w-4 h-4 mr-1" />
                    Inactive
                  </span>
                )}
              </td>
              <td headers="connection-created" className="px-6 py-4 whitespace-nowrap text-sm" style={styles.table.cellSecondary}>
                {new Date(connection.created_at).toLocaleDateString()}
              </td>
              <td headers="connection-actions" className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onTest(connection.id)}
                    disabled={testingId === connection.id}
                    onMouseEnter={() => setHoveredButtonId(`test-${connection.id}`)}
                    onMouseLeave={() => setHoveredButtonId(null)}
                    className="inline-flex items-center p-2 rounded-md transition-colors disabled:opacity-50 focus:outline-none focus:ring-2"
                    style={{
                      color: theme.colors.info,
                      backgroundColor: hoveredButtonId === `test-${connection.id}` ? theme.colors.bgSecondary : 'transparent',
                      outlineColor: theme.colors.info,
                    }}
                    title="Test connection"
                    aria-label={`Test connection ${connection.name}`}
                  >
                    <BeakerIcon className="w-5 h-5" />
                  </button>
                  {onManagePermissions && (
                    <button
                      onClick={() => onManagePermissions(connection)}
                      onMouseEnter={() => setHoveredButtonId(`permissions-${connection.id}`)}
                      onMouseLeave={() => setHoveredButtonId(null)}
                      className="inline-flex items-center p-2 rounded-md transition-colors focus:outline-none focus:ring-2"
                      style={{
                        color: theme.colors.accentSecondary || '#9333ea',
                        backgroundColor: hoveredButtonId === `permissions-${connection.id}` ? theme.colors.bgSecondary : 'transparent',
                        outlineColor: theme.colors.accentSecondary || '#9333ea',
                      }}
                      title="Manage permissions"
                      aria-label={`Manage permissions for ${connection.name}`}
                    >
                      <ShieldCheckIcon className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(connection)}
                    onMouseEnter={() => setHoveredButtonId(`edit-${connection.id}`)}
                    onMouseLeave={() => setHoveredButtonId(null)}
                    className="inline-flex items-center p-2 rounded-md transition-colors focus:outline-none focus:ring-2"
                    style={{
                      color: theme.colors.textSecondary,
                      backgroundColor: hoveredButtonId === `edit-${connection.id}` ? theme.colors.bgSecondary : 'transparent',
                      outlineColor: theme.colors.textSecondary,
                    }}
                    title="Edit connection"
                    aria-label={`Edit connection ${connection.name}`}
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(connection.id)}
                    disabled={deletingId === connection.id}
                    onMouseEnter={() => setHoveredButtonId(`delete-${connection.id}`)}
                    onMouseLeave={() => setHoveredButtonId(null)}
                    className="inline-flex items-center p-2 rounded-md transition-colors disabled:opacity-50 focus:outline-none focus:ring-2"
                    style={{
                      color: theme.colors.error,
                      backgroundColor: hoveredButtonId === `delete-${connection.id}` ? theme.colors.bgSecondary : 'transparent',
                      outlineColor: theme.colors.error,
                    }}
                    title="Delete connection"
                    aria-label={`Delete connection ${connection.name}`}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
