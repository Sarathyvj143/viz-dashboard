import React, { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { withOpacity } from '../../utils/colorHelpers';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Icon } from './Icon';
import EmptyState from './EmptyState';

export interface Column<T> {
  /** Unique key for column */
  key: string;

  /** Column header label */
  label: string;

  /** Custom cell renderer */
  render?: (row: T) => React.ReactNode;

  /** Enable sorting */
  sortable?: boolean;

  /** Column width (CSS value) */
  width?: string;

  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  /** Column definitions */
  columns: Column<T>[];

  /** Data rows */
  data: T[];

  /** Row click handler */
  onRowClick?: (row: T) => void;

  /** Loading state */
  loading?: boolean;

  /** Empty state component */
  emptyState?: React.ReactNode;

  /** Default sort column */
  defaultSortKey?: string;

  /** Default sort direction */
  defaultSortDirection?: 'asc' | 'desc';

  /** Additional CSS classes */
  className?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  loading,
  emptyState,
  defaultSortKey,
  defaultSortDirection = 'asc',
  className = '',
}: TableProps<T>) {
  const { theme } = useTheme();
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;

      // Handle null/undefined
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // String comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      // Numeric comparison
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDirection]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: theme.colors.textSecondary }}>
        Loading...
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={({ className, style }) => (
          <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
        title="No data"
        description="No records to display"
      />
    );
  }

  const styles = {
    container: {
      overflowX: 'auto' as const,
      borderRadius: '0.5rem',
      border: `1px solid ${theme.colors.borderPrimary}`,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
    },
    thead: {
      backgroundColor: theme.colors.bgTertiary,
    },
    th: {
      padding: '0.75rem 1.5rem',
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      color: theme.colors.textSecondary,
    },
    thContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    tbody: {
      backgroundColor: theme.colors.bgPrimary,
    },
    tr: {
      borderBottom: `1px solid ${theme.colors.borderPrimary}`,
      transition: 'background-color 0.2s',
    },
    td: {
      padding: '1rem 1.5rem',
      color: theme.colors.textPrimary,
    },
  };

  return (
    <div style={styles.container} className={className}>
      <table style={styles.table}>
        <thead style={styles.thead}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  ...styles.th,
                  textAlign: column.align || 'left',
                  width: column.width,
                  cursor: column.sortable ? 'pointer' : 'default',
                }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div
                  style={{
                    ...styles.thContent,
                    justifyContent:
                      column.align === 'right'
                        ? 'flex-end'
                        : column.align === 'center'
                        ? 'center'
                        : 'flex-start',
                  }}
                >
                  <span>{column.label}</span>
                  {column.sortable && sortKey === column.key && (
                    <Icon
                      Icon={sortDirection === 'asc' ? ChevronUpIcon : ChevronDownIcon}
                      variant="accent"
                      size="xs"
                    />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={styles.tbody}>
          {sortedData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              style={{
                ...styles.tr,
                cursor: onRowClick ? 'pointer' : 'default',
              }}
              onClick={() => onRowClick?.(row)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = withOpacity(
                  theme.colors.accentPrimary,
                  5
                );
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  style={{
                    ...styles.td,
                    textAlign: column.align || 'left',
                  }}
                >
                  {column.render ? column.render(row) : String(row[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
