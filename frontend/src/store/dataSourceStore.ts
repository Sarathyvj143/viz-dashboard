import { create } from 'zustand';
import { dataSourcesApi } from '../api/dataSources';
import { DataSource, DataSourceCreate, DataSourceUpdate, DiscoverResponse } from '../types/dataSource';

interface DataSourceStore {
  dataSources: DataSource[];
  isLoading: boolean;
  error: string | null;
  discoverResult: DiscoverResponse | null;

  fetchDataSources: (connectionId?: number) => Promise<void>;
  createDataSource: (data: DataSourceCreate) => Promise<DataSource>;
  updateDataSource: (id: number, data: DataSourceUpdate) => Promise<DataSource>;
  deleteDataSource: (id: number) => Promise<void>;
  discoverDataSources: (connectionId: number) => Promise<void>;
  clearDiscoverResult: () => void;
  clearError: () => void;
}

export const useDataSourceStore = create<DataSourceStore>((set) => ({
  dataSources: [],
  isLoading: false,
  error: null,
  discoverResult: null,

  fetchDataSources: async (connectionId?: number) => {
    set({ isLoading: true, error: null });
    try {
      const dataSources = await dataSourcesApi.getAll(connectionId);
      set({ dataSources, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch data sources',
        isLoading: false,
      });
    }
  },

  createDataSource: async (data: DataSourceCreate) => {
    set({ isLoading: true, error: null });
    try {
      const newDataSource = await dataSourcesApi.create(data);
      set({ isLoading: false });
      return newDataSource;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create data source',
        isLoading: false,
      });
      throw error;
    }
  },

  updateDataSource: async (id: number, data: DataSourceUpdate) => {
    set({ isLoading: true, error: null });
    try {
      const updatedDataSource = await dataSourcesApi.update(id, data);
      set({ isLoading: false });
      return updatedDataSource;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update data source',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteDataSource: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await dataSourcesApi.delete(id);
      set((state) => ({
        dataSources: state.dataSources.filter((ds) => ds.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete data source',
        isLoading: false,
      });
      throw error;
    }
  },

  discoverDataSources: async (connectionId: number) => {
    set({ isLoading: true, error: null, discoverResult: null });
    try {
      const result = await dataSourcesApi.discover(connectionId);
      set({ discoverResult: result, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to discover data sources',
        isLoading: false,
      });
    }
  },

  clearDiscoverResult: () => set({ discoverResult: null }),
  clearError: () => set({ error: null }),
}));
