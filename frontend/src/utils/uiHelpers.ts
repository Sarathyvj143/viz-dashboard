/**
 * Shared UI helper functions for consistent formatting across components
 */

import { Theme } from '../types/theme';
import { withOpacity } from './colorHelpers';

/**
 * Get themed border style for consistent borders across components
 */
export function getThemedBorderStyle(theme: Theme, variant: 'primary' | 'secondary' = 'primary'): React.CSSProperties {
  return {
    borderColor: variant === 'primary' ? theme.colors.borderPrimary : theme.colors.borderSecondary,
    borderWidth: '1px',
    borderStyle: 'solid',
  };
}

/**
 * Get themed card style for consistent card styling
 */
export function getThemedCardStyle(theme: Theme): React.CSSProperties {
  return {
    backgroundColor: theme.colors.bgSecondary,
    ...getThemedBorderStyle(theme, 'primary'),
  };
}

/**
 * Format a date string for display with time
 * @param dateString - ISO date string or null
 * @returns Formatted date string or 'Never'
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString();
};

/**
 * Format a date string for display without time
 * @param dateString - ISO date string
 * @returns Formatted date string (date only)
 */
export const formatDateOnly = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

/**
 * Get badge color classes for user/workspace role (DEPRECATED)
 * @deprecated Use getRoleBadgeStyles with theme for theme-aware styling
 * @param role - User role (admin, editor, viewer)
 * @returns Tailwind CSS classes for badge styling
 */
export const getRoleBadgeColor = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800';
    case 'editor':
      return 'bg-blue-100 text-blue-800';
    case 'viewer':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get badge styles for user/workspace role (theme-aware)
 * @param role - User role (admin, editor, viewer)
 * @param theme - Theme object with colors
 * @returns Style object with theme colors
 */
export const getRoleBadgeStyles = (role: string, theme: { colors: { accentSecondary?: string; info: string; textSecondary: string } }): React.CSSProperties => {
  switch (role) {
    case 'admin':
      const adminColor = theme.colors.accentSecondary || '#9333ea';
      return {
        backgroundColor: withOpacity(adminColor, 15),
        color: adminColor,
      };
    case 'editor':
      return {
        backgroundColor: withOpacity(theme.colors.info, 15),
        color: theme.colors.info,
      };
    case 'viewer':
      return {
        backgroundColor: withOpacity(theme.colors.textSecondary, 15),
        color: theme.colors.textSecondary,
      };
    default:
      return {
        backgroundColor: withOpacity(theme.colors.textSecondary, 15),
        color: theme.colors.textSecondary,
      };
  }
};

/**
 * Get badge color classes for connection permission level (DEPRECATED)
 * @deprecated Use getPermissionBadgeStyles with theme for theme-aware styling
 * @param level - Permission level (owner, editor, viewer)
 * @returns Tailwind CSS classes for badge styling
 */
export const getPermissionBadgeColor = (level: string): string => {
  switch (level) {
    case 'owner':
      return 'bg-purple-100 text-purple-800';
    case 'editor':
      return 'bg-blue-100 text-blue-800';
    case 'viewer':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get badge styles for permission level (theme-aware)
 * @param level - Permission level (owner, editor, viewer)
 * @param theme - Theme object with colors
 * @returns Style object with theme colors
 */
export const getPermissionBadgeStyles = (level: string, theme: { colors: { accentSecondary?: string; info: string; textSecondary: string } }): React.CSSProperties => {
  switch (level) {
    case 'owner':
      const ownerColor = theme.colors.accentSecondary || '#9333ea';
      return {
        backgroundColor: withOpacity(ownerColor, 15),
        color: ownerColor,
      };
    case 'editor':
      return {
        backgroundColor: withOpacity(theme.colors.info, 15),
        color: theme.colors.info,
      };
    case 'viewer':
      return {
        backgroundColor: withOpacity(theme.colors.textSecondary, 15),
        color: theme.colors.textSecondary,
      };
    default:
      return {
        backgroundColor: withOpacity(theme.colors.textSecondary, 15),
        color: theme.colors.textSecondary,
      };
  }
};
