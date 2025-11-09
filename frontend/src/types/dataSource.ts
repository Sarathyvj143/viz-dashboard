export type SourceType = 'database' | 'folder';

export interface DataSource {
  id: number;
  connection_id: number;
  name: string;
  source_type: SourceType;
  source_identifier: string;
  is_active: boolean;
  workspace_id: number;
  created_at: string;
  created_by: number;
}

export interface DataSourceCreate {
  connection_id: number;
  name: string;
  source_type: SourceType;
  source_identifier: string;
}

export interface DataSourceUpdate {
  name?: string;
  source_identifier?: string;
  is_active?: boolean;
}

export interface DiscoveredItem {
  identifier: string;
  name: string;
}

export interface DiscoverResponse {
  success: boolean;
  source_type?: SourceType;
  items?: DiscoveredItem[];
  message?: string;
  error?: string;
}
