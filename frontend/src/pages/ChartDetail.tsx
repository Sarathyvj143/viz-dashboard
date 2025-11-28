import { useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/layout/Header';

export default function ChartDetail() {
  const { id } = useParams();
  const { theme } = useTheme();

  return (
    <div style={{ backgroundColor: theme.colors.bgPrimary, minHeight: '100vh' }}>
      <Header
        title={`Chart ${id || ''}`}
        subtitle="View and edit chart configuration"
      />
      <div className="p-3 sm:p-4 md:p-6 w-full">
        <p className="text-sm sm:text-base" style={{ color: theme.colors.textSecondary }}>Chart detail page placeholder</p>
      </div>
    </div>
  );
}
