/**
 * Type definitions for Chart Builder Wizard
 *
 * IMPORTANT: These types resolve ambiguities and type mismatches in the original spec.
 * All wizard-related components should import from this file.
 */

import { ChartType, ChartConfig } from './chart';
import { Dataset } from './dataset';

/**
 * Wizard step identifier
 */
export type WizardStep = 'dataset' | 'configuration' | 'preview';

/**
 * Step status for progress tracking
 */
export type StepStatus = 'pending' | 'active' | 'completed';

/**
 * Chart form data maintained through wizard steps
 *
 * NOTE: Uses ChartConfig interface directly instead of inline definition
 * to ensure consistency with Chart type.
 */
export interface ChartFormData {
  name: string;
  description: string;
  chart_type: ChartType;
  dataset: Dataset | null;
  config: ChartConfig;
}

/**
 * Step metadata for wizard UI
 */
export interface WizardStepMeta {
  key: WizardStep;
  label: string;
  description: string;
  status: StepStatus;
}

/**
 * Payload for chart creation API
 * Transforms ChartFormData into API-compatible format
 *
 * NOTE: Uses string for data_source_id to match Chart interface.
 * Dataset.id (number) must be converted to string.
 */
export interface ChartCreatePayload {
  name: string;
  description?: string;
  chart_type: ChartType;
  data_source_id: string; // Converted from Dataset.id (number)
  query: string;
  config: ChartConfig;
}

/**
 * Props for DatasetSelectionStep component
 */
export interface DatasetSelectionStepProps {
  onDatasetSelect: (dataset: Dataset) => void;
}

/**
 * Props for ChartConfigurationStep component
 *
 * NOTE: Uses ChartFormData instead of 'any' type
 */
export interface ChartConfigurationStepProps {
  dataset: Dataset | null;
  initialData: ChartFormData;
  onComplete: (config: Partial<ChartFormData>) => void;
  onBack: () => void;
}

/**
 * Props for ChartPreviewStep component
 *
 * NOTE: Uses ChartFormData instead of 'any' type
 */
export interface ChartPreviewStepProps {
  formData: ChartFormData;
  onSave: () => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

/**
 * Helper function to convert Dataset ID to Chart data source ID
 *
 * CRITICAL: This resolves the type mismatch between Dataset.id (number)
 * and Chart.dataSourceId (string).
 */
export function datasetIdToString(datasetId: number): string {
  return String(datasetId);
}
