import Header from '../components/layout/Header';
import ChartBuilderWizard from '../components/charts/ChartBuilderWizard';
import { useTheme } from '../contexts/ThemeContext';

export default function ChartCreate() {
  const { theme } = useTheme();

  return (
    <div style={{ backgroundColor: theme.colors.bgPrimary, minHeight: '100vh' }}>
      <Header
        title="Create Chart"
        subtitle="Build a new chart from your data sources or virtual datasets"
      />
      <div className="p-3 sm:p-4 md:p-6 w-full">
        <ChartBuilderWizard />
      </div>
    </div>
  );
}
