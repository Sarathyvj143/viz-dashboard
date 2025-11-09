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
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200" aria-label="Database connections">
        <caption className="sr-only">
          List of {connections.length} database and storage connections
        </caption>
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              id="connection-name"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Name
            </th>
            <th
              scope="col"
              id="connection-type"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Type
            </th>
            <th
              scope="col"
              id="connection-details"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Details
            </th>
            <th
              scope="col"
              id="connection-status"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              scope="col"
              id="connection-created"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Created
            </th>
            <th
              scope="col"
              id="connection-actions"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <span className="sr-only">Actions</span>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {connections.map((connection) => (
            <tr key={connection.id} className="hover:bg-gray-50 transition-colors">
              <td headers="connection-name" className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {connection.name}
                </div>
              </td>
              <td headers="connection-type" className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {getConnectionTypeLabel(connection.type)}
                </div>
              </td>
              <td headers="connection-details" className="px-6 py-4">
                <div className="text-sm text-gray-600 max-w-md truncate">
                  {getConnectionDetails(connection)}
                </div>
              </td>
              <td headers="connection-status" className="px-6 py-4 whitespace-nowrap">
                {connection.is_active ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <XCircleIcon className="w-4 h-4 mr-1" />
                    Inactive
                  </span>
                )}
              </td>
              <td headers="connection-created" className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {new Date(connection.created_at).toLocaleDateString()}
              </td>
              <td headers="connection-actions" className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onTest(connection.id)}
                    disabled={testingId === connection.id}
                    className="inline-flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    title="Test connection"
                    aria-label={`Test connection ${connection.name}`}
                  >
                    <BeakerIcon className="w-5 h-5" />
                  </button>
                  {onManagePermissions && (
                    <button
                      onClick={() => onManagePermissions(connection)}
                      className="inline-flex items-center p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      title="Manage permissions"
                      aria-label={`Manage permissions for ${connection.name}`}
                    >
                      <ShieldCheckIcon className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(connection)}
                    className="inline-flex items-center p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    title="Edit connection"
                    aria-label={`Edit connection ${connection.name}`}
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(connection.id)}
                    disabled={deletingId === connection.id}
                    className="inline-flex items-center p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
