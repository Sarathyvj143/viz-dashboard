export interface Connection {
  id: number;
  name: string;
  type: ConnectionType;
  config: ConnectionConfig;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export type ConnectionType = 'mysql' | 'postgresql' | 's3' | 'azure_blob' | 'gcs';

export interface ConnectionConfig {
  // Common fields
  host?: string;
  port?: number;
  database?: string;

  // Authentication
  user?: string;
  password?: string;

  // SSL/TLS
  ssl?: boolean;
  sslCert?: string;

  // Connection pooling
  poolSize?: number;
  maxOverflow?: number;

  // Cloud storage specific (S3)
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;

  // Cloud storage specific (Azure)
  containerName?: string;
  connectionString?: string;

  // Cloud storage specific (GCS)
  projectId?: string;
  keyFile?: string;
}

export interface ConnectionCreate {
  name: string;
  type: ConnectionType;
  config: ConnectionConfig;
}

export interface ConnectionUpdate {
  name?: string;
  config?: ConnectionConfig;
  is_active?: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}
