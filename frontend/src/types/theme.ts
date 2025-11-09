/**
 * Theme types and configurations
 */

export type ThemeName = 'light' | 'dark' | 'auto' | 'ocean' | 'forest' | 'sunset' | 'custom';

export interface ThemeColors {
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;

  // Accent colors
  accentPrimary: string;
  accentSecondary: string;

  // Border colors
  borderPrimary: string;
  borderSecondary: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface Theme {
  name: ThemeName;
  displayName: string;
  description: string;
  isDark: boolean;
  colors: ThemeColors;
}

export interface ThemeContextType {
  currentTheme: ThemeName;
  theme: Theme;
  customColors: ThemeColors | null;
  setTheme: (theme: ThemeName, customColors?: ThemeColors) => Promise<void>;
  isLoading: boolean;
}
