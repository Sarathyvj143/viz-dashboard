import { useState } from 'react';
import { ChartType } from '../../../types/chart';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Dropdown from '../../common/Dropdown';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { ChartConfigurationStepProps } from '../../../types/chartWizard';

export default function ChartConfigurationStep({
  dataset,
  initialData,
  onComplete,
  onBack,
}: ChartConfigurationStepProps) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    chart_type: initialData.chart_type || ('bar' as ChartType),
    config: {
      xAxis: initialData.config?.xAxis || '',
      yAxis: initialData.config?.yAxis || '',
      colors: initialData.config?.colors || [],
      legend: initialData.config?.legend !== false,
      grid: initialData.config?.grid !== false,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Extract column names from dataset for axis selection
  const columnOptions = dataset?.columns.map((col) => ({
    value: col.name,
    label: `${col.name} (${col.type})`,
  })) || [];

  const chartTypeOptions: Array<{ value: ChartType; label: string }> = [
    { value: 'bar', label: 'Bar Chart' },
    { value: 'line', label: 'Line Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'scatter', label: 'Scatter Plot' },
    { value: 'area', label: 'Area Chart' },
  ];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate chart name
    if (!formData.name.trim()) {
      newErrors.name = 'Chart name is required';
    }

    // Validate X-axis selection
    if (!formData.config.xAxis) {
      newErrors.xAxis = 'X-axis column is required';
    }

    // Validate Y-axis selection
    if (!formData.config.yAxis) {
      newErrors.yAxis = 'Y-axis column is required';
    }

    // Validate that X-axis and Y-axis are different
    if (formData.config.xAxis && formData.config.yAxis &&
        formData.config.xAxis === formData.config.yAxis) {
      newErrors.yAxis = 'Y-axis must be different from X-axis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onComplete(formData);
    }
  };

  const containerStyles = {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  };

  const navigationStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '1rem',
  };

  const iconStyles = {
    width: '1rem',
    height: '1rem',
  };

  return (
    <div style={containerStyles}>
      {/* Chart Name */}
      <div>
        <Input
          label="Chart Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter chart name"
          required
          error={errors.name}
        />
      </div>

      {/* Description */}
      <div>
        <Input
          label="Description (Optional)"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter chart description"
        />
      </div>

      {/* Chart Type */}
      <div>
        <Dropdown<ChartType>
          label="Chart Type"
          value={formData.chart_type}
          onChange={(value) =>
            value && setFormData({ ...formData, chart_type: value })
          }
          options={chartTypeOptions}
        />
      </div>

      {/* X-Axis */}
      <div>
        <Dropdown<string>
          label="X-Axis Column"
          value={formData.config.xAxis}
          onChange={(value) =>
            setFormData({
              ...formData,
              config: { ...formData.config, xAxis: value || '' },
            })
          }
          options={columnOptions}
          error={errors.xAxis}
        />
      </div>

      {/* Y-Axis */}
      <div>
        <Dropdown<string>
          label="Y-Axis Column"
          value={formData.config.yAxis}
          onChange={(value) =>
            setFormData({
              ...formData,
              config: { ...formData.config, yAxis: value || '' },
            })
          }
          options={columnOptions}
          error={errors.yAxis}
        />
      </div>

      {/* Navigation Buttons */}
      <div style={navigationStyles}>
        <Button onClick={onBack} variant="secondary">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeftIcon style={iconStyles} />
            Back to Dataset
          </div>
        </Button>
        <Button
          onClick={handleNext}
          disabled={!formData.name.trim() || !formData.config.xAxis || !formData.config.yAxis}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Preview Chart
            <ArrowRightIcon style={iconStyles} />
          </div>
        </Button>
      </div>
    </div>
  );
}
