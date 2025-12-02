import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChartStore } from '../../store/chartStore';
import { useToastStore } from '../../store/toastStore';
import { useTheme } from '../../contexts/ThemeContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { getDefaultChartColors } from '../../constants/themes';

// Import types from chartWizard
import {
  WizardStep,
  ChartFormData,
  datasetIdToString,
} from '../../types/chartWizard';

// Step components
import DatasetSelectionStep from './wizard/DatasetSelectionStep';
import ChartConfigurationStep from './wizard/ChartConfigurationStep';
import ChartPreviewStep from './wizard/ChartPreviewStep';

// Icons
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

export default function ChartBuilderWizard() {
  const navigate = useNavigate();
  const styles = useThemedStyles();
  const { theme, currentTheme, customColors } = useTheme();
  const { createChart, isLoading } = useChartStore();
  const { showToast } = useToastStore();

  const [currentStep, setCurrentStep] = useState<WizardStep>('dataset');
  const [formData, setFormData] = useState<ChartFormData>({
    name: '',
    description: '',
    chart_type: 'bar',
    dataset: null,
    config: {
      xAxis: '',
      yAxis: '',
      colors: getDefaultChartColors(currentTheme, customColors),
      legend: true,
      grid: true,
    },
  });

  const steps: Array<{ key: WizardStep; label: string; description: string }> = [
    { key: 'dataset', label: 'Select Dataset', description: 'Choose or create a dataset' },
    { key: 'configuration', label: 'Configure Chart', description: 'Set chart type and options' },
    { key: 'preview', label: 'Preview & Save', description: 'Review and save your chart' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const handleDatasetSelect = (dataset: import('../../types/dataset').Dataset) => {
    setFormData((prev) => ({ ...prev, dataset }));
    setCurrentStep('configuration');
  };

  const handleConfigurationComplete = (config: Partial<ChartFormData>) => {
    setFormData((prev) => ({ ...prev, ...config }));
    setCurrentStep('preview');
  };

  const handleSaveChart = async () => {
    if (!formData.dataset) {
      showToast('Please select a dataset', 'error');
      return;
    }

    if (!formData.name.trim()) {
      showToast('Please enter a chart name', 'error');
      return;
    }

    try {
      // Build query from dataset
      const query = formData.dataset.query || `SELECT * FROM ${formData.dataset.name}`;

      // CRITICAL FIX: Use datasetIdToString helper to convert number to string
      await createChart({
        name: formData.name,
        description: formData.description,
        type: formData.chart_type,
        dataSourceId: datasetIdToString(formData.dataset.id),
        query,
        config: formData.config,
      });

      showToast('Chart created successfully!', 'success');
      navigate('/charts');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to create chart',
        'error'
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = step.key === currentStep;
            const isCompleted = index < currentStepIndex;

            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  {/* Step Circle */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isCompleted
                        ? 'bg-green-500 border-green-500'
                        : isActive
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}
                    style={{
                      backgroundColor: isCompleted || isActive ? theme.colors.accentPrimary : 'transparent',
                      borderColor: isCompleted || isActive ? theme.colors.accentPrimary : theme.colors.borderPrimary,
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircleIcon className="w-6 h-6 text-white" />
                    ) : (
                      <span
                        className="text-sm font-semibold"
                        style={{ color: isActive ? '#fff' : theme.colors.textSecondary }}
                      >
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="mt-2 text-center">
                    <p
                      className="text-sm font-medium"
                      style={{ color: isActive ? theme.colors.textPrimary : theme.colors.textSecondary }}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs" style={{ color: theme.colors.textTertiary }}>
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <ChevronRightIcon
                    className="w-5 h-5 mx-4"
                    style={{ color: theme.colors.textTertiary }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-xl shadow-lg" style={styles.card}>
        {currentStep === 'dataset' && (
          <DatasetSelectionStep onDatasetSelect={handleDatasetSelect} />
        )}

        {currentStep === 'configuration' && (
          <ChartConfigurationStep
            dataset={formData.dataset}
            initialData={formData}
            onComplete={handleConfigurationComplete}
            onBack={() => setCurrentStep('dataset')}
          />
        )}

        {currentStep === 'preview' && (
          <ChartPreviewStep
            formData={formData}
            onSave={handleSaveChart}
            onBack={() => setCurrentStep('configuration')}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
