import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { getDefaultChartColors } from '../../constants/themes';
import { ChartType, ChartConfig } from '../../types/chart';
import { Theme } from '../../types/theme';

// Chart data point interface
interface ChartDataPoint {
  [key: string]: string | number | boolean | null | undefined;
}

interface ChartRendererProps {
  type: ChartType;
  data: ChartDataPoint[];
  config?: ChartConfig;
  height?: number;
  title?: string;
}

// Custom themed tooltip component
const CustomTooltip = ({ active, payload, label, theme }: {
  active?: boolean;
  payload?: unknown;
  label?: unknown;
  theme: Theme;
}): JSX.Element | null => {
  if (!active || !payload) return null;

  // Type guard for payload array
  const payloadArray = Array.isArray(payload) ? payload : [];
  if (payloadArray.length === 0) return null;

  return (
    <div
      className="p-3 rounded-lg shadow-lg"
      style={{
        backgroundColor: theme.colors.bgSecondary,
        borderColor: theme.colors.borderPrimary,
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
    >
      <p
        className="font-semibold mb-2"
        style={{ color: theme.colors.textPrimary }}
      >
        {String(label || '')}
      </p>
      {payloadArray.map((entry: Record<string, unknown>, index: number) => (
        <p
          key={`item-${index}`}
          className="text-sm"
          style={{ color: (entry.color as string) || theme.colors.textSecondary }}
        >
          {String(entry.name || '')}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : String(entry.value || '')}
        </p>
      ))}
    </div>
  );
};

export default function ChartRenderer({
  type,
  data,
  config = {},
  height = 300,
  title,
}: ChartRendererProps) {
  const { theme, currentTheme, customColors } = useTheme();

  // Memoize chart colors to prevent recalculation on every render
  const chartColors = useMemo(
    () => config.colors || getDefaultChartColors(currentTheme, customColors),
    [config.colors, currentTheme, customColors]
  );

  // Memoize data keys to prevent recalculation
  const dataKeys = useMemo(
    () => data.length > 0
      ? Object.keys(data[0]).filter(key => key !== (config.xAxis || 'name'))
      : [],
    [data, config.xAxis]
  );

  // Memoize style objects to prevent Recharts re-renders
  const axisStyle = useMemo(
    () => ({
      stroke: theme.colors.borderPrimary,
      fill: theme.colors.textSecondary,
      fontSize: 12,
    }),
    [theme.colors.borderPrimary, theme.colors.textSecondary]
  );

  const gridStyle = useMemo(
    () => ({
      stroke: theme.colors.borderSecondary,
      strokeDasharray: '3 3',
    }),
    [theme.colors.borderSecondary]
  );

  // Memoize common props
  const commonProps = useMemo(
    () => ({
      data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    }),
    [data]
  );

  // Validate data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center rounded-lg p-8"
        style={{
          backgroundColor: theme.colors.bgSecondary,
          borderColor: theme.colors.borderPrimary,
          borderWidth: '1px',
          borderStyle: 'solid',
          height: `${height}px`,
        }}
      >
        <p style={{ color: theme.colors.textSecondary }}>
          No data available
        </p>
      </div>
    );
  }

  // Render chart based on type
  const renderChart = (): JSX.Element => {
    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {config.grid && <CartesianGrid {...gridStyle} />}
            <XAxis
              dataKey={config.xAxis || 'name'}
              {...axisStyle}
            />
            <YAxis {...axisStyle} />
            <Tooltip content={(props) => <CustomTooltip {...props} theme={theme} />} />
            {config.legend && (
              <Legend
                wrapperStyle={{ color: theme.colors.textSecondary }}
              />
            )}
            {dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={chartColors[index % chartColors.length]}
                strokeWidth={2}
                dot={{ fill: chartColors[index % chartColors.length] }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {config.grid && <CartesianGrid {...gridStyle} />}
            <XAxis
              dataKey={config.xAxis || 'name'}
              {...axisStyle}
            />
            <YAxis {...axisStyle} />
            <Tooltip content={(props) => <CustomTooltip {...props} theme={theme} />} />
            {config.legend && (
              <Legend
                wrapperStyle={{ color: theme.colors.textSecondary }}
              />
            )}
            {dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={chartColors[index % chartColors.length]}
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {config.grid && <CartesianGrid {...gridStyle} />}
            <XAxis
              dataKey={config.xAxis || 'name'}
              {...axisStyle}
            />
            <YAxis {...axisStyle} />
            <Tooltip content={(props) => <CustomTooltip {...props} theme={theme} />} />
            {config.legend && (
              <Legend
                wrapperStyle={{ color: theme.colors.textSecondary }}
              />
            )}
            {dataKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                fill={chartColors[index % chartColors.length]}
                stroke={chartColors[index % chartColors.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        // For pie charts, use the first data key as the value
        const valueKey = dataKeys[0] || 'value';
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey={config.xAxis || 'name'}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(dataEntry) => {
                const nameKey = config.xAxis || 'name';
                return String(dataEntry.name || dataEntry[nameKey] || '');
              }}
              labelLine={{ stroke: theme.colors.textSecondary }}
            >
              {data.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
            <Tooltip content={(props) => <CustomTooltip {...props} theme={theme} />} />
            {config.legend && (
              <Legend
                wrapperStyle={{ color: theme.colors.textSecondary }}
              />
            )}
          </PieChart>
        );

      case 'scatter':
        const xKey = config.xAxis || dataKeys[0] || 'x';
        const yKey = config.yAxis || dataKeys[1] || 'y';
        return (
          <ScatterChart {...commonProps}>
            {config.grid && <CartesianGrid {...gridStyle} />}
            <XAxis
              dataKey={xKey}
              {...axisStyle}
              type="number"
            />
            <YAxis
              dataKey={yKey}
              {...axisStyle}
              type="number"
            />
            <Tooltip content={(props) => <CustomTooltip {...props} theme={theme} />} />
            {config.legend && (
              <Legend
                wrapperStyle={{ color: theme.colors.textSecondary }}
              />
            )}
            <Scatter
              name="Data"
              data={data}
              fill={chartColors[0]}
            />
          </ScatterChart>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: theme.colors.textSecondary }}>
              Unsupported chart type: {type}
            </p>
          </div>
        );
    }
  };

  return (
    <div
      className="p-4 rounded-lg"
      style={{
        backgroundColor: theme.colors.bgSecondary,
        borderColor: theme.colors.borderPrimary,
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
    >
      {title && (
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: theme.colors.textPrimary }}
        >
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
