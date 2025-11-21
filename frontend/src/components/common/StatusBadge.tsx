import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { withOpacity, getContrastTextColor } from '../../utils/colorHelpers';

interface StatusBadgeProps {
  /** Badge type - determines color scheme */
  type?: 'success' | 'error' | 'warning' | 'info' | 'neutral';

  /** Badge label text */
  label: string;

  /** Size variant */
  size?: 'sm' | 'md' | 'lg';

  /** Style variant */
  variant?: 'solid' | 'outline' | 'subtle';

  /** Optional icon */
  icon?: React.ComponentType<{ className?: string }>;

  /** Click handler (makes badge interactive) */
  onClick?: () => void;

  /** Additional CSS classes */
  className?: string;
}

const SIZE_STYLES = {
  sm: {
    padding: '0.125rem 0.5rem',
    fontSize: '0.75rem',
    iconSize: 'w-3 h-3',
  },
  md: {
    padding: '0.25rem 0.75rem',
    fontSize: '0.875rem',
    iconSize: 'w-4 h-4',
  },
  lg: {
    padding: '0.375rem 1rem',
    fontSize: '1rem',
    iconSize: 'w-5 h-5',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type = 'neutral',
  label,
  size = 'md',
  variant = 'subtle',
  icon: Icon,
  onClick,
  className = '',
}) => {
  const { theme } = useTheme();

  const statusColor =
    type === 'neutral' ? theme.colors.textSecondary : theme.colors[type];

  const sizeStyle = SIZE_STYLES[size];

  const getVariantStyles = () => {
    switch (variant) {
      case 'solid':
        return {
          backgroundColor: statusColor,
          color: getContrastTextColor(statusColor),
          border: 'none',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: statusColor,
          borderWidth: '1px',
          borderStyle: 'solid' as const,
          borderColor: statusColor,
        };
      case 'subtle':
        return {
          backgroundColor: withOpacity(statusColor, 15),
          color: statusColor,
          border: 'none',
        };
    }
  };

  const styles = {
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      borderRadius: '9999px',
      fontWeight: 500,
      whiteSpace: 'nowrap' as const,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s',
      ...sizeStyle,
      ...getVariantStyles(),
    },
  };

  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      style={styles.badge}
      onClick={onClick}
      className={className}
      {...(onClick && { type: 'button' })}
    >
      {Icon && <Icon className={sizeStyle.iconSize} />}
      {label}
    </Component>
  );
};

export default StatusBadge;
