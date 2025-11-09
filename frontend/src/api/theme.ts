/**
 * Theme API client
 */
import apiClient from './client';
import { ThemeName, ThemeColors } from '../types/theme';

export const themeApi = {
  /**
   * Get current user's theme preference
   */
  getTheme: async (): Promise<{ theme: ThemeName; customColors?: ThemeColors | null }> => {
    const response = await apiClient.get<{ theme: ThemeName; customColors?: ThemeColors | null }>('/users/me/theme');
    return response.data;
  },

  /**
   * Update current user's theme preference
   */
  updateTheme: async (theme: ThemeName, customColors?: ThemeColors): Promise<void> => {
    await apiClient.put('/users/me/theme', {
      theme,
      custom_colors: customColors
    });
  },
};
