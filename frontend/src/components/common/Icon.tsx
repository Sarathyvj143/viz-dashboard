import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface IconProps {
  /** Heroicon component to render */
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

  /** Color variant */
  variant?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'accent'
    | 'success'
    | 'error'
    | 'warning'
    | 'info';

  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /** Custom color (overrides variant) */
  color?: string;

  /** Additional CSS classes */
  className?: string;
}

const SIZE_MAP = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export const Icon: React.FC<IconProps> = ({
  Icon: IconComponent,
  variant = 'primary',
  size = 'md',
  color,
  className = '',
}) => {
  const { theme } = useTheme();

  const getColor = () => {
    if (color) return color;

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
        return theme.colors.textPrimary;
    }
  };

  const iconColor = getColor();
  const sizeClass = SIZE_MAP[size];

  return (
    <IconComponent
      className={`${sizeClass} ${className}`}
      style={{ color: iconColor }}
    />
  );
};

export default Icon;
