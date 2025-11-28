import { ReactNode } from 'react';
import Card from '../common/Card';
import { useTheme } from '../../contexts/ThemeContext';

interface DashboardCardProps {
  title: string;
  description?: string;
  onClick?: () => void;
  actions?: ReactNode;
}

export default function DashboardCard({ title, description, onClick, actions }: DashboardCardProps) {
  const { theme } = useTheme();

  return (
    <Card
      title={title}
      footer={actions}
      className={onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}
    >
      <div onClick={onClick}>
        {description && (
          <p style={{ color: theme.colors.textSecondary }}>{description}</p>
        )}
        {!description && (
          <p className="italic" style={{ color: theme.colors.textTertiary }}>No description</p>
        )}
      </div>
    </Card>
  );
}
