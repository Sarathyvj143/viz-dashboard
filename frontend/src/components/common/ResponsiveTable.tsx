import { ReactNode } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { withOpacity } from '../../utils/colorHelpers';

export interface ResponsiveTableColumn<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;

  // Desktop column width configuration
  width?: string;      // Preferred width (e.g., '200px', '20%') - works best with tableLayout: 'auto'
  minWidth?: string;   // Minimum width before scrolling (e.g., '100px')
  maxWidth?: string;   // Maximum width to prevent overflow

  // Responsive configuration
  hideOnMobile?: boolean;  // Hide this column in mobile card view
  align?: 'left' | 'center' | 'right';
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: ResponsiveTableColumn<T>[];

  // Mobile card rendering (optional - auto-generates from columns if not provided)
  mobileCardRender?: (item: T) => ReactNode;

  // Row interactions
  getRowKey: (item: T) => string | number;
  onRowClick?: (item: T) => void;

  // Loading and empty states
  loading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;

  // Container customization
  containerClassName?: string;    // CSS classes for outer container
  containerStyle?: React.CSSProperties;  // Inline styles for outer container
  className?: string;  // CSS classes for inner table/card container
}

export default function ResponsiveTable<T extends object>({
  data,
  columns,
  mobileCardRender,
  getRowKey,
  onRowClick,
  loading = false,
  loadingMessage = 'Loading...',
  emptyMessage = 'No data available',
  containerClassName = '',
  containerStyle,
  className = ''
}: ResponsiveTableProps<T>) {
  const { theme } = useTheme();
  const styles = useThemedStyles();

  // Auto-generate mobile card render if not provided
  const defaultMobileCardRender = (item: T): ReactNode => (
    <div className="space-y-2">
      {columns.filter(col => !col.hideOnMobile).map((col) => (
        <div key={col.key}>
          <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
            {col.label}
          </div>
          <div className="text-sm" style={{ color: theme.colors.textPrimary }}>
            {col.render(item)}
          </div>
        </div>
      ))}
    </div>
  );

  const renderMobileCard = mobileCardRender || defaultMobileCardRender;

  // Loading state
  if (loading) {
    return (
      <div className="p-8 sm:p-12 text-center text-sm sm:text-base" style={{ color: theme.colors.textSecondary }}>
        {loadingMessage}
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="p-8 sm:p-12 text-center text-sm sm:text-base" style={{ color: theme.colors.textSecondary }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={containerClassName} style={containerStyle}>
      {/* Mobile view - Cards */}
      <div className={`block md:hidden space-y-3 sm:space-y-4 p-3 sm:p-4 ${className}`}>
        {data.map((item) => {
          const key = getRowKey(item);
          return (
            <div
              key={key}
              className="rounded-lg p-3 sm:p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              style={{
                backgroundColor: theme.colors.bgSecondary,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: theme.colors.borderPrimary
              }}
              onClick={() => onRowClick?.(item)}
              role="article"
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onRowClick(item);
                }
              }}
            >
              {renderMobileCard(item)}
            </div>
          );
        })}
      </div>

      {/* Desktop view - Table */}
      <div className={`hidden md:block overflow-x-auto ${className}`}>
        {/*
          Using tableLayout: 'auto' for flexible column sizing.
          - 'width' is a suggestion, browser may adjust based on content
          - 'minWidth' is enforced and prevents columns from shrinking too small
          - For fixed percentage widths, switch to tableLayout: 'fixed'
        */}
        <table className="min-w-full w-full" style={{ tableLayout: 'auto' }}>
          <colgroup>
            {columns.map((col) => (
              <col
                key={col.key}
                style={{
                  width: col.width || 'auto',
                  minWidth: col.minWidth,
                  maxWidth: col.maxWidth
                }}
              />
            ))}
          </colgroup>
          <thead style={styles.table.header}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{
                    ...styles.table.headerCell,
                    textAlign: col.align || 'left'
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={styles.table.body}>
            {data.map((item) => {
              const key = getRowKey(item);

              return (
                <tr
                  key={key}
                  style={styles.table.row}
                  onMouseEnter={(e) => {
                    if (onRowClick) {
                      e.currentTarget.style.backgroundColor = withOpacity(theme.colors.bgSecondary, 50);
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (onRowClick) {
                      e.currentTarget.style.backgroundColor = '';
                    }
                  }}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? 'cursor-pointer transition-colors' : ''}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? 'button' : undefined}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onRowClick(item);
                    }
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-4"
                      style={{ textAlign: col.align || 'left' }}
                    >
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
