/**
 * Error handling utilities for API responses
 */

import { AxiosError } from 'axios';

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  error?: string;
}

/**
 * Extract error message from various error types
 * @param err - Error object from API call
 * @param defaultMessage - Fallback message if no specific error found
 * @returns User-friendly error message
 */
export const getApiErrorMessage = (err: unknown, defaultMessage: string): string => {
  // Handle Axios errors
  if (err instanceof AxiosError) {
    const data = err.response?.data as ApiErrorResponse | undefined;
    return data?.detail || data?.message || data?.error || defaultMessage;
  }

  // Handle standard JavaScript errors
  if (err instanceof Error) {
    return err.message;
  }

  // Fallback for unknown error types
  return defaultMessage;
};
