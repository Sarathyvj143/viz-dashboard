import { ReactNode } from 'react';
import Card from '../common/Card';

interface DashboardCardProps {
  title: string;
  description?: string;
  onClick?: () => void;
  actions?: ReactNode;
}

export default function DashboardCard({ title, description, onClick, actions }: DashboardCardProps) {
  return (
    <Card
      title={title}
      footer={actions}
      className={onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}
    >
      <div onClick={onClick}>
        {description && (
          <p className="text-gray-600">{description}</p>
        )}
        {!description && (
          <p className="text-gray-400 italic">No description</p>
        )}
      </div>
    </Card>
  );
}
