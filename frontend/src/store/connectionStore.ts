import { create } from 'zustand';
import { Connection, ConnectionCreate, ConnectionUpdate } from '../types/connection';
import { connectionsApi } from '../api/connections';

interface ConnectionStore {
  connections: Connection[];
  currentConnection: Connection | null;
  isLoading: boolean;
  error: string | null;
  testResult: { success: boolean; message: string } | null;
  fetchConnections: () => Promise<void>;
  fetchConnection: (id: number) => Promise<void>;
  createConnection: (data: ConnectionCreate) => Promise<Connection>;
  updateConnection: (id: number, data: ConnectionUpdate) => Promise<void>;
  deleteConnection: (id: number) => Promise<void>;
  testConnection: (id: number) => Promise<void>;
  clearError: () => void;
  clearTestResult: () => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  connections: [],
  currentConnection: null,
  isLoading: false,
  error: null,
  testResult: null,

  fetchConnections: async () => {
    set({ isLoading: true, error: null });
    try {
      const connections = await connectionsApi.getAll();
      set({ connections, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch connections',
        isLoading: false,
      });
    }
  },

  fetchConnection: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const connection = await connectionsApi.getById(id);
      set({ currentConnection: connection, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch connection',
        isLoading: false,
      });
    }
  },

  createConnection: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const connection = await connectionsApi.create(data);
      set((state) => ({
        connections: [...state.connections, connection],
        isLoading: false,
      }));
      return connection;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create connection',
        isLoading: false,
      });
      throw error;
    }
  },

  updateConnection: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const connection = await connectionsApi.update(id, data);
      set((state) => ({
        connections: state.connections.map((c) => (c.id === id ? connection : c)),
        currentConnection: state.currentConnection?.id === id ? connection : state.currentConnection,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update connection',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteConnection: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await connectionsApi.delete(id);
      set((state) => ({
        connections: state.connections.filter((c) => c.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete connection',
        isLoading: false,
      });
      throw error;
    }
  },

  testConnection: async (id) => {
    set({ isLoading: true, error: null, testResult: null });
    try {
      const result = await connectionsApi.test(id);
      set({ testResult: result, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to test connection',
        testResult: { success: false, message: 'Connection test failed' },
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
  clearTestResult: () => set({ testResult: null }),
}));
