// React imports
import { useState, useEffect } from 'react';

// Store & Context imports
import { useDataSourceStore } from '../../../store/dataSourceStore';
import { useTheme } from '../../../contexts/ThemeContext';
import { useToastStore } from '../../../store/toastStore';

// Type imports
import { Dataset } from '../../../types/dataset';

// Component imports
import Button from '../../common/Button';
import Spinner from '../../common/Spinner';

// Icon imports
import { PlusIcon, TableCellsIcon } from '@heroicons/react/24/outline';

interface DatasetSelectorProps {
  onDatasetSelect: (dataset: Dataset) => void;
  onCreateVirtual: () => void;
}

export default function DatasetSelector({ onDatasetSelect, onCreateVirtual }: DatasetSelectorProps) {
  const { theme } = useTheme();
  const { dataSources, fetchDataSources } = useDataSourceStore();
  const { showToast } = useToastStore();

  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetchDataSources();
  }, [fetchDataSources]);

  const handleDatasetChange = async (datasetId: string) => {
    const numericId = parseInt(datasetId, 10);

    if (isNaN(numericId)) {
      showToast('Invalid dataset ID', 'error');
      return;
    }

    setPreviewLoading(true);
    setSelectedDataset(null);

    try {
      // TODO: Replace with actual API call when backend is ready
      // const dataset = await datasetApi.getById(numericId);

      // For now, show helpful error message
      showToast(
        'Dataset preview is not yet implemented. This feature requires backend support.',
        'info'
      );

      // Create a minimal dataset object to show structure
      const placeholderDataset: Dataset = {
        id: numericId,
        name: dataSources.find(ds => ds.id === numericId)?.name || 'Unknown',
        type: 'physical',
        columns: [],
        previewData: [],
      };

      setSelectedDataset(placeholderDataset);
    } catch (error) {
      showToast('Failed to load dataset preview', 'error');
      console.error('Dataset load error:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleUseDataset = () => {
    if (selectedDataset) {
      onDatasetSelect(selectedDataset);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: theme.colors.bgSecondary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary }}>
        <div className="px-6 py-4" style={{ borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: theme.colors.borderPrimary }}>
          <h3 className="text-lg font-semibold flex items-center" style={{ color: theme.colors.textPrimary }}>
            <TableCellsIcon className="w-6 h-6 mr-2" style={{ color: theme.colors.accentPrimary }} />
            Dataset Source
          </h3>
          <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
            Select an existing dataset or create a new virtual dataset
          </p>
        </div>

        <div className="px-6 py-4">
          {/* Dataset Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
                Choose Dataset Type
              </label>
              <select
                className="w-full px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: theme.colors.bgPrimary,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: theme.colors.borderPrimary,
                  color: theme.colors.textPrimary,
                }}
                onChange={(e) => handleDatasetChange(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Select a dataset...</option>
                <optgroup label="Physical Datasets">
                  {dataSources.map((ds) => (
                    <option key={`physical-${ds.id}`} value={ds.id}>
                      {ds.name} ({ds.source_type})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Virtual Datasets">
                  {/* TODO: Add virtual datasets from API */}
                  <option value="virtual-1">Virtual Dataset 1</option>
                </optgroup>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleUseDataset}
                disabled={!selectedDataset}
                className="flex-1"
              >
                Use This Dataset
              </Button>
              <Button
                onClick={onCreateVirtual}
                variant="secondary"
                className="flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Virtual Dataset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {previewLoading && (
        <div className="text-center py-8">
          <Spinner size="lg" variant="accent" />
          <p className="mt-2 text-sm" style={{ color: theme.colors.textSecondary }}>
            Loading dataset preview...
          </p>
        </div>
      )}

      {/* Dataset Description & Preview */}
      {selectedDataset && !previewLoading && (
        <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: theme.colors.bgSecondary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary }}>
          <div className="px-6 py-4" style={{ borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: theme.colors.borderPrimary }}>
            <h4 className="font-semibold" style={{ color: theme.colors.textPrimary }}>
              {selectedDataset.name}
            </h4>
            {selectedDataset.description && (
              <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                {selectedDataset.description}
              </p>
            )}
          </div>

          {/* Not Implemented Notice */}
          {selectedDataset.columns.length === 0 && (
            <div className="mx-6 my-4 p-4 rounded-lg" style={{ backgroundColor: theme.colors.bgTertiary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary }}>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                ℹ️ Dataset preview is not yet implemented. This component will show column information and sample data once the backend API is ready.
              </p>
            </div>
          )}

          {/* Columns Information */}
          {selectedDataset.columns.length > 0 && (
            <div className="px-6 py-4" style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: theme.colors.borderPrimary }}>
              <h5 className="text-sm font-semibold mb-3" style={{ color: theme.colors.textPrimary }}>
                Columns ({selectedDataset.columns.length})
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {selectedDataset.columns.map((col) => (
                  <div
                    key={col.name}
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: theme.colors.bgTertiary,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: theme.colors.borderPrimary,
                    }}
                  >
                    <div className="font-medium" style={{ color: theme.colors.textPrimary }}>
                      {col.name}
                    </div>
                    <div className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
                      {col.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Data */}
          {selectedDataset.previewData && selectedDataset.previewData.length > 0 && (
            <div className="px-6 py-4" style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: theme.colors.borderPrimary }}>
              <h5 className="text-sm font-semibold mb-3" style={{ color: theme.colors.textPrimary }}>
                Preview Rows (First 3)
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: theme.colors.bgTertiary }}>
                      {selectedDataset.columns.map((col) => (
                        <th
                          key={col.name}
                          className="px-4 py-2 text-left font-medium"
                          style={{ color: theme.colors.textPrimary }}
                        >
                          {col.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDataset.previewData.map((row, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottomWidth: '1px',
                          borderBottomStyle: 'solid',
                          borderBottomColor: theme.colors.borderPrimary,
                        }}
                      >
                        {selectedDataset.columns.map((col) => (
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
      )}
    </div>
  );
}
