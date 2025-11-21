import { useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';
import { adjustColorBrightness } from '../../utils/colorHelpers';
import type { Toast as ToastType } from '../../store/toastStore';

interface ToastProps extends ToastType {
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Get color based on toast type
  const getColor = () => {
    switch (type) {
      case 'success': return theme.colors.success;
      case 'error': return theme.colors.error;
      case 'info': return theme.colors.info;
      default: return theme.colors.info;
    }
  };

  const color = getColor();
  const textColor = theme.isDark ? color : adjustColorBrightness(color, -40);

  // Dynamic styles based on theme
  const toastStyles = {
    backgroundColor: `${color}15`, // 15% opacity
    borderColor: color,
    borderWidth: '1px',
    borderStyle: 'solid' as const,
    color: textColor,
  };

  const icons = {
    success: <CheckCircleIcon className="h-5 w-5 flex-shrink-0" style={{ color }} />,
    error: <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" style={{ color }} />,
    info: <InformationCircleIcon className="h-5 w-5 flex-shrink-0" style={{ color }} />,
  };

  return (
    <div
      className="max-w-md rounded-lg shadow-lg p-4 animate-slide-in"
      style={toastStyles}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {icons[type]}
        <p className="flex-1 text-sm">{message}</p>
        <button
          onClick={onClose}
          className="transition-opacity hover:opacity-70"
          style={{ color }}
          aria-label="Close notification"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
