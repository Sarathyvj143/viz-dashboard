/**
 * UI configuration constants
 */

export const UI_CONFIG = {
  /** Duration for success/info messages before auto-dismiss (milliseconds) */
  MESSAGE_DURATION_MS: 5000,

  /** Debounce delay for search inputs (milliseconds) */
  SEARCH_DEBOUNCE_MS: 300,

  /** Default page size for paginated lists */
  DEFAULT_PAGE_SIZE: 20,

  /** Maximum page size for paginated lists */
  MAX_PAGE_SIZE: 100,
} as const;
