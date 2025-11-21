/**
 * Theme Selector Component
 * Allows users to choose their preferred theme
 */
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { ThemeName } from '../../types/theme';
import { themes } from '../../constants/themes';
import { CheckIcon, SunIcon, MoonIcon, SparklesIcon, ComputerDesktopIcon, PaintBrushIcon } from '@heroicons/react/24/outline';
import Spinner from '../common/Spinner';
import Button from '../common/Button';
import Modal from '../common/Modal';
import CustomThemePicker from './CustomThemePicker';

export default function ThemeSelector() {
  const styles = useThemedStyles();
  const { currentTheme, setTheme, isLoading, theme } = useTheme();
  const [changing, setChanging] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const handleThemeChange = async (themeName: ThemeName) => {
    if (themeName === 'custom') {
      setShowCustomPicker(true);
      return;
    }

    setChanging(true);
    try {
      await setTheme(themeName);
    } finally {
      setChanging(false);
    }
  };

  const getThemeIcon = (themeName: ThemeName) => {
    switch (themeName) {
      case 'light':
        return <SunIcon className="w-5 h-5" />;
      case 'dark':
        return <MoonIcon className="w-5 h-5" />;
      case 'auto':
        return <ComputerDesktopIcon className="w-5 h-5" />;
      case 'custom':
        return <PaintBrushIcon className="w-5 h-5" />;
      default:
        return <SparklesIcon className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="md" color="blue" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2" style={styles.heading.primary}>Theme Preference</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose your preferred theme for the application
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Object.keys(themes) as (Exclude<ThemeName, 'custom'>)[]).map((themeName) => {
          const themeData = themes[themeName];
          const isSelected = currentTheme === themeName;

          return (
            <button
              key={themeName}
              onClick={() => handleThemeChange(themeName)}
              disabled={changing}
              className={`
                relative p-4 rounded-lg border-2 text-left transition-all duration-200
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm'
                }
                ${changing ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
              `}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <CheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              )}

              {/* Theme preview - colored circle */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
                  style={{
                    backgroundColor: themeData.colors.bgSecondary,
                    color: themeData.colors.textPrimary,
                  }}
                >
                  {getThemeIcon(themeName)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold mb-1" style={styles.heading.primary}>
                    {themeData.displayName}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {themeData.description}
                  </p>
                </div>
              </div>

              {/* Color palette preview */}
              <div className="flex gap-1">
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: themeData.colors.accentPrimary }}
                  title="Primary Accent"
                />
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: themeData.colors.success }}
                  title="Success"
                />
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: themeData.colors.warning }}
                  title="Warning"
                />
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: themeData.colors.error}}
                  title="Error"
                />
              </div>
            </button>
          );
        })}

        {/* Custom Theme Card */}
        <button
          onClick={() => handleThemeChange('custom')}
          disabled={changing}
          className={`
            relative p-4 rounded-lg border-2 text-left transition-all duration-200
            ${
              currentTheme === 'custom'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm'
            }
            ${changing ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
          `}
        >
          {/* Selected indicator */}
          {currentTheme === 'custom' && (
            <div className="absolute top-3 right-3">
              <CheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          )}

          {/* Custom Theme preview */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
              style={{
                backgroundColor: currentTheme === 'custom' ? theme.colors.bgSecondary : '#f3f4f6',
                color: currentTheme === 'custom' ? theme.colors.textPrimary : '#111827',
              }}
            >
              <PaintBrushIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold mb-1" style={styles.heading.primary}>
                Custom
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                Create your own personalized color palette
              </p>
            </div>
          </div>

          {/* Color palette preview for custom theme */}
          {currentTheme === 'custom' && (
            <div className="flex gap-1">
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: theme.colors.accentPrimary }}
                title="Primary Accent"
              />
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: theme.colors.success }}
                title="Success"
              />
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: theme.colors.warning }}
                title="Warning"
              />
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: theme.colors.error}}
                title="Error"
              />
            </div>
          )}
          {currentTheme !== 'custom' && (
            <div className="flex gap-1">
              <div className="w-6 h-6 rounded bg-gradient-to-r from-blue-400 to-purple-400" />
              <div className="w-6 h-6 rounded bg-gradient-to-r from-green-400 to-cyan-400" />
              <div className="w-6 h-6 rounded bg-gradient-to-r from-orange-400 to-red-400" />
              <div className="w-6 h-6 rounded bg-gradient-to-r from-pink-400 to-purple-400" />
            </div>
          )}
        </button>
      </div>

      {/* Current theme info */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Current theme:</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{theme.displayName}</span>
          {currentTheme === 'auto' && (
            <span className="text-xs text-gray-500 dark:text-gray-500">
              (synced with system)
            </span>
          )}
          {currentTheme === 'custom' && (
            <Button
              variant="secondary"
              onClick={() => setShowCustomPicker(true)}
              className="ml-2 text-xs"
            >
              Edit Colors
            </Button>
          )}
        </div>
      </div>

      {/* Custom Theme Picker Modal */}
      <Modal
        isOpen={showCustomPicker}
        onClose={() => setShowCustomPicker(false)}
        title="Custom Theme"
      >
        <CustomThemePicker onClose={() => setShowCustomPicker(false)} />
      </Modal>
    </div>
  );
}
