import Header from '../components/layout/Header';
import ChartBuilder from '../components/charts/ChartBuilder';

export default function ChartCreate() {
  return (
    <div>
      <Header
        title="Create Chart"
        subtitle="Build a new chart from your data sources"
      />
      <div className="p-6">
        <ChartBuilder />
      </div>
    </div>
  );
}
