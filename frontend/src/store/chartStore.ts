import { create } from 'zustand';
import { Chart } from '../types/chart';
import { chartsApi } from '../api/charts';

interface ChartStore {
  charts: Chart[];
  currentChart: Chart | null;
  isLoading: boolean;
  error: string | null;
  fetchCharts: () => Promise<void>;
  fetchChart: (id: string) => Promise<void>;
  createChart: (data: Partial<Chart>) => Promise<Chart>;
  updateChart: (id: string, data: Partial<Chart>) => Promise<void>;
  deleteChart: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useChartStore = create<ChartStore>((set) => ({
  charts: [],
  currentChart: null,
  isLoading: false,
  error: null,

  fetchCharts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await chartsApi.getAll();
      set({ charts: response.items, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch charts',
        isLoading: false,
      });
    }
  },

  fetchChart: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const chart = await chartsApi.getById(id);
      set({ currentChart: chart, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch chart',
        isLoading: false,
      });
    }
  },

  createChart: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const chart = await chartsApi.create(data);
      set((state) => ({
        charts: [...state.charts, chart],
        isLoading: false,
      }));
      return chart;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create chart',
        isLoading: false,
      });
      throw error;
    }
  },

  updateChart: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const chart = await chartsApi.update(id, data);
      set((state) => ({
        charts: state.charts.map((c) => (c.id === id ? chart : c)),
        currentChart: state.currentChart?.id === id ? chart : state.currentChart,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update chart',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteChart: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await chartsApi.delete(id);
      set((state) => ({
        charts: state.charts.filter((c) => c.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete chart',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
