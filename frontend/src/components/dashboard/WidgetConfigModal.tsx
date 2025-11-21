import { useState, useEffect, useMemo } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useChartStore } from '../../store/chartStore';
import DataSourceQuickCreate from '../dataSources/DataSourceQuickCreate';
import { ChevronDownIcon, ChevronUpIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';
import { useThemedHover } from '../../hooks/useThemedHover';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { withOpacity } from '../../utils/colorHelpers';

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
  const { theme } = useTheme();
  const styles = useThemedStyles();
  const [selectedChartId, setSelectedChartId] = useState<string | null>(currentChartId || null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Memoized hover handler for toggle button
  const toggleButtonHover = useThemedHover({
    hoverOpacity: 0.8,
  });

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

  // Memoize filtered charts to prevent recalculation on every render
  const filteredCharts = useMemo(
    () =>
      (charts || []).filter(
        (chart) =>
          chart.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          chart.description?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [charts, searchTerm]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Widget"
    >
      <div className="space-y-4">
        {/* Quick Create Data Source Section */}
        <div className="pb-4" style={styles.borderBottom()}>
          <button
            type="button"
            onClick={() => setShowQuickCreate(!showQuickCreate)}
            className="text-sm font-medium flex items-center w-full"
            style={styles.text.accent}
            {...toggleButtonHover}
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
            <div className="mt-3 p-4 rounded-lg" style={styles.statusBox('info')}>
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
          <label className="block text-sm font-medium mb-2" style={styles.text.primary}>
            Select Chart *
          </label>

          {isLoading ? (
            <div className="flex items-center justify-center p-8 rounded-md" style={styles.bg.tertiary}>
              <div
                className="animate-spin rounded-full h-6 w-6 mr-2"
                style={{
                  borderBottomColor: theme.colors.accentPrimary,
                  borderBottomWidth: '2px',
                  borderBottomStyle: 'solid',
                }}
              ></div>
              <span className="text-sm" style={styles.text.secondary}>Loading charts...</span>
            </div>
          ) : (charts || []).length === 0 ? (
            <div className="text-center py-8 px-4 rounded-md" style={styles.statusBox('warning')}>
              <ChartBarIcon className="mx-auto h-12 w-12 mb-2" style={styles.text.warning} />
              <p className="text-sm font-medium mb-1" style={styles.text.warning}>No Charts Available</p>
              <p className="text-xs mb-3" style={styles.text.warning}>
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
                className="w-full mb-3 px-3 py-2 rounded-md focus:outline-none"
                style={styles.input}
              />

              {/* Chart List */}
              <div className="max-h-80 overflow-y-auto space-y-2 rounded-md p-2" style={{ ...styles.bg.tertiary, ...styles.border.primary }}>
                {filteredCharts.length === 0 ? (
                  <div className="text-center py-8 text-sm" style={styles.text.secondary}>
                    No charts match your search
                  </div>
                ) : (
                  filteredCharts.map((chart) => {
                    const isSelected = selectedChartId === chart.id;
                    return (
                      <ChartButton
                        key={chart.id}
                        chart={chart}
                        isSelected={isSelected}
                        onSelect={setSelectedChartId}
                        theme={theme}
                        styles={styles}
                      />
                    );
                  })
                )}
              </div>

              <p className="text-xs mt-2" style={styles.text.secondary}>
                {filteredCharts.length} of {(charts || []).length} chart{(charts || []).length !== 1 ? 's' : ''} shown
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4" style={styles.borderTop()}>
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

// Memoized chart button component for better performance
interface ChartButtonProps {
  chart: { id: string; name: string; description?: string; type: string };
  isSelected: boolean;
  onSelect: (id: string) => void;
  theme: { colors: { accentPrimary: string; bgSecondary: string; bgTertiary: string; borderPrimary: string; textPrimary: string; textSecondary: string } };
  styles: ReturnType<typeof useThemedStyles>;
}

function ChartButton({ chart, isSelected, onSelect, theme, styles }: ChartButtonProps) {
  const chartButtonHover = useThemedHover({
    hoverBg: theme.colors.bgTertiary,
    normalBg: theme.colors.bgSecondary,
    condition: !isSelected,
  });

  return (
    <button
      type="button"
      onClick={() => onSelect(chart.id)}
      className="w-full text-left p-3 rounded-md transition-all duration-200"
      style={{
        backgroundColor: isSelected ? withOpacity(theme.colors.accentPrimary, 20) : theme.colors.bgSecondary,
        borderColor: isSelected ? theme.colors.accentPrimary : theme.colors.borderPrimary,
        borderWidth: '2px',
        borderStyle: 'solid',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
      }}
      {...(!isSelected ? chartButtonHover : {})}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold truncate" style={styles.text.primary}>
            {chart.name}
          </h4>
          {chart.description && (
            <p className="text-xs mt-1 line-clamp-2" style={styles.text.secondary}>
              {chart.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full" style={styles.bg.tertiary}>
              <span style={styles.text.secondary}>{chart.type}</span>
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
