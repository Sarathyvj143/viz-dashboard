/**
 * CustomThemePicker Component
 * Allows users to create personalized themes by selecting custom colors
 */
import { useState } from 'react';
import { ThemeColors, ThemeName } from '../../types/theme';
import { themes } from '../../constants/themes';
import Button from '../common/Button';
import Card from '../common/Card';
import { useTheme } from '../../contexts/ThemeContext';
import { useToastStore } from '../../store/toastStore';

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

function ColorInput({ label, value, onChange, description }: ColorInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{description}</p>
      )}
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          pattern="^#[0-9A-Fa-f]{6}$"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

interface CustomThemePickerProps {
  onClose?: () => void;
}

export default function CustomThemePicker({ onClose }: CustomThemePickerProps) {
  const { theme, setTheme } = useTheme();
  const { showToast } = useToastStore();

  // Initialize with current theme colors if custom, otherwise use light theme as template
  const initialColors: ThemeColors = theme.name === 'custom'
    ? theme.colors
    : themes.light.colors;

  const [colors, setColors] = useState<ThemeColors>(initialColors);
  const [isSaving, setIsSaving] = useState(false);

  const updateColor = (key: keyof ThemeColors, value: string) => {
    // Validate hex color format
    if (/^#[0-9A-Fa-f]{6}$/.test(value) || value === '') {
      setColors((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleSave = async () => {
    // Validate all colors are set
    const isValid = Object.values(colors).every(
      (color) => color && /^#[0-9A-Fa-f]{6}$/.test(color)
    );

    if (!isValid) {
      showToast('Please ensure all colors are valid hex codes (e.g., #FF0000)', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await setTheme('custom', colors);
      showToast('Custom theme saved successfully', 'success');
      if (onClose) onClose();
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to save custom theme';
      showToast(errorMessage, 'error');
      console.error('Failed to save custom theme:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setColors(initialColors);
  };

  const applyPreset = (preset: Exclude<ThemeName, 'auto' | 'custom'>) => {
    const presetTheme = themes[preset];
    if (presetTheme) {
      setColors(presetTheme.colors);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Create Custom Theme
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Personalize your experience by choosing your own color palette
        </p>
      </div>

      {/* Preset Templates */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
          Start with a Template
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => applyPreset('light')}
            className="text-xs"
          >
            Light
          </Button>
          <Button
            variant="secondary"
            onClick={() => applyPreset('dark')}
            className="text-xs"
          >
            Dark
          </Button>
          <Button
            variant="secondary"
            onClick={() => applyPreset('ocean')}
            className="text-xs"
          >
            Ocean
          </Button>
          <Button
            variant="secondary"
            onClick={() => applyPreset('forest')}
            className="text-xs"
          >
            Forest
          </Button>
          <Button
            variant="secondary"
            onClick={() => applyPreset('sunset')}
            className="text-xs"
          >
            Sunset
          </Button>
        </div>
      </div>

      {/* Color Pickers organized by category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Background Colors */}
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Background Colors
          </h4>
          <div className="space-y-3">
            <ColorInput
              label="Primary Background"
              value={colors.bgPrimary}
              onChange={(v) => updateColor('bgPrimary', v)}
              description="Main background color"
            />
            <ColorInput
              label="Secondary Background"
              value={colors.bgSecondary}
              onChange={(v) => updateColor('bgSecondary', v)}
              description="Cards and panels"
            />
            <ColorInput
              label="Tertiary Background"
              value={colors.bgTertiary}
              onChange={(v) => updateColor('bgTertiary', v)}
              description="Hover and active states"
            />
          </div>
        </Card>

        {/* Text Colors */}
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Text Colors
          </h4>
          <div className="space-y-3">
            <ColorInput
              label="Primary Text"
              value={colors.textPrimary}
              onChange={(v) => updateColor('textPrimary', v)}
              description="Headings and important text"
            />
            <ColorInput
              label="Secondary Text"
              value={colors.textSecondary}
              onChange={(v) => updateColor('textSecondary', v)}
              description="Body text"
            />
            <ColorInput
              label="Tertiary Text"
              value={colors.textTertiary}
              onChange={(v) => updateColor('textTertiary', v)}
              description="Muted and helper text"
            />
          </div>
        </Card>

        {/* Accent Colors */}
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Accent Colors
          </h4>
          <div className="space-y-3">
            <ColorInput
              label="Primary Accent"
              value={colors.accentPrimary}
              onChange={(v) => updateColor('accentPrimary', v)}
              description="Buttons and links"
            />
            <ColorInput
              label="Secondary Accent"
              value={colors.accentSecondary}
              onChange={(v) => updateColor('accentSecondary', v)}
              description="Hover states"
            />
          </div>
        </Card>

        {/* Border Colors */}
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Border Colors
          </h4>
          <div className="space-y-3">
            <ColorInput
              label="Primary Border"
              value={colors.borderPrimary}
              onChange={(v) => updateColor('borderPrimary', v)}
              description="Standard borders"
            />
            <ColorInput
              label="Secondary Border"
              value={colors.borderSecondary}
              onChange={(v) => updateColor('borderSecondary', v)}
              description="Dividers and separators"
            />
          </div>
        </Card>

        {/* Status Colors */}
        <Card className="p-4 lg:col-span-2">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Status Colors
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <ColorInput
              label="Success"
              value={colors.success}
              onChange={(v) => updateColor('success', v)}
              description="Success messages"
            />
            <ColorInput
              label="Warning"
              value={colors.warning}
              onChange={(v) => updateColor('warning', v)}
              description="Warning messages"
            />
            <ColorInput
              label="Error"
              value={colors.error}
              onChange={(v) => updateColor('error', v)}
              description="Error messages"
            />
            <ColorInput
              label="Info"
              value={colors.info}
              onChange={(v) => updateColor('info', v)}
              description="Informational messages"
            />
          </div>
        </Card>
      </div>

      {/* Preview */}
      <Card className="p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Preview
        </h4>
        <div
          className="rounded-lg p-4 border-2"
          style={{
            backgroundColor: colors.bgPrimary,
            borderColor: colors.borderPrimary,
          }}
        >
          <div
            className="rounded-lg p-4 mb-3"
            style={{ backgroundColor: colors.bgSecondary }}
          >
            <h5
              className="font-semibold mb-2"
              style={{ color: colors.textPrimary }}
            >
              Sample Card
            </h5>
            <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
              This is how your custom theme will look with different text styles.
            </p>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 rounded text-sm font-medium text-white"
                style={{ backgroundColor: colors.accentPrimary }}
              >
                Primary Button
              </button>
              <button
                className="px-3 py-1 rounded text-sm font-medium"
                style={{
                  backgroundColor: colors.bgTertiary,
                  color: colors.textPrimary,
                  borderColor: colors.borderSecondary,
                }}
              >
                Secondary Button
              </button>
            </div>
          </div>
          <div className="flex gap-2 text-xs">
            <span
              className="px-2 py-1 rounded"
              style={{ backgroundColor: colors.success, color: '#ffffff' }}
            >
              Success
            </span>
            <span
              className="px-2 py-1 rounded"
              style={{ backgroundColor: colors.warning, color: '#ffffff' }}
            >
              Warning
            </span>
            <span
              className="px-2 py-1 rounded"
              style={{ backgroundColor: colors.error, color: '#ffffff' }}
            >
              Error
            </span>
            <span
              className="px-2 py-1 rounded"
              style={{ backgroundColor: colors.info, color: '#ffffff' }}
            >
              Info
            </span>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
        <div className="flex gap-3">
          {onClose && (
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Custom Theme'}
          </Button>
        </div>
      </div>
    </div>
  );
}
