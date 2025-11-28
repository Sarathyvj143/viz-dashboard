import Header from '../components/layout/Header';
import ChartBuilder from '../components/charts/ChartBuilder';
import { useTheme } from '../contexts/ThemeContext';

export default function ChartCreate() {
  const { theme } = useTheme();

  return (
    <div style={{ backgroundColor: theme.colors.bgPrimary, minHeight: '100vh' }}>
      <Header
        title="Create Chart"
        subtitle="Build a new chart from your data sources"
      />
      <div className="p-3 sm:p-4 md:p-6 w-full">
        <ChartBuilder />
      </div>
    </div>
  );
}
