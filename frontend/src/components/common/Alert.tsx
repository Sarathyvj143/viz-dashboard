import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { withOpacity, adjustColorBrightness } from '../../utils/colorHelpers';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface AlertProps {
  /** Alert type - determines color scheme */
  type: 'success' | 'error' | 'warning' | 'info';

  /** Message to display */
  message: string;

  /** Optional title */
  title?: string;

  /** Show close button */
  dismissible?: boolean;

  /** Close handler */
  onClose?: () => void;

  /** Custom icon (defaults based on type) */
  icon?: React.ComponentType<{ className?: string }>;
}

const ICON_MAP = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

export const Alert: React.FC<AlertProps> = ({
  type,
  message,
  title,
  dismissible = false,
  onClose,
  icon,
}) => {
  const { theme } = useTheme();

  const statusColor = theme.colors[type];
  const IconComponent = icon || ICON_MAP[type];

  const styles = {
    container: {
      backgroundColor: withOpacity(statusColor, 10),
      borderColor: statusColor,
      color: adjustColorBrightness(statusColor, -30),
      borderWidth: '1px',
      borderStyle: 'solid' as const,
      borderRadius: '0.5rem',
      padding: '1rem',
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'flex-start',
    },
    iconWrapper: {
      flexShrink: 0,
      color: statusColor,
    },
    content: {
      flex: 1,
    },
    title: {
      fontWeight: 600,
      marginBottom: title ? '0.25rem' : 0,
    },
    message: {
      fontSize: '0.875rem',
    },
    closeButton: {
      flexShrink: 0,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      color: statusColor,
    },
  };

  return (
    <div style={styles.container} role="alert" aria-live="polite">
      <div style={styles.iconWrapper}>
        <IconComponent className="w-5 h-5" />
      </div>
      <div style={styles.content}>
        {title && <div style={styles.title}>{title}</div>}
        <div style={styles.message}>{message}</div>
      </div>
      {dismissible && onClose && (
        <button
          style={styles.closeButton}
          onClick={onClose}
          aria-label="Dismiss alert"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default Alert;
