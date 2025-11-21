import { ButtonHTMLAttributes } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { withOpacity } from '../../utils/colorHelpers';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const { theme } = useTheme();

  const baseStyles = 'font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Theme-aware button styles
  const getButtonStyles = () => {
    if (disabled) {
      return {
        backgroundColor: withOpacity(theme.colors.textSecondary, 30),
        color: theme.colors.textSecondary,
        cursor: 'not-allowed',
        opacity: 0.6,
      };
    }

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.accentPrimary,
          color: '#ffffff',
          borderColor: theme.colors.accentPrimary,
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.bgSecondary,
          color: theme.colors.textPrimary,
          borderColor: theme.colors.borderPrimary,
          borderWidth: '1px',
          borderStyle: 'solid' as const,
        };
      case 'danger':
        return {
          backgroundColor: theme.colors.error,
          color: '#ffffff',
          borderColor: theme.colors.error,
        };
      default:
        return {
          backgroundColor: theme.colors.accentPrimary,
          color: '#ffffff',
        };
    }
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${className}`}
      style={getButtonStyles()}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
