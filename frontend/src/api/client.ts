import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiError } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  public client: AxiosInstance;
  private onUnauthorized?: () => void;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          // Use callback instead of direct window.location redirect
          if (this.onUnauthorized) {
            this.onUnauthorized();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  setUnauthorizedHandler(handler: () => void) {
    this.onUnauthorized = handler;
  }
}

export const apiClient = new ApiClient();
export default apiClient.client;
