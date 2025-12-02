// React imports
import { useState } from 'react';

// Store & Context imports
import { useTheme } from '../../../contexts/ThemeContext';
import { useToastStore } from '../../../store/toastStore';

// Type imports
import { ColumnSchema } from '../../../types/dataset';

// Component imports
import Button from '../../common/Button';

// Icon imports
import { PencilIcon, CheckIcon } from '@heroicons/react/24/outline';

// Utility imports
import { datasetValidation, datasetValidationMessages } from '../../../utils/datasetValidation';

interface VirtualTableSchemaEditorProps {
  columns: ColumnSchema[];
  onSave: (columns: ColumnSchema[]) => void;
  onCancel?: () => void;
}

const AVAILABLE_TYPES = [
  { value: 'integer', label: 'Integer' },
  { value: 'float', label: 'Float' },
  { value: 'string', label: 'String' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'json', label: 'JSON' },
];

/**
 * VirtualTableSchemaEditor - Allows editing column names and data types for virtual datasets
 *
 * @param columns - Array of column schemas to edit
 * @param onSave - Callback when user saves the schema
 * @param onCancel - Optional callback when user cancels editing
 *
 * @example
 * <VirtualTableSchemaEditor
 *   columns={columns}
 *   onSave={(updatedColumns) => console.log(updatedColumns)}
 *   onCancel={() => setEditing(false)}
 * />
 *
 * @note This component is currently a prototype. It handles local editing and validation
 *       but cannot persist schema changes until backend API support is added.
 */
