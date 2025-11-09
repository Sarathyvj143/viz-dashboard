import { create } from 'zustand';
import { Dashboard } from '../types/dashboard';
import { dashboardsApi } from '../api/dashboards';

interface DashboardStore {
  dashboards: Dashboard[];
  currentDashboard: Dashboard | null;
  isLoading: boolean;
  error: string | null;
  fetchDashboards: () => Promise<void>;
  fetchDashboard: (id: number) => Promise<void>;
  createDashboard: (data: Partial<Dashboard>) => Promise<Dashboard>;
  updateDashboard: (id: number, data: Partial<Dashboard>) => Promise<void>;
  deleteDashboard: (id: number) => Promise<void>;
  fetchPublicDashboard: (shareToken: string) => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  dashboards: [],
  currentDashboard: null,
  isLoading: false,
  error: null,

  fetchDashboards: async () => {
    set({ isLoading: true, error: null });
    try {
      const dashboards = await dashboardsApi.getAll();
      set({ dashboards, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch dashboards',
        isLoading: false,
      });
    }
  },

  fetchDashboard: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const dashboard = await dashboardsApi.getById(id);
      set({ currentDashboard: dashboard, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard',
        isLoading: false,
      });
    }
  },

  createDashboard: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const dashboard = await dashboardsApi.create(data);
      set((state) => ({
        dashboards: [...state.dashboards, dashboard],
        isLoading: false,
      }));
      return dashboard;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create dashboard',
        isLoading: false,
      });
      throw error;
    }
  },

  updateDashboard: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const dashboard = await dashboardsApi.update(id, data);
      set((state) => ({
        dashboards: state.dashboards.map((d) => (d.id === id ? dashboard : d)),
        currentDashboard: state.currentDashboard?.id === id ? dashboard : state.currentDashboard,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update dashboard',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteDashboard: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await dashboardsApi.delete(id);
      set((state) => ({
        dashboards: state.dashboards.filter((d) => d.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete dashboard',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchPublicDashboard: async (shareToken) => {
    set({ isLoading: true, error: null });
    try {
      const dashboard = await dashboardsApi.getPublic(shareToken);
      set({ currentDashboard: dashboard, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch public dashboard',
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
