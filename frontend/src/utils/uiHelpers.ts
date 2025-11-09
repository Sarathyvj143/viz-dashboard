/**
 * Shared UI helper functions for consistent formatting across components
 */

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
 * Get badge color classes for user/workspace role
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
 * Get badge color classes for connection permission level
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
