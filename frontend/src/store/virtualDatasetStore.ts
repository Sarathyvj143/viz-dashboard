import { create } from 'zustand';
import { virtualDatasetsApi } from '../api/virtualDatasets';
import { Dataset, VirtualDatasetCreateInput } from '../types/dataset';

interface VirtualDatasetStore {
  virtualDatasets: Dataset[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchVirtualDatasets: () => Promise<void>;
  createVirtualDataset: (data: VirtualDatasetCreateInput) => Promise<Dataset>;
  updateVirtualDataset: (id: number, data: Partial<VirtualDatasetCreateInput>) => Promise<Dataset>;
  deleteVirtualDataset: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useVirtualDatasetStore = create<VirtualDatasetStore>((set) => ({
  virtualDatasets: [],
  isLoading: false,
  error: null,

  fetchVirtualDatasets: async () => {
    set({ isLoading: true, error: null });
    try {
      const datasets = await virtualDatasetsApi.getAll();
      set({ virtualDatasets: datasets, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch virtual datasets',
        isLoading: false,
      });
    }
  },

  createVirtualDataset: async (data: VirtualDatasetCreateInput) => {
    set({ isLoading: true, error: null });
    try {
      const dataset = await virtualDatasetsApi.create(data);
      set((state) => ({
        virtualDatasets: [...state.virtualDatasets, dataset],
        isLoading: false,
      }));
      return dataset;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create virtual dataset';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  updateVirtualDataset: async (id: number, data: Partial<VirtualDatasetCreateInput>) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await virtualDatasetsApi.update(id, data);
      set((state) => ({
        virtualDatasets: state.virtualDatasets.map((ds) =>
          ds.id === id ? updated : ds
        ),
        isLoading: false,
      }));
      return updated;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update virtual dataset';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  deleteVirtualDataset: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await virtualDatasetsApi.delete(id);
      set((state) => ({
        virtualDatasets: state.virtualDatasets.filter((ds) => ds.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete virtual dataset';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  clearError: () => set({ error: null }),
}));
