export interface Chart {
  id: string;
  name: string;
  description?: string;
  type: ChartType;
  config: ChartConfig;
  dataSourceId: string;
  query: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter';

export interface ChartConfig {
  xAxis?: string;
  yAxis?: string;
  colors?: string[];
  legend?: boolean;
  grid?: boolean;
  [key: string]: unknown;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
}
