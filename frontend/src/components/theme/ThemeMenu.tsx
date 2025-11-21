/**
 * Compact Theme Menu Component
 * Quick theme switcher for navigation menu
 */
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { ThemeName } from '../../types/theme';
import { themes } from '../../constants/themes';
import {
  SunIcon,
  MoonIcon,
  SparklesIcon,
  ComputerDesktopIcon,
  CheckIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';

interface ThemeMenuProps {
  isCollapsed?: boolean;
}

export default function ThemeMenu({ isCollapsed = false }: ThemeMenuProps) {
  const { currentTheme, setTheme, theme } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getThemeIcon = (themeName: ThemeName) => {
    const iconClass = "w-5 h-5";
    switch (themeName) {
      case 'light':
        return <SunIcon className={iconClass} />;
      case 'dark':
        return <MoonIcon className={iconClass} />;
      case 'auto':
        return <ComputerDesktopIcon className={iconClass} />;
      case 'custom':
        return <PaintBrushIcon className={iconClass} />;
      default:
        return <SparklesIcon className={iconClass} />;
    }
  };

  const handleThemeSelect = async (themeName: ThemeName) => {
    // For custom theme, navigate to settings page using React Router
    if (themeName === 'custom') {
      navigate('/admin/settings');
      setIsOpen(false);
      return;
    }
    await setTheme(themeName);
    setIsOpen(false);
  };

  // Close menu when clicking outside
  useClickOutside(menuRef, () => setIsOpen(false), isOpen);

  if (isCollapsed) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all duration-200 w-full flex items-center justify-center"
          title="Change theme"
        >
          {getThemeIcon(currentTheme)}
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-50">
            {(Object.keys(themes) as (Exclude<ThemeName, 'custom'>)[]).map((themeName) => {
              const themeData = themes[themeName];
              const isSelected = currentTheme === themeName;

              return (
                <button
                  key={themeName}
                  onClick={() => handleThemeSelect(themeName)}
                  className={`w-full px-3 py-2 flex items-center gap-3 text-left transition-colors ${
                    isSelected
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {getThemeIcon(themeName)}
                  <span className="flex-1 text-sm">{themeData.displayName}</span>
                  {isSelected && <CheckIcon className="w-4 h-4 text-blue-400" />}
                </button>
              );
            })}
            {/* Custom theme option */}
            <button
              onClick={() => handleThemeSelect('custom')}
              className={`w-full px-3 py-2 flex items-center gap-3 text-left transition-colors ${
                currentTheme === 'custom'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {getThemeIcon('custom')}
              <span className="flex-1 text-sm">{theme.displayName}</span>
              {currentTheme === 'custom' && <CheckIcon className="w-4 h-4 text-blue-400" />}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-x-2 rounded-lg bg-gray-800 px-3 py-2.5 text-sm font-semibold text-gray-400 hover:bg-gray-700 hover:text-white transition-all duration-200"
      >
        <div className="flex items-center gap-x-2">
          {getThemeIcon(currentTheme)}
          <span>Theme</span>
        </div>
        <span className="text-xs capitalize">{theme.displayName}</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-50">
          {(Object.keys(themes) as (Exclude<ThemeName, 'custom'>)[]).map((themeName) => {
            const themeData = themes[themeName];
            const isSelected = currentTheme === themeName;

            return (
              <button
                key={themeName}
                onClick={() => handleThemeSelect(themeName)}
                className={`w-full px-3 py-2 flex items-center gap-3 text-left transition-colors ${
                  isSelected
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {getThemeIcon(themeName)}
                <div className="flex-1">
                  <div className="text-sm font-medium">{themeData.displayName}</div>
                  <div className="text-xs text-gray-500">{themeData.description}</div>
                </div>
                {isSelected && <CheckIcon className="w-4 h-4 text-blue-400" />}
              </button>
            );
          })}
          {/* Custom theme option */}
          <button
            onClick={() => handleThemeSelect('custom')}
            className={`w-full px-3 py-2 flex items-center gap-3 text-left transition-colors ${
              currentTheme === 'custom'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {getThemeIcon('custom')}
            <div className="flex-1">
              <div className="text-sm font-medium">{theme.displayName}</div>
              <div className="text-xs text-gray-500">{theme.description}</div>
            </div>
            {currentTheme === 'custom' && <CheckIcon className="w-4 h-4 text-blue-400" />}
          </button>
        </div>
      )}
    </div>
  );
}
