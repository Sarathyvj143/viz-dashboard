export const CHART_TYPES = [
  { id: 'bar', name: 'Bar Chart', icon: '📊' },
  { id: 'line', name: 'Line Chart', icon: '📈' },
  { id: 'pie', name: 'Pie Chart', icon: '🥧' },
  { id: 'area', name: 'Area Chart', icon: '📉' },
  { id: 'scatter', name: 'Scatter Plot', icon: '⚫' },
] as const;

export default function ChartTypes() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {CHART_TYPES.map((chart) => (
        <button
          key={chart.id}
          className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <div className="text-3xl mb-2">{chart.icon}</div>
          <div className="text-sm font-medium">{chart.name}</div>
        </button>
      ))}
    </div>
  );
}
