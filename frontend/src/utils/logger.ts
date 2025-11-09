/**
 * Environment-aware logger utility
 * Logs to console in development, silent in production
 * Can be extended to send to error tracking services in production
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Log error messages
   * In development: logs to console
   * In production: silent (or send to error tracking service)
   */
  error: (message: string, error?: unknown) => {
    if (isDevelopment) {
      console.error(message, error);
    }
    // In production, you could send to error tracking service
    // Example: sendToSentry(message, error);
  },

  /**
   * Log warning messages
   * In development: logs to console
   * In production: silent
   */
  warn: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.warn(message, data);
    }
  },

  /**
   * Log info messages
   * In development: logs to console
   * In production: silent
   */
  info: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.info(message, data);
    }
  },

  /**
   * Log debug messages
   * In development: logs to console
   * In production: silent
   */
  debug: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.debug(message, data);
    }
  },
};
