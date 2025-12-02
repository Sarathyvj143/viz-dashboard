import apiClient from './client';
import {
  Dataset,
  VirtualDatasetCreateInput,
  QueryExecutionResult,
  QueryValidationResult,
} from '../types/dataset';

// Simple toggle for development - set to false when backend is ready
const USE_MOCK = import.meta.env.VITE_MOCK_VIRTUAL_DATASETS === 'true';

/**
 * Helper function to add realistic delay to mock responses
 */
const mockDelay = (ms: number = 500) =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Virtual Datasets API
 * Handles SQL-based virtual dataset creation, validation, and management
 */
export const virtualDatasetsApi = {
  /**
   * Execute SQL query against a connection (returns preview)
   */
  async executeQuery(
    connectionId: number,
    query: string
  ): Promise<QueryExecutionResult> {
    if (USE_MOCK) {
      await mockDelay(1000);

      return {
        columns: [
          { name: 'id', type: 'integer', nullable: false },
          { name: 'name', type: 'string', nullable: true },
          { name: 'value', type: 'float', nullable: true },
          { name: 'created_at', type: 'timestamp', nullable: false },
        ],
        data: [
          { id: 1, name: 'Sample A', value: 100.5, created_at: '2025-01-15T10:00:00Z' },
          { id: 2, name: 'Sample B', value: 200.3, created_at: '2025-01-16T11:00:00Z' },
          { id: 3, name: 'Sample C', value: 150.7, created_at: '2025-01-17T12:00:00Z' },
          { id: 4, name: 'Sample D', value: 175.2, created_at: '2025-01-18T13:00:00Z' },
          { id: 5, name: 'Sample E', value: 225.9, created_at: '2025-01-19T14:00:00Z' },
        ],
        rowCount: 5,
        executionTime: 45,
      };
    }

    const response = await apiClient.post('/virtual-datasets/execute', {
      connectionId,
      query,
    });
    return response.data;
  },

  /**
   * Validate SQL query syntax
   */
  async validateQuery(
    connectionId: number,
    query: string
  ): Promise<QueryValidationResult> {
    if (USE_MOCK) {
      await mockDelay(500);

      // Simulate validation error for queries without SELECT
      if (!query.toUpperCase().includes('SELECT')) {
        return {
          success: false,
          message: 'Query must contain SELECT statement',
          error: 'Invalid SQL syntax: Expected SELECT statement',
        };
      }

      // Simulate validation error for empty queries
      if (!query.trim()) {
        return {
          success: false,
          message: 'Query cannot be empty',
          error: 'Empty query provided',
        };
      }

      return {
        success: true,
        message: 'Query is valid',
        columns: [
          { name: 'id', type: 'integer', nullable: false },
          { name: 'name', type: 'string', nullable: true },
          { name: 'value', type: 'float', nullable: true },
          { name: 'created_at', type: 'timestamp', nullable: false },
        ],
      };
    }

    const response = await apiClient.post('/virtual-datasets/validate', {
      connectionId,
      query,
    });
    return response.data;
  },

  /**
   * Create virtual dataset
   */
  async create(data: VirtualDatasetCreateInput): Promise<Dataset> {
    if (USE_MOCK) {
      await mockDelay(1000);

      return {
        id: Math.floor(Math.random() * 10000),
        name: data.name,
        description: data.description,
        type: 'virtual',
        query: data.query,
        connectionId: data.connectionId,
        columns: [
          { name: 'id', type: 'integer', nullable: false },
          { name: 'name', type: 'string', nullable: true },
          { name: 'value', type: 'float', nullable: true },
          { name: 'created_at', type: 'timestamp', nullable: false },
        ],
        previewData: [
          { id: 1, name: 'Sample A', value: 100.5, created_at: '2025-01-15T10:00:00Z' },
          { id: 2, name: 'Sample B', value: 200.3, created_at: '2025-01-16T11:00:00Z' },
          { id: 3, name: 'Sample C', value: 150.7, created_at: '2025-01-17T12:00:00Z' },
        ],
      };
    }

    const response = await apiClient.post('/virtual-datasets', data);
    return response.data;
  },

  /**
   * Get all virtual datasets for current workspace
   */
  async getAll(): Promise<Dataset[]> {
    if (USE_MOCK) {
      await mockDelay(500);

      return [
        {
          id: 1,
          name: 'Sales Summary',
          description: 'Aggregated sales data',
          type: 'virtual',
          query: 'SELECT * FROM sales',
          connectionId: 1,
          columns: [
            { name: 'id', type: 'integer', nullable: false },
            { name: 'total', type: 'float', nullable: true },
          ],
          previewData: [
            { id: 1, total: 1000.50 },
          ],
        },
        {
          id: 2,
          name: 'Customer Analytics',
          description: 'Customer behavior metrics',
          type: 'virtual',
          query: 'SELECT * FROM customers',
          connectionId: 1,
          columns: [
            { name: 'customer_id', type: 'integer', nullable: false },
            { name: 'lifetime_value', type: 'float', nullable: true },
          ],
          previewData: [
            { customer_id: 100, lifetime_value: 5000.00 },
          ],
        },
      ];
    }

    const response = await apiClient.get('/virtual-datasets');
    return response.data;
  },

  /**
   * Get virtual dataset by ID
   */
  async getById(id: number): Promise<Dataset> {
    if (USE_MOCK) {
      await mockDelay(500);

      return {
        id,
        name: `Virtual Dataset ${id}`,
        description: 'Sample virtual dataset',
        type: 'virtual',
        query: 'SELECT * FROM mock_table WHERE id = ' + id,
        connectionId: 1,
        columns: [
          { name: 'id', type: 'integer', nullable: false },
          { name: 'name', type: 'string', nullable: true },
          { name: 'value', type: 'float', nullable: true },
        ],
        previewData: [
          { id: 1, name: 'Mock Data', value: 123.45 },
          { id: 2, name: 'Test Row', value: 678.90 },
        ],
      };
    }

    const response = await apiClient.get(`/virtual-datasets/${id}`);
    return response.data;
  },

  /**
   * Update virtual dataset
   */
  async update(
    id: number,
    data: Partial<VirtualDatasetCreateInput>
  ): Promise<Dataset> {
    if (USE_MOCK) {
      await mockDelay(1000);

      return {
        id,
        name: data.name || `Virtual Dataset ${id}`,
        description: data.description,
        type: 'virtual',
        query: data.query || 'SELECT * FROM mock_table',
        connectionId: data.connectionId || 1,
        columns: [
          { name: 'id', type: 'integer', nullable: false },
          { name: 'name', type: 'string', nullable: true },
        ],
        previewData: [
          { id: 1, name: 'Updated Data' },
        ],
      };
    }

    const response = await apiClient.put(`/virtual-datasets/${id}`, data);
    return response.data;
  },

  /**
   * Delete virtual dataset
   */
  async delete(id: number): Promise<void> {
    if (USE_MOCK) {
      await mockDelay(500);
      return;
    }

    await apiClient.delete(`/virtual-datasets/${id}`);
  },
};
