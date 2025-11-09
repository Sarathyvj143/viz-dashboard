/**
 * Predefined theme configurations
 */
import { Theme, ThemeName, ThemeColors } from '../types/theme';

export const themes: Record<Exclude<ThemeName, 'custom'>, Theme> = {
  light: {
    name: 'light',
    displayName: 'Light',
    description: 'Clean and bright theme for daytime use',
    isDark: false,
    colors: {
      bgPrimary: '#ffffff',
      bgSecondary: '#f9fafb',
      bgTertiary: '#f3f4f6',
      textPrimary: '#111827',
      textSecondary: '#4b5563',
      textTertiary: '#6b7280',
      accentPrimary: '#3b82f6',
      accentSecondary: '#60a5fa',
      borderPrimary: '#e5e7eb',
      borderSecondary: '#d1d5db',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },
  dark: {
    name: 'dark',
    displayName: 'Dark',
    description: 'Easy on the eyes for low-light environments',
    isDark: true,
    colors: {
      bgPrimary: '#1f2937',
      bgSecondary: '#111827',
      bgTertiary: '#0f172a',
      textPrimary: '#f9fafb',
      textSecondary: '#e5e7eb',
      textTertiary: '#d1d5db',
      accentPrimary: '#60a5fa',
      accentSecondary: '#3b82f6',
      borderPrimary: '#374151',
      borderSecondary: '#4b5563',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa',
    },
  },
  auto: {
    name: 'auto',
    displayName: 'Auto',
    description: 'Automatically switch between light and dark based on system preference',
    isDark: false, // Will be determined by system preference
    colors: {
      bgPrimary: '#ffffff',
      bgSecondary: '#f9fafb',
      bgTertiary: '#f3f4f6',
      textPrimary: '#111827',
      textSecondary: '#4b5563',
      textTertiary: '#6b7280',
      accentPrimary: '#3b82f6',
      accentSecondary: '#60a5fa',
      borderPrimary: '#e5e7eb',
      borderSecondary: '#d1d5db',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },
  ocean: {
    name: 'ocean',
    displayName: 'Ocean',
    description: 'Cool blue tones inspired by the sea',
    isDark: true,
    colors: {
      bgPrimary: '#0c4a6e',
      bgSecondary: '#075985',
      bgTertiary: '#0369a1',
      textPrimary: '#f0f9ff',
      textSecondary: '#e0f2fe',
      textTertiary: '#bae6fd',
      accentPrimary: '#38bdf8',
      accentSecondary: '#7dd3fc',
      borderPrimary: '#0284c7',
      borderSecondary: '#0ea5e9',
      success: '#22d3ee',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#38bdf8',
    },
  },
  forest: {
    name: 'forest',
    displayName: 'Forest',
    description: 'Natural green tones for a calming experience',
    isDark: true,
    colors: {
      bgPrimary: '#14532d',
      bgSecondary: '#166534',
      bgTertiary: '#15803d',
      textPrimary: '#f0fdf4',
      textSecondary: '#dcfce7',
      textTertiary: '#bbf7d0',
      accentPrimary: '#4ade80',
      accentSecondary: '#86efac',
      borderPrimary: '#16a34a',
      borderSecondary: '#22c55e',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa',
    },
  },
  sunset: {
    name: 'sunset',
    displayName: 'Sunset',
    description: 'Warm orange and purple hues',
    isDark: true,
    colors: {
      bgPrimary: '#7c2d12',
      bgSecondary: '#9a3412',
      bgTertiary: '#c2410c',
      textPrimary: '#fff7ed',
      textSecondary: '#ffedd5',
      textTertiary: '#fed7aa',
      accentPrimary: '#fb923c',
      accentSecondary: '#fdba74',
      borderPrimary: '#ea580c',
      borderSecondary: '#f97316',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#fb923c',
    },
  },
};

export const DEFAULT_THEME: ThemeName = 'light';

export const getSystemPrefersDark = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const resolveTheme = (themeName: ThemeName, customColors?: ThemeColors | null): Theme => {
  if (themeName === 'custom' && customColors) {
    return {
      name: 'custom',
      displayName: 'Custom',
      description: 'Your personalized color palette',
      isDark: customColors.bgPrimary ? isDarkColor(customColors.bgPrimary) : false,
      colors: customColors,
    };
  }

  if (themeName === 'auto') {
    const prefersDark = getSystemPrefersDark();
    return prefersDark ? themes.dark : themes.light;
  }

  return themes[themeName as Exclude<ThemeName, 'custom'>] || themes.light;
};

/**
 * Determine if a color is dark based on its hex value
 */
function isDarkColor(hex: string): boolean {
  // Remove # if present
  const color = hex.replace('#', '');

  // Convert to RGB using substring (modern replacement for deprecated substr)
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance < 0.5;
}

/**
 * Get default chart colors based on current theme
 * Returns colors optimized for the theme's background
 */
export const getDefaultChartColors = (themeName: ThemeName, customColors?: ThemeColors | null): string[] => {
  const theme = resolveTheme(themeName, customColors);

  // For dark themes, use brighter, more vibrant colors
  if (theme.isDark) {
    return ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'];
  }

  // For light themes, use slightly darker, more saturated colors
  return ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
};
