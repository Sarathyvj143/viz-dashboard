export interface Dashboard {
  id: number;
  name: string;
  description?: string;
  layout: Record<string, unknown>;  // Grid layout configuration
  is_public: boolean;
  public_token?: string | null;
  public_token_expires_at?: string | null;
  public_access_count: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  chartId: string;
}

export interface DashboardCreate {
  name: string;
  description?: string;
  layout: Record<string, unknown>;
  is_public?: boolean;
}

export interface DashboardUpdate {
  name?: string;
  description?: string;
  layout?: Record<string, unknown>;
  is_public?: boolean;
}

export interface DashboardFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  customFilters?: Record<string, unknown>;
}
