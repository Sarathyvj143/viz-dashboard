import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useChartStore } from '../../store/chartStore';
import { Chart } from '../../types/chart';
import DataSourceQuickCreate from '../dataSources/DataSourceQuickCreate';
import { ChevronDownIcon, ChevronUpIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface WidgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (chartId: string) => void;
  currentChartId?: string;
}

export default function WidgetConfigModal({
  isOpen,
  onClose,
  onSave,
  currentChartId,
}: WidgetConfigModalProps) {
  const { charts, isLoading, fetchCharts } = useChartStore();
  const [selectedChartId, setSelectedChartId] = useState<string | null>(currentChartId || null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCharts();
    }
  }, [isOpen, fetchCharts]);

  useEffect(() => {
    if (currentChartId) {
      setSelectedChartId(currentChartId);
    }
  }, [currentChartId]);

  const handleSave = () => {
    if (selectedChartId) {
      onSave(selectedChartId);
      onClose();
    }
  };

  const handleDataSourceCreated = () => {
    // After data source is created, user can create charts
    setShowQuickCreate(false);
  };

  const filteredCharts = charts.filter((chart) =>
    chart.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chart.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Widget"
    >
      <div className="space-y-4">
        {/* Quick Create Data Source Section */}
        <div className="border-b pb-4">
          <button
            type="button"
            onClick={() => setShowQuickCreate(!showQuickCreate)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center w-full"
          >
            {showQuickCreate ? (
              <>
                <ChevronUpIcon className="w-4 h-4 mr-1" />
                Hide Data Source Quick Create
              </>
            ) : (
              <>
                <ChevronDownIcon className="w-4 h-4 mr-1" />
                Need a Data Source? Create One
              </>
            )}
          </button>

          {showQuickCreate && (
            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <DataSourceQuickCreate
                embedded={true}
                onCreated={handleDataSourceCreated}
                onCancel={() => setShowQuickCreate(false)}
              />
            </div>
          )}
        </div>

        {/* Chart Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Chart *
          </label>

          {isLoading ? (
            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-md">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm text-gray-600">Loading charts...</span>
            </div>
          ) : charts.length === 0 ? (
            <div className="text-center py-8 px-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <ChartBarIcon className="mx-auto h-12 w-12 text-yellow-600 mb-2" />
              <p className="text-sm text-yellow-900 font-medium mb-1">No Charts Available</p>
              <p className="text-xs text-yellow-800 mb-3">
                Create charts first to add them to your dashboard
              </p>
              <Button size="sm" onClick={() => window.open('/charts/new', '_blank')}>
                Create Chart
              </Button>
            </div>
          ) : (
            <>
              {/* Search */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search charts..."
                className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Chart List */}
              <div className="max-h-80 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-2 bg-gray-50">
                {filteredCharts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No charts match your search
                  </div>
                ) : (
                  filteredCharts.map((chart) => (
                    <button
                      key={chart.id}
                      type="button"
                      onClick={() => setSelectedChartId(chart.id)}
                      className={`w-full text-left p-3 rounded-md border-2 transition-all duration-200 ${
                        selectedChartId === chart.id
                          ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 hover:scale-[1.01] hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {chart.name}
                          </h4>
                          {chart.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {chart.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                              {chart.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                {filteredCharts.length} of {charts.length} chart{charts.length !== 1 ? 's' : ''} shown
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!selectedChartId || isLoading}
          >
            Save Widget
          </Button>
        </div>
      </div>
    </Modal>
  );
}
