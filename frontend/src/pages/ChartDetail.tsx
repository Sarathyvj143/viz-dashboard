import { useParams } from 'react-router-dom';
import Header from '../components/layout/Header';

export default function ChartDetail() {
  const { id } = useParams();

  return (
    <div>
      <Header
        title={`Chart ${id || ''}`}
        subtitle="View and edit chart configuration"
      />
      <div className="p-6">
        <p className="text-gray-600">Chart detail page placeholder</p>
      </div>
    </div>
  );
}
