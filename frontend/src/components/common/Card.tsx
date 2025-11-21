import { ReactNode } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}

export default function Card({ title, children, className = '', footer }: CardProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles();

  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${className}`} style={{ backgroundColor: theme.colors.bgPrimary }}>
      {title && (
        <div className="px-6 py-4" style={styles.borderBottom()}>
          <h3 className="text-lg font-semibold" style={styles.heading.primary}>{title}</h3>
        </div>
      )}
      <div className="px-6 py-4">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4" style={{ backgroundColor: theme.colors.bgSecondary, ...styles.borderTop() }}>
          {footer}
        </div>
      )}
    </div>
  );
}
