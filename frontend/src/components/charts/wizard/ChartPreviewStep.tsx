import { useTheme } from '../../../contexts/ThemeContext';
import Button from '../../common/Button';
import Spinner from '../../common/Spinner';
import ChartRenderer from '../ChartRenderer';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { ChartPreviewStepProps } from '../../../types/chartWizard';

export default function ChartPreviewStep({
  formData,
  onSave,
  onBack,
  isLoading,
}: ChartPreviewStepProps) {
  const { theme } = useTheme();

  return (
    <div className="p-6 space-y-6">
      {/* Chart Info */}
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
          {formData.name}
        </h2>
        {formData.description && (
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
            {formData.description}
          </p>
        )}
      </div>

      {/* Dataset Info */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: theme.colors.bgSecondary }}>
        <p className="text-sm font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
          Dataset: {formData.dataset?.name}
        </p>
        <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
          Type: {formData.dataset?.type === 'virtual' ? 'Virtual Dataset' : 'Physical Dataset'}
        </p>
      </div>

      {/* Chart Preview */}
      <div className="border rounded-lg p-4" style={{ borderColor: theme.colors.borderPrimary }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.textPrimary }}>
          Chart Preview
        </h3>
        {formData.dataset?.previewData && formData.dataset.previewData.length > 0 ? (
          <ChartRenderer
            type={formData.chart_type}
            data={formData.dataset.previewData}
            config={formData.config}
          />
        ) : (
          <div className="text-center py-12" style={{ color: theme.colors.textTertiary }}>
            <p>No preview data available</p>
            <p className="text-xs mt-2">Chart will be created with your configuration</p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button onClick={onBack} variant="secondary" disabled={isLoading}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Configuration
        </Button>
        <Button onClick={onSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner size="sm" variant="white" className="mr-2" />
              Creating Chart...
            </>
          ) : (
            <>
              <CheckIcon className="w-4 h-4 mr-2" />
              Save Chart
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
