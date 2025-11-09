import { AxiosError } from 'axios';

interface ApiError {
  message?: string;
  detail?: string;
}

export function getErrorMessage(err: unknown, defaultMessage: string): string {
  if (err instanceof AxiosError && err.response?.data) {
    const apiError = err.response.data as ApiError;
    return apiError.message || apiError.detail || defaultMessage;
  }
  
  if (err instanceof Error) {
    return err.message;
  }
  
  return defaultMessage;
}
