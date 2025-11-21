/**
 * Environment Configuration
 * Centralized access to environment variables
 */

export const env = {
  /**
   * API Base URL
   */
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',

  /**
   * Development mode default workspace ID
   * Only used in development - in production users must register and create workspace
   */
  devDefaultWorkspaceId: import.meta.env.VITE_DEV_DEFAULT_WORKSPACE_ID
    ? parseInt(import.meta.env.VITE_DEV_DEFAULT_WORKSPACE_ID)
    : undefined,

  /**
   * Check if running in development mode
   */
  isDevelopment: import.meta.env.DEV,

  /**
   * Check if running in production mode
   */
  isProduction: import.meta.env.PROD,
} as const;

/**
 * Get the current workspace ID
 * In development: uses default workspace from env
 * In production: requires user to have a workspace (from user context)
 */
export function getCurrentWorkspaceId(userWorkspaceId?: number | null): number | undefined {
  // In production, workspace must come from user
  if (env.isProduction) {
    return userWorkspaceId ?? undefined;
  }

  // In development, use default workspace if configured
  if (env.isDevelopment && env.devDefaultWorkspaceId) {
    return userWorkspaceId ?? env.devDefaultWorkspaceId;
  }

  return userWorkspaceId ?? undefined;
}
