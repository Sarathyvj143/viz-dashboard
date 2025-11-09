interface ChartRendererProps {
  type: string;
  data: unknown;
  config?: Record<string, unknown>;
}

export default function ChartRenderer({ type }: ChartRendererProps) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
      <p className="text-gray-500">
        Chart Renderer: {type} (placeholder)
      </p>
    </div>
  );
}
