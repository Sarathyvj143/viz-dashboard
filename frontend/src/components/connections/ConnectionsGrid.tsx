import { useState } from 'react';
import { Connection } from '../../types/connection';
import { getConnectionTypeLabel, getConnectionTypeIcon } from '../../utils/connectionHelpers';
import DataSourceManager from './DataSourceManager';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface ConnectionsGridProps {
  connections: Connection[];
  testingId: number | null;
  deletingId: number | null;
  onTest: (id: number) => void;
  onEdit: (connection: Connection) => void;
  onDelete: (id: number) => void;
}

export default function ConnectionsGrid({
  connections,
  testingId,
  deletingId,
  onTest,
  onEdit,
  onDelete,
}: ConnectionsGridProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {connections.map((connection) => (
        <div
          key={connection.id}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <span className="text-3xl mr-3">
                {getConnectionTypeIcon(connection.type)}
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {connection.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {getConnectionTypeLabel(connection.type)}
                </p>
              </div>
            </div>
            <div>
              {connection.is_active ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Inactive
                </span>
              )}
            </div>
          </div>

          {/* Connection Details */}
          <div className="mb-4 space-y-1">
            {connection.config.host && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Host:</span> {connection.config.host}
                {connection.config.port && `:${connection.config.port}`}
              </div>
            )}
            {connection.config.database && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Database:</span> {connection.config.database}
              </div>
            )}
            {connection.config.bucket && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Bucket:</span> {connection.config.bucket}
              </div>
            )}
            {connection.config.region && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Region:</span> {connection.config.region}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => onTest(connection.id)}
              disabled={testingId === connection.id}
              className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
            >
              {testingId === connection.id ? 'Testing...' : 'Test'}
            </button>
            <button
              onClick={() => onEdit(connection)}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(connection.id)}
              disabled={deletingId === connection.id}
              className="flex-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
            >
              {deletingId === connection.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={() => toggleExpand(connection.id)}
            className="w-full mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            <span>Manage {['mysql', 'postgresql'].includes(connection.type) ? 'Databases' : 'Folders'}</span>
            {expandedId === connection.id ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>

          {/* Data Source Manager */}
          {expandedId === connection.id && (
            <DataSourceManager connection={connection} />
          )}

          {/* Metadata */}
          <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
            Created: {new Date(connection.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}
