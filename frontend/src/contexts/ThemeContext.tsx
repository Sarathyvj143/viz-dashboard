/**
 * Theme Context and Provider
 * Manages application theme state and persistence
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeName, ThemeContextType, ThemeColors } from '../types/theme';
import { themes, DEFAULT_THEME, resolveTheme } from '../constants/themes';
import { themeApi } from '../api/theme';
import { useToastStore } from '../store/toastStore';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(DEFAULT_THEME);
  const [customColors, setCustomColors] = useState<ThemeColors | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToastStore();

  // Load theme from backend on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { theme, customColors: savedCustomColors } = await themeApi.getTheme();
        setCurrentTheme(theme);
        setCustomColors(savedCustomColors || null);
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        // Fall back to localStorage or default
        const localTheme = localStorage.getItem('theme') as ThemeName;
        const localCustomColors = localStorage.getItem('customThemeColors');
        if (localTheme && (themes[localTheme as Exclude<ThemeName, 'custom'>] || localTheme === 'custom')) {
          setCurrentTheme(localTheme);
          if (localTheme === 'custom' && localCustomColors) {
            try {
              setCustomColors(JSON.parse(localCustomColors));
            } catch {}
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Apply theme to document root
  useEffect(() => {
    const resolvedTheme = resolveTheme(currentTheme, customColors);
    const root = document.documentElement;

    // Apply dark mode class
    if (resolvedTheme.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply theme as data attribute for custom styling
    root.setAttribute('data-theme', currentTheme);

    // Store in localStorage as backup
    localStorage.setItem('theme', currentTheme);
    if (currentTheme === 'custom' && customColors) {
      localStorage.setItem('customThemeColors', JSON.stringify(customColors));
    } else {
      localStorage.removeItem('customThemeColors');
    }
  }, [currentTheme, customColors]);

  // Listen for system theme changes when using auto mode
  useEffect(() => {
    if (currentTheme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // Force re-render to apply new system preference
      setCurrentTheme('auto');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [currentTheme]);

  const setTheme = async (themeName: ThemeName, newCustomColors?: ThemeColors): Promise<void> => {
    try {
      setCurrentTheme(themeName);
      if (themeName === 'custom' && newCustomColors) {
        setCustomColors(newCustomColors);
      } else if (themeName !== 'custom') {
        setCustomColors(null);
      }
      await themeApi.updateTheme(themeName, newCustomColors);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      showToast('Failed to save theme preference', 'error');
      // Still apply theme locally even if API fails
    }
  };

  const value: ThemeContextType = {
    currentTheme,
    theme: resolveTheme(currentTheme, customColors),
    customColors,
    setTheme,
    isLoading,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
