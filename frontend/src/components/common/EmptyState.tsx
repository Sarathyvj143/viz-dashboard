import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Button from './Button';
import { Icon } from './Icon';

interface EmptyStateProps {
  /** Icon to display */
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

  /** Main title */
  title: string;

  /** Optional description */
  description?: string;

  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };

  /** Additional CSS classes */
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  const { theme } = useTheme();

  const styles = {
    container: {
      textAlign: 'center' as const,
      padding: '3rem 1.5rem',
    },
    iconWrapper: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '1rem',
    },
    title: {
      marginTop: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: 600,
      color: theme.colors.textPrimary,
    },
    description: {
      marginTop: '0.25rem',
      fontSize: '0.875rem',
      color: theme.colors.textSecondary,
    },
    actionWrapper: {
      marginTop: '1.5rem',
      display: 'flex',
      justifyContent: 'center',
    },
  };

  return (
    <div style={styles.container} className={className}>
      <div style={styles.iconWrapper}>
        <Icon Icon={icon} variant="secondary" size="xl" />
      </div>
      <h3 style={styles.title}>{title}</h3>
      {description && <p style={styles.description}>{description}</p>}
      {action && (
        <div style={styles.actionWrapper}>
          <Button onClick={action.onClick}>{action.label}</Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
