import { ReactNode } from 'react';
import Card from '../common/Card';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function ChartCard({ title, description, children, actions }: ChartCardProps) {
  return (
    <Card
      title={title}
      footer={actions}
    >
      {description && (
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      )}
      <div className="w-full h-64">
        {children}
      </div>
    </Card>
  );
}
