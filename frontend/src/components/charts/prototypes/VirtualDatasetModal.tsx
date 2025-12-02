// React imports
import { useState } from 'react';

// Store & Context imports
import { useTheme } from '../../../contexts/ThemeContext';
import { useThemedStyles } from '../../../hooks/useThemedStyles';
import { useToastStore } from '../../../store/toastStore';

// Type imports
import { ColumnSchema, QueryValidationResult } from '../../../types/dataset';

// Component imports
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Spinner from '../../common/Spinner';

// Icon imports
import { PlayIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface VirtualDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * The ID of the database connection to execute the query against.
   * This is required to determine which external database to query.
   */
  connectionId: number;
}

export default function VirtualDatasetModal({ isOpen, onClose, connectionId }: VirtualDatasetModalProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles();
  const { showToast } = useToastStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [query, setQuery] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [validationResult, setValidationResult] = useState<QueryValidationResult | null>(null);
  const [queryResult, setQueryResult] = useState<{
    columns: ColumnSchema[];
    data: Record<string, string | number | boolean | null>[];
  } | null>(null);

  const handleRunQuery = async () => {
    if (!query.trim()) {
      showToast('Please enter a SQL query', 'error');
      return;
    }

    setIsRunning(true);
    setQueryResult(null);

    try {
      // TODO: Replace with actual API call
      // const result = await virtualDatasetApi.executeQuery(connectionId, query);
      console.log('Executing query against connection:', connectionId);

      showToast(
        'Query execution is not yet implemented. This feature requires backend support for SQL validation and execution.',
        'info'
      );

      // Show structure without real data
      setQueryResult({
        columns: [],
        data: [],
      });
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Query execution failed',
        'error'
      );
      console.error('Query execution error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleValidateQuery = async () => {
    if (!query.trim()) {
      showToast('Please enter a SQL query to validate', 'error');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      // TODO: Replace with actual API call
      // const result = await virtualDatasetApi.validateQuery(connectionId, query);
      console.log('Validating query against connection:', connectionId);

      showToast(
        'Query validation is not yet implemented. This feature requires backend support.',
        'info'
      );

      setValidationResult({
        success: false,
        message: 'Query validation requires backend API',
        error: 'This feature is not yet available',
      });
    } catch (error) {
      setValidationResult({
        success: false,
        message: 'Validation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !query.trim()) {
      showToast('Please provide a name and query', 'error');
      return;
    }

    // TODO: Implement actual save when backend is ready
    showToast(
      'Saving virtual datasets is not yet implemented. This feature requires backend support.',
      'info'
    );

    // When backend is ready, create dataset and call onSave:
    // const virtualDataset: VirtualDatasetData = {
    //   name: name.trim(),
    //   description: description.trim(),
    //   query: query.trim(),
    //   connectionId,
    //   columns: queryResult?.columns || [],
    //   previewData: queryResult?.data || [],
    // };
    // await virtualDatasetApi.create(virtualDataset);
    // handleClose();
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setQuery('');
    setValidationResult(null);
    setQueryResult(null);
    onClose();
  };

  const canSave = name.trim() && query.trim() && validationResult?.success && queryResult;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Virtual Dataset using SQL Query"
      size="lg"
    >
      <div className="space-y-6">
        {/* Dataset Name & Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Virtual Dataset Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Cost Explorer Virtual Dataset"
            required
          />
          <Input
            label="Description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this dataset"
          />
        </div>

        {/* SQL Editor */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
            SQL Query
          </label>
          <textarea
            className="w-full px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 font-mono text-sm"
            style={{
              backgroundColor: theme.colors.bgPrimary,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: theme.colors.borderPrimary,
              color: theme.colors.textPrimary,
              minHeight: '200px',
            }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`SELECT
  id,
  resource_name,
  SUM(cost) as total_cost,
  DATE(created_at) as date
FROM resources
WHERE created_at >= '2024-01-01'
GROUP BY id, resource_name, DATE(created_at)
ORDER BY total_cost DESC
LIMIT 100`}
            spellCheck={false}
          />
          <p className="text-xs mt-2" style={{ color: theme.colors.textSecondary }}>
            Tip: Use SELECT statements to query your data sources. Syntax highlighting and autocomplete coming soon.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleRunQuery}
            disabled={!query.trim() || isRunning}
            variant="secondary"
            className="flex items-center"
          >
            {isRunning ? (
              <>
                <Spinner size="sm" variant="primary" className="mr-2" />
                Running...
              </>
            ) : (
              <>
                <PlayIcon className="w-4 h-4 mr-2" />
                Run Query
              </>
            )}
          </Button>
          <Button
            onClick={handleValidateQuery}
            disabled={!query.trim() || !queryResult || isValidating}
            variant="secondary"
            className="flex items-center"
          >
            {isValidating ? (
              <>
                <Spinner size="sm" variant="primary" className="mr-2" />
                Validating...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Validate
              </>
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="ml-auto"
          >
            Save Virtual Dataset
          </Button>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div
            className="p-4 rounded-lg"
            style={
              validationResult.success
                ? styles.statusBox('success')
                : styles.statusBox('error')
            }
          >
            <div className="flex items-start">
              {validationResult.success ? (
                <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" style={{ color: theme.colors.success }} />
              ) : (
                <XCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" style={{ color: theme.colors.error }} />
              )}
              <div>
                <p className="font-medium" style={{ color: validationResult.success ? theme.colors.success : theme.colors.error }}>
                  {validationResult.message}
                </p>
                {validationResult.error && (
                  <p className="text-sm mt-1" style={{ color: theme.colors.error }}>
                    {validationResult.error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Query Result Table */}
        {queryResult && (
          <div className="rounded-lg overflow-hidden" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary }}>
            <div className="px-4 py-3" style={{ backgroundColor: theme.colors.bgTertiary, borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: theme.colors.borderPrimary }}>
              <h4 className="font-semibold" style={{ color: theme.colors.textPrimary }}>
                Query Result Preview ({queryResult.data.length} rows)
              </h4>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: theme.colors.bgTertiary, position: 'sticky', top: 0 }}>
                  <tr>
                    {queryResult.columns.map((col) => (
                      <th
                        key={col.name}
                        className="px-4 py-2 text-left font-medium"
                        style={{ color: theme.colors.textPrimary }}
                      >
                        <div>{col.name}</div>
                        <div className="text-xs font-normal" style={{ color: theme.colors.textSecondary }}>
                          {col.type}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queryResult.data.map((row, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottomWidth: '1px',
                        borderBottomStyle: 'solid',
                        borderBottomColor: theme.colors.borderPrimary,
                      }}
                    >
                      {queryResult.columns.map((col) => (
                        <td
                          key={col.name}
                          className="px-4 py-2"
                          style={{ color: theme.colors.textSecondary }}
                        >
                          {row[col.name] !== null && row[col.name] !== undefined
                            ? String(row[col.name])
                            : <span style={{ color: theme.colors.textTertiary }}>null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
