import { ReactNode } from 'react';
import Card from '../common/Card';
import { useTheme } from '../../contexts/ThemeContext';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function ChartCard({ title, description, children, actions }: ChartCardProps) {
  const { theme } = useTheme();

  return (
    <Card
      title={title}
      footer={actions}
    >
      {description && (
        <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>
          {description}
        </p>
      )}
      <div className="w-full h-64">
        {children}
      </div>
    </Card>
  );
}
