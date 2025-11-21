import { useState } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import { PlusIcon, TrashIcon, Cog6ToothIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import WidgetConfigModal from './WidgetConfigModal';
import { useContainerWidth } from '../../hooks/useContainerWidth';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

export interface DashboardWidget extends Layout {
  chartId?: string;
}

interface DashboardBuilderProps {
  initialLayout: DashboardWidget[];
  onLayoutChange: (layout: DashboardWidget[]) => void;
  onSave: () => void;
  saving?: boolean;
}

export default function DashboardBuilder({
  initialLayout,
  onLayoutChange,
  onSave,
  saving = false,
}: DashboardBuilderProps) {
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

  // Use custom hook for container width measurement with debouncing
  const [containerRef, containerWidth] = useContainerWidth<HTMLDivElement>({
    debounce: 150,
    threshold: 10,
    initialWidth: 1200,
  });

  const handleLayoutChange = (newLayout: Layout[]) => {
    // Preserve chartId when layout changes
    const updatedLayout = newLayout.map((item) => {
      const existingWidget = initialLayout.find((w) => w.i === item.i);
      return {
        ...item,
        chartId: existingWidget?.chartId,
      } as DashboardWidget;
    });
    onLayoutChange(updatedLayout);
  };

  const addWidget = () => {
    const newWidget: DashboardWidget = {
      i: `widget-${Date.now()}`,
      x: (initialLayout.length * 2) % 12,
      y: Infinity, // puts it at the bottom
      w: 4,
      h: 4,
    };
    const newLayout = [...initialLayout, newWidget];
    onLayoutChange(newLayout);
  };

  const removeWidget = (widgetId: string) => {
    const newLayout = initialLayout.filter((item) => item.i !== widgetId);
    onLayoutChange(newLayout);
  };

  const configureWidget = (widgetId: string) => {
    setSelectedWidgetId(widgetId);
    setConfigModalOpen(true);
  };

  const handleSaveWidgetConfig = (chartId: string) => {
    if (selectedWidgetId) {
      const updatedLayout = initialLayout.map((widget) => {
        if (widget.i === selectedWidgetId) {
          return { ...widget, chartId };
        }
        return widget;
      });
      onLayoutChange(updatedLayout);
      setSelectedWidgetId(null);
    }
  };

  const getWidgetChart = (widgetId: string) => {
    return initialLayout.find((w) => w.i === widgetId)?.chartId;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Dashboard Layout</h3>
          <p className="text-sm text-gray-500">
            Drag and resize widgets to customize your dashboard layout
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addWidget} variant="secondary" className="flex-1 sm:flex-initial">
            <PlusIcon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Add Widget</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <Button onClick={onSave} disabled={saving} className="flex-1 sm:flex-initial">
            {saving ? 'Saving...' : 'Save Layout'}
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-2 sm:p-4 min-h-[400px] sm:min-h-[600px]">
        <GridLayout
          className="layout"
          layout={initialLayout}
          cols={12}
          rowHeight={30}
          width={containerWidth}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".drag-handle"
          compactType="vertical"
          preventCollision={false}
        >
          {initialLayout.map((item) => (
            <div
              key={item.i}
              className="bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-full flex flex-col">
                <div className="drag-handle bg-gray-100 border-b border-gray-200 px-2 sm:px-4 py-2 cursor-move flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                    {item.chartId ? `Chart Widget #${item.chartId}` : 'Unconfigured Widget'}
                  </span>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => configureWidget(item.i)}
                      className="text-blue-600 hover:text-blue-700 p-1"
                      title="Configure widget"
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeWidget(item.i)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Remove widget"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-2 sm:p-4 flex items-center justify-center">
                  {item.chartId ? (
                    <div className="text-center text-gray-700">
                      <ChartBarIcon className="h-8 sm:h-12 w-8 sm:w-12 mx-auto text-blue-600 mb-2" />
                      <p className="text-xs sm:text-sm font-medium">Chart #{item.chartId}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Size: {item.w} x {item.h}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <ChartBarIcon className="h-8 sm:h-12 w-8 sm:w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-xs sm:text-sm">No chart selected</p>
                      <button
                        type="button"
                        onClick={() => configureWidget(item.i)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Configure Widget
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </GridLayout>

        {initialLayout.length === 0 && (
          <div className="flex items-center justify-center h-[500px]">
            <div className="text-center">
              <p className="text-gray-500">No widgets yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Click "Add Widget" to start building your dashboard
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Widget Configuration Modal */}
      <WidgetConfigModal
        isOpen={configModalOpen}
        onClose={() => {
          setConfigModalOpen(false);
          setSelectedWidgetId(null);
        }}
        onSave={handleSaveWidgetConfig}
        currentChartId={selectedWidgetId ? getWidgetChart(selectedWidgetId) : undefined}
      />
    </div>
  );
}