export default function VirtualTableSchemaEditor({
  columns: initialColumns,
  onSave,
  onCancel,
}: VirtualTableSchemaEditorProps) {
  const { theme } = useTheme();
  const { showToast } = useToastStore();

  const [columns, setColumns] = useState<ColumnSchema[]>(
    initialColumns.map((col) => ({ ...col, originalName: col.name }))
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleTypeChange = (index: number, newType: string) => {
    const updated = [...columns];
    updated[index] = { ...updated[index], type: newType };
    setColumns(updated);
  };

  const handleNullableChange = (index: number, nullable: boolean) => {
    const updated = [...columns];
    updated[index] = { ...updated[index], nullable };
    setColumns(updated);
  };

  const startEditingName = (index: number) => {
    setEditingIndex(index);
    setEditingName(columns[index].name);
  };

  const saveColumnName = (index: number) => {
    const trimmed = editingName.trim();

    // Validation
    if (!trimmed) {
      showToast('Column name cannot be empty', 'error');
      return;
    }

    if (!datasetValidation.columnName(trimmed)) {
      showToast(datasetValidationMessages.columnName, 'error');
      return;
    }

    // Check duplicates (case-insensitive)
    const isDuplicate = columns.some((col, i) =>
      i !== index && col.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      showToast('Column name must be unique', 'error');
      return;
    }

    // Save
    const updated = [...columns];
    updated[index] = { ...updated[index], name: trimmed };
    setColumns(updated);
    setEditingIndex(null);
    setEditingName('');
  };

  const cancelEditingName = () => {
    setEditingIndex(null);
    setEditingName('');
  };

  const handleSave = () => {
    // Validate at least one column exists
    if (columns.length === 0) {
      showToast('At least one column is required', 'error');
      return;
    }

    // Validate no empty column names
    const hasEmptyNames = columns.some(col => !col.name.trim());
    if (hasEmptyNames) {
      showToast('All columns must have a name', 'error');
      return;
    }

    // Call parent callback
    onSave(columns);

    showToast('Schema configuration saved', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: theme.colors.bgSecondary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary }}>
        <div className="px-6 py-4" style={{ borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: theme.colors.borderPrimary }}>
          <h3 className="text-lg font-semibold" style={{ color: theme.colors.textPrimary }}>
            Virtual Table Column & Data Type Configuration
          </h3>
          <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
            Review and modify column names and data types for your virtual dataset
          </p>
        </div>

        {/* Schema Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: theme.colors.bgTertiary }}>
              <tr>
                <th
                  className="px-6 py-3 text-left text-sm font-semibold"
                  style={{ color: theme.colors.textPrimary, width: '40%' }}
                >
                  Column Name
                </th>
                <th
                  className="px-6 py-3 text-left text-sm font-semibold"
                  style={{ color: theme.colors.textPrimary, width: '30%' }}
                >
                  Data Type
                </th>
                <th
                  className="px-6 py-3 text-left text-sm font-semibold"
                  style={{ color: theme.colors.textPrimary, width: '20%' }}
                >
                  Nullable
                </th>
                <th
                  className="px-6 py-3 text-left text-sm font-semibold"
                  style={{ color: theme.colors.textPrimary, width: '10%' }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {columns.map((column, index) => (
                <tr
                  key={column.originalName || column.name}
                  style={{
                    borderBottomWidth: '1px',
                    borderBottomStyle: 'solid',
                    borderBottomColor: theme.colors.borderPrimary,
                  }}
                >
                  {/* Column Name */}
                  <td className="px-6 py-4">
                    {editingIndex === index ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2"
                          style={{
                            backgroundColor: theme.colors.bgPrimary,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: theme.colors.accentPrimary,
                            color: theme.colors.textPrimary,
                          }}
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveColumnName(index);
                            if (e.key === 'Escape') cancelEditingName();
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => saveColumnName(index)}
                          className="p-1 rounded hover:opacity-80"
                          style={{ color: theme.colors.success }}
                          title="Save"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between group">
                        <span className="font-medium" style={{ color: theme.colors.textPrimary }}>
                          {column.name}
                        </span>
                        {column.originalName && column.name !== column.originalName && (
                          <span
                            className="text-xs ml-2 px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: theme.colors.bgTertiary,
                              color: theme.colors.textSecondary,
                            }}
                          >
                            was: {column.originalName}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Data Type */}
                  <td className="px-6 py-4">
                    <select
                      className="w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: theme.colors.bgPrimary,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: theme.colors.borderPrimary,
                        color: theme.colors.textPrimary,
                      }}
                      value={column.type}
                      onChange={(e) => handleTypeChange(index, e.target.value)}
                    >
                      {AVAILABLE_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Nullable */}
                  <td className="px-6 py-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded"
                        style={{ accentColor: theme.colors.accentPrimary }}
                        checked={column.nullable}
                        onChange={(e) => handleNullableChange(index, e.target.checked)}
                      />
                      <span className="ml-2 text-sm" style={{ color: theme.colors.textSecondary }}>
                        {column.nullable ? 'Yes' : 'No'}
                      </span>
                    </label>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    {editingIndex !== index && (
                      <button
                        onClick={() => startEditingName(index)}
                        className="p-1 rounded hover:opacity-80"
                        style={{ color: theme.colors.accentPrimary }}
                        title="Edit column name"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: theme.colors.borderPrimary }}>
          {onCancel && (
            <Button onClick={onCancel} variant="secondary">
              Cancel
            </Button>
          )}
          <Button onClick={handleSave}>
            Save Schema
          </Button>
        </div>
      </div>

      {/* Help Text */}
      <div
        className="p-4 rounded-lg"
        style={{
          backgroundColor: theme.colors.bgTertiary,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: theme.colors.borderPrimary,
        }}
      >
        <h4 className="text-sm font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
          Schema Configuration Tips
        </h4>
        <ul className="text-sm space-y-1" style={{ color: theme.colors.textSecondary }}>
          <li>• Click the edit icon to rename columns</li>
          <li>• Use dropdown menus to change data types</li>
          <li>• Check "Nullable" if the column can contain NULL values</li>
          <li>• Column names must start with a letter or underscore</li>
          <li>• Column names cannot be SQL reserved words</li>
          <li>• Changes are saved when you click "Save Schema"</li>
        </ul>
      </div>
    </div>
  );
}
