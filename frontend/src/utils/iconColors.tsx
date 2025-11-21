import React from 'react';
import { Theme } from '../types/theme';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Icon color variants that map to theme colors
 */
export type IconVariant =
  | 'primary'     // Main text color (textPrimary)
  | 'secondary'   // Muted text color (textSecondary) - Default
  | 'tertiary'    // Even more muted (textTertiary)
  | 'accent'      // Brand/highlight color (accentPrimary)
  | 'success'     // Green/positive actions (success)
  | 'error'       // Red/negative actions (error)
  | 'warning'     // Yellow/caution (warning)
  | 'info';       // Blue/informational (info)

/**
 * Get the appropriate icon color from the theme based on semantic variant
 *
 * @param theme - The current theme object
 * @param variant - The semantic variant for the icon (default: 'secondary')
 * @returns The color string from the theme
 *
 * @example
 * ```typescript
 * const iconColor = getIconColor(theme, 'success'); // Returns theme.colors.success
 * <CheckIcon style={{ color: iconColor }} />
 * ```
 */
export function getIconColor(theme: Theme, variant: IconVariant = 'secondary'): string {
  switch (variant) {
    case 'primary':
      return theme.colors.textPrimary;
    case 'secondary':
      return theme.colors.textSecondary;
    case 'tertiary':
      return theme.colors.textTertiary;
    case 'accent':
      return theme.colors.accentPrimary;
    case 'success':
      return theme.colors.success;
    case 'error':
      return theme.colors.error;
    case 'warning':
      return theme.colors.warning;
    case 'info':
      return theme.colors.info;
    default:
      return theme.colors.textSecondary;
  }
}

/**
 * Props for the ThemedIcon wrapper component
 */
export interface ThemedIconProps {
  /**
   * The Heroicon component to render
   * @example CheckCircleIcon, XCircleIcon, etc.
   */
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

  /**
   * The semantic variant determining the icon color
   * @default 'secondary'
   */
  variant?: IconVariant;

  /**
   * Additional CSS classes (e.g., for sizing: "h-5 w-5")
   */
  className?: string;

  /**
   * Additional inline styles (merged with theme color)
   */
  style?: React.CSSProperties;
}

/**
 * Wrapper component that automatically applies theme-aware colors to icons
 *
 * @example
 * ```typescript
 * // Success icon (green)
 * <ThemedIcon Icon={CheckCircleIcon} variant="success" className="h-5 w-5" />
 *
 * // Error icon (red)
 * <ThemedIcon Icon={XCircleIcon} variant="error" className="h-5 w-5" />
 *
 * // Default secondary icon (muted)
 * <ThemedIcon Icon={InformationCircleIcon} className="h-4 w-4" />
 * ```
 */
export function ThemedIcon({
  Icon,
  variant = 'secondary',
  className = '',
  style = {},
}: ThemedIconProps) {
  const { theme } = useTheme();
  const color = getIconColor(theme, variant);

  return (
    <Icon
      className={className}
      style={{
        color,
        ...style,
      }}
    />
  );
}
