import { useTheme } from '../../contexts/ThemeContext';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'accent' | 'white';
  color?: string; // Custom color override
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
};

export default function Spinner({ size = 'md', variant = 'primary', color: customColor, className = '' }: SpinnerProps) {
  const { theme } = useTheme();

  const getColor = () => {
    if (customColor) return customColor;

    switch (variant) {
      case 'primary':
        return theme.colors.textPrimary;
      case 'accent':
        return theme.colors.accentPrimary;
      case 'white':
        return '#ffffff';
      default:
        return theme.colors.textPrimary;
    }
  };

  const color = getColor();

  return (
    <div
      className={`animate-spin rounded-full border-b-2 ${sizeMap[size]} ${className}`}
      style={{ borderColor: color }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
