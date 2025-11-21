import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { withOpacity } from '../../utils/colorHelpers';
import { Icon } from './Icon';
import { StatusBadge } from './StatusBadge';

export interface Tab {
  /** Unique tab ID */
  id: string;

  /** Tab label */
  label: string;

  /** Optional icon */
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

  /** Optional badge (count, label, etc.) */
  badge?: string | number;
}

interface TabsProps {
  /** Tab definitions */
  tabs: Tab[];

  /** Currently active tab ID */
  activeTab: string;

  /** Tab change handler */
  onChange: (tabId: string) => void;

  /** Visual variant */
  variant?: 'underline' | 'pills' | 'enclosed';

  /** Additional CSS classes */
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className = '',
}) => {
  const { theme } = useTheme();

  const getTabStyles = (isActive: boolean) => {
    const baseStyles = {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: 'none',
      background: 'none',
      whiteSpace: 'nowrap' as const,
    };

    switch (variant) {
      case 'underline':
        return {
          ...baseStyles,
          borderBottom: isActive
            ? `2px solid ${theme.colors.accentPrimary}`
            : '2px solid transparent',
          color: isActive ? theme.colors.accentPrimary : theme.colors.textSecondary,
        };

      case 'pills':
        return {
          ...baseStyles,
          borderRadius: '0.5rem',
          backgroundColor: isActive
            ? theme.colors.accentPrimary
            : 'transparent',
          color: isActive ? '#ffffff' : theme.colors.textSecondary,
        };

      case 'enclosed':
        return {
          ...baseStyles,
          borderRadius: '0.5rem 0.5rem 0 0',
          border: isActive
            ? `1px solid ${theme.colors.borderPrimary}`
            : '1px solid transparent',
          borderBottom: isActive ? 'none' : `1px solid ${theme.colors.borderPrimary}`,
          backgroundColor: isActive
            ? theme.colors.bgPrimary
            : theme.colors.bgSecondary,
          color: isActive ? theme.colors.textPrimary : theme.colors.textSecondary,
          marginBottom: '-1px',
        };

      default:
        return baseStyles;
    }
  };

  const containerStyles = {
    display: 'flex',
    gap: variant === 'underline' ? '0' : '0.5rem',
    borderBottom: variant === 'underline' ? `1px solid ${theme.colors.borderPrimary}` : 'none',
    overflowX: 'auto' as const,
  };

  return (
    <div style={containerStyles} className={className} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const tabStyles = getTabStyles(isActive);

        return (
          <button
            key={tab.id}
            style={tabStyles}
            onClick={() => onChange(tab.id)}
            onMouseEnter={(e) => {
              if (!isActive && variant !== 'pills') {
                e.currentTarget.style.backgroundColor = withOpacity(
                  theme.colors.bgTertiary,
                  50
                );
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive && variant !== 'pills') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
          >
            {tab.icon && (
              <Icon
                Icon={tab.icon}
                variant={isActive ? 'accent' : 'secondary'}
                size="sm"
                color={
                  variant === 'pills' && isActive
                    ? '#ffffff'
                    : undefined
                }
              />
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <StatusBadge
                label={String(tab.badge)}
                size="sm"
                variant={isActive && variant === 'pills' ? 'outline' : 'subtle'}
                type="neutral"
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
