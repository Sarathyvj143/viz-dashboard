import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { withOpacity, adjustColorBrightness } from '../utils/colorHelpers';

/**
 * Custom hook providing memoized theme-aware style objects.
 *
 * Returns commonly used style patterns that respect the current theme.
 * All styles are memoized to prevent unnecessary re-renders.
 *
 * @returns Object containing various themed style functions and objects
 *
 * @example
 * ```tsx
 * const styles = useThemedStyles();
 *
 * <div style={styles.card}>Card content</div>
 * <div style={styles.statusBox('error')}>Error message</div>
 * <span style={styles.badge('success')}>Success</span>
 * <h1 style={styles.typography.h1}>Page Title</h1>
 * ```
 */
export function useThemedStyles() {
  const { theme } = useTheme();

  return useMemo(
    () => ({
      /**
       * Card style with secondary background and primary border
       */
      card: {
        backgroundColor: theme.colors.bgSecondary,
        borderColor: theme.colors.borderPrimary,
        borderWidth: '1px',
        borderStyle: 'solid' as const,
      },

      /**
       * Border styles for primary and secondary variants
       */
      border: {
        primary: {
          borderColor: theme.colors.borderPrimary,
          borderWidth: '1px',
          borderStyle: 'solid' as const,
        },
        secondary: {
          borderColor: theme.colors.borderSecondary,
          borderWidth: '1px',
          borderStyle: 'solid' as const,
        },
      },

      /**
       * Border for specific sides
       */
      borderTop: (variant: 'primary' | 'secondary' = 'primary') => ({
        borderTopColor:
          variant === 'primary'
            ? theme.colors.borderPrimary
            : theme.colors.borderSecondary,
        borderTopWidth: '1px',
        borderTopStyle: 'solid' as const,
      }),

      borderBottom: (variant: 'primary' | 'secondary' = 'primary') => ({
        borderBottomColor:
          variant === 'primary'
            ? theme.colors.borderPrimary
            : theme.colors.borderSecondary,
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid' as const,
      }),

      /**
       * Status box with themed background and border (for alerts, info boxes, etc.)
       * @param status - The status type determining colors
       */
      statusBox: (status: 'success' | 'error' | 'warning' | 'info') => ({
        backgroundColor: withOpacity(theme.colors[status], 15),
        borderColor: theme.colors[status],
        borderWidth: '1px',
        borderStyle: 'solid' as const,
      }),

      /**
       * Badge/pill style with status colors
       * @param status - The status type determining colors
       */
      badge: (status: 'success' | 'error' | 'warning' | 'info') => ({
        backgroundColor: withOpacity(theme.colors[status], 20),
        color: theme.colors[status],
      }),

      /**
       * Input/select base styles
       */
      input: {
        backgroundColor: theme.colors.bgSecondary,
        borderColor: theme.colors.borderPrimary,
        borderWidth: '1px',
        borderStyle: 'solid' as const,
        color: theme.colors.textPrimary,
      },

      /**
       * Text color variants
       */
      text: {
        primary: { color: theme.colors.textPrimary },
        secondary: { color: theme.colors.textSecondary },
        accent: { color: theme.colors.accentPrimary },
        success: { color: theme.colors.success },
        error: { color: theme.colors.error },
        warning: { color: theme.colors.warning },
        info: { color: theme.colors.info },
      },

      /**
       * Background color variants
       */
      bg: {
        primary: { backgroundColor: theme.colors.bgPrimary },
        secondary: { backgroundColor: theme.colors.bgSecondary },
        tertiary: { backgroundColor: theme.colors.bgTertiary },
      },

      /**
       * Table styles
       */
      table: {
        /**
         * Table header (thead) style
         */
        header: {
          backgroundColor: theme.colors.bgSecondary,
          borderBottomColor: theme.colors.borderPrimary,
          borderBottomWidth: '1px',
          borderBottomStyle: 'solid' as const,
        },

        /**
         * Table header cell (th) style
         */
        headerCell: {
          color: theme.colors.textSecondary,
        },

        /**
         * Table body (tbody) style
         */
        body: {
          backgroundColor: theme.colors.bgPrimary,
        },

        /**
         * Table row (tr) style
         */
        row: {
          borderBottomColor: theme.colors.borderPrimary,
          borderBottomWidth: '1px',
          borderBottomStyle: 'solid' as const,
        },

        /**
         * Table row hover style
         */
        rowHover: {
          backgroundColor: withOpacity(theme.colors.bgSecondary, 50),
        },

        /**
         * Table cell (td) style
         */
        cell: {
          color: theme.colors.textPrimary,
        },

        /**
         * Table cell with secondary text
         */
        cellSecondary: {
          color: theme.colors.textSecondary,
        },
      },

      /**
       * Heading styles (h1-h6)
       */
      heading: {
        /**
         * Primary heading color
         */
        primary: {
          color: theme.colors.textPrimary,
        },

        /**
         * Secondary heading color (more muted)
         */
        secondary: {
          color: theme.colors.textSecondary,
        },
      },

      /**
       * Typography scale with consistent sizing and line heights
       */
      typography: {
        /**
         * H1 heading (page titles)
         */
        h1: {
          fontSize: '2rem',
          fontWeight: 700,
          color: theme.colors.textPrimary,
          lineHeight: 1.2,
        },

        /**
         * H2 heading (section titles)
         */
        h2: {
          fontSize: '1.5rem',
          fontWeight: 600,
          color: theme.colors.textPrimary,
          lineHeight: 1.3,
        },

        /**
         * H3 heading (subsection titles)
         */
        h3: {
          fontSize: '1.25rem',
          fontWeight: 600,
          color: theme.colors.textPrimary,
          lineHeight: 1.4,
        },

        /**
         * H4 heading
         */
        h4: {
          fontSize: '1.125rem',
          fontWeight: 600,
          color: theme.colors.textPrimary,
          lineHeight: 1.4,
        },

        /**
         * Body text (primary)
         */
        body: {
          fontSize: '1rem',
          color: theme.colors.textPrimary,
          lineHeight: 1.5,
        },

        /**
         * Body text (secondary)
         */
        bodySecondary: {
          fontSize: '1rem',
          color: theme.colors.textSecondary,
          lineHeight: 1.5,
        },

        /**
         * Small text
         */
        small: {
          fontSize: '0.875rem',
          color: theme.colors.textPrimary,
          lineHeight: 1.4,
        },

        /**
         * Small text (secondary)
         */
        smallSecondary: {
          fontSize: '0.875rem',
          color: theme.colors.textSecondary,
          lineHeight: 1.4,
        },

        /**
         * Caption text (helper text, hints)
         */
        caption: {
          fontSize: '0.75rem',
          color: theme.colors.textSecondary,
          lineHeight: 1.4,
        },

        /**
         * Label text (form labels, input labels)
         */
        label: {
          fontSize: '0.875rem',
          fontWeight: 500,
          color: theme.colors.textPrimary,
          lineHeight: 1.4,
        },
      },

      /**
       * Status styles with improved contrast for text
       */
      status: {
        success: {
          background: withOpacity(theme.colors.success, 10),
          border: theme.colors.success,
          text: adjustColorBrightness(theme.colors.success, -30),
          icon: theme.colors.success,
        },
        error: {
          background: withOpacity(theme.colors.error, 10),
          border: theme.colors.error,
          text: adjustColorBrightness(theme.colors.error, -30),
          icon: theme.colors.error,
        },
        warning: {
          background: withOpacity(theme.colors.warning, 10),
          border: theme.colors.warning,
          text: adjustColorBrightness(theme.colors.warning, -30),
          icon: theme.colors.warning,
        },
        info: {
          background: withOpacity(theme.colors.info, 10),
          border: theme.colors.info,
          text: adjustColorBrightness(theme.colors.info, -30),
          icon: theme.colors.info,
        },
      },
    }),
    [theme]
  );
}
