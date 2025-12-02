/**
 * Shared type definitions for datasets and virtual datasets.
 * These types are used across DatasetSelector, VirtualDatasetModal, and VirtualTableSchemaEditor.
 */

/**
 * Column schema information for datasets
 */
export interface ColumnSchema {
  /** Column name */
  name: string;
  /** Data type (integer, float, string, boolean, timestamp, date, time, json) */
  type: string;
  /** Whether column can contain NULL values */
  nullable: boolean;
  /** Original column name before any renaming (used in schema editor) */
  originalName?: string;
}

/**
 * Dataset representation (physical or virtual)
 */
export interface Dataset {
  /** Unique identifier */
  id: number;
  /** Dataset name */
  name: string;
  /** Optional description */
  description?: string;
  /** Dataset type */
  type: 'physical' | 'virtual';
  /** Column schema information */
  columns: ColumnSchema[];
  /** Preview data (first N rows) */
  previewData?: Record<string, string | number | boolean | null>[];
  /** For virtual datasets: the SQL query */
  query?: string;
  /** For virtual datasets: the connection ID */
  connectionId?: number;
}

/**
 * Data required to create a virtual dataset
 */
export interface VirtualDatasetCreateInput {
  /** Virtual dataset name */
  name: string;
  /** Optional description */
  description: string;
  /** SQL query */
  query: string;
  /** Connection to execute query against */
  connectionId: number;
}

/**
 * Complete virtual dataset data (after execution)
 */
export interface VirtualDatasetData extends VirtualDatasetCreateInput {
  /** Extracted column schema from query result */
  columns: ColumnSchema[];
  /** Preview data from query execution */
  previewData: Record<string, string | number | boolean | null>[];
}

/**
 * Query execution result
 */
export interface QueryExecutionResult {
  /** Column schema */
  columns: ColumnSchema[];
  /** Result rows */
  data: Record<string, string | number | boolean | null>[];
  /** Number of rows returned */
  rowCount: number;
  /** Execution time in milliseconds */
  executionTime?: number;
}

/**
 * Query validation result
 */
export interface QueryValidationResult {
  /** Whether validation succeeded */
  success: boolean;
  /** Validation message */
  message: string;
  /** Error details if validation failed */
  error?: string;
  /** Detected column schema (if validation succeeded) */
  columns?: ColumnSchema[];
}
