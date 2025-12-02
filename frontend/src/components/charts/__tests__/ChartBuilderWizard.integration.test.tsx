/**
 * Integration tests for ChartBuilderWizard component
 *
 * These tests verify the complete chart creation workflow through the wizard,
 * including dataset selection, configuration, and saving.
 */
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ChartBuilderWizard from '../ChartBuilderWizard';
import { useChartStore } from '../../../store/chartStore';
import { useToastStore } from '../../../store/toastStore';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { Dataset } from '../../../types/dataset';
import { Chart } from '../../../types/chart';

// Mock stores
vi.mock('../../../store/chartStore');
vi.mock('../../../store/toastStore');
vi.mock('../../../store/connectionStore', () => ({
  useConnectionStore: vi.fn(() => ({
    connections: [],
  })),
}));

// Mock API modules
vi.mock('../../../api/theme', () => ({
  themeApi: {
    getTheme: vi.fn().mockResolvedValue({
      theme: 'light',
      customColors: null,
    }),
    updateTheme: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock child components that might have complex dependencies
vi.mock('../prototypes/DatasetSelector', () => ({
  default: ({ onDatasetSelect }: { onDatasetSelect: (dataset: Dataset) => void }) => (
    <div data-testid="dataset-selector">
      <button
        onClick={() =>
          onDatasetSelect({
            id: 1,
            name: 'Test Dataset',
            type: 'physical',
            columns: [
              { name: 'date', type: 'string', nullable: false },
              { name: 'revenue', type: 'float', nullable: false },
              { name: 'region', type: 'string', nullable: false },
            ],
            previewData: [
              { date: '2024-01', revenue: 1000, region: 'North' },
              { date: '2024-02', revenue: 1500, region: 'South' },
            ],
          })
        }
      >
        Select Test Dataset
      </button>
    </div>
  ),
}));

// Mock ChartRenderer to avoid Recharts complexity in tests
vi.mock('../ChartRenderer', () => ({
  default: ({ type, data }: { type: string; data: unknown[] }) => (
    <div data-testid="chart-renderer">
      Chart Type: {type}, Data Length: {Array.isArray(data) ? data.length : 0}
    </div>
  ),
}));

// Helper to render component with all required providers
function renderWithProviders(ui: React.ReactElement) {
  const mockNavigate = vi.fn();

  return {
    ...render(
      <MemoryRouter initialEntries={['/charts/new']}>
        <ThemeProvider>
          <Routes>
            <Route path="/charts/new" element={ui} />
            <Route path="/charts" element={<div>Charts List Page</div>} />
          </Routes>
        </ThemeProvider>
      </MemoryRouter>
    ),
    mockNavigate,
  };
}

describe('ChartBuilderWizard Integration Tests', () => {
  let mockCreateChart: Mock;
  let mockShowToast: Mock;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup chart store mock
    mockCreateChart = vi.fn();
    (useChartStore as unknown as Mock).mockReturnValue({
      charts: [],
      currentChart: null,
      isLoading: false,
      error: null,
      createChart: mockCreateChart,
      fetchCharts: vi.fn(),
      fetchChart: vi.fn(),
      updateChart: vi.fn(),
      deleteChart: vi.fn(),
      clearError: vi.fn(),
    });

    // Setup toast store mock
    mockShowToast = vi.fn();
    (useToastStore as unknown as Mock).mockReturnValue({
      toasts: [],
      showToast: mockShowToast,
      removeToast: vi.fn(),
    });
  });

  it('should complete happy path: dataset selection → configuration → preview → save', async () => {
    const user = userEvent.setup();

    // Mock successful chart creation
    const mockChart: Chart = {
      id: '123',
      name: 'Revenue by Region',
      description: 'Monthly revenue analysis',
      type: 'bar',
      dataSourceId: '1',
      query: 'SELECT * FROM Test Dataset',
      config: {
        xAxis: 'region',
        yAxis: 'revenue',
        colors: ['#3b82f6'],
        legend: true,
        grid: true,
      },
      createdBy: 'test-user-id',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockCreateChart.mockResolvedValue(mockChart);

    renderWithProviders(<ChartBuilderWizard />);

    // STEP 1: Dataset Selection
    // Verify we're on the dataset selection step
    expect(screen.getByText('Select Dataset')).toBeInTheDocument();
    expect(screen.getByTestId('dataset-selector')).toBeInTheDocument();

    // Select a dataset
    const selectButton = screen.getByRole('button', { name: /select test dataset/i });
    await user.click(selectButton);

    // STEP 2: Chart Configuration
    // Wait for navigation to configuration step
    await waitFor(() => {
      expect(screen.getByText('Configure Chart')).toBeInTheDocument();
    });

    // Fill in chart name (query by placeholder since label doesn't have proper htmlFor)
    const nameInput = screen.getByPlaceholderText(/enter chart name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Revenue by Region');

    // Fill in description (optional field)
    const descriptionInput = screen.getByPlaceholderText(/enter chart description/i);
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Monthly revenue analysis');

    // Chart type defaults to 'bar', no need to change it

    // Select X-axis using custom Dropdown component
    // The Dropdown uses a combobox pattern, so we need to click to open it first
    const xAxisLabel = screen.getByText(/x-axis column/i);
    const xAxisDropdown = xAxisLabel.closest('div')?.querySelector('[role="combobox"]');
    expect(xAxisDropdown).toBeDefined();
    await user.click(xAxisDropdown!);

    // Wait for dropdown menu to open and select option
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    const xAxisOption = screen.getByRole('option', { name: /region/i });
    await user.click(xAxisOption);

    // Select Y-axis using custom Dropdown component
    const yAxisLabel = screen.getByText(/y-axis column/i);
    const yAxisDropdown = yAxisLabel.closest('div')?.querySelector('[role="combobox"]');
    expect(yAxisDropdown).toBeDefined();
    await user.click(yAxisDropdown!);

    // Wait for dropdown menu to open and select option
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    const yAxisOption = screen.getByRole('option', { name: /revenue/i });
    await user.click(yAxisOption);

    // Click continue button to go to preview step
    const continueButton = screen.getByRole('button', { name: /preview chart/i });
    await user.click(continueButton);

    // STEP 3: Preview & Save
    // Wait for preview step to load
    await waitFor(() => {
      expect(screen.getByText('Preview & Save')).toBeInTheDocument();
    });

    // Verify form data is displayed in preview
    expect(screen.getByText('Revenue by Region')).toBeInTheDocument();
    expect(screen.getByText('Monthly revenue analysis')).toBeInTheDocument();

    // Click save button
    const saveButton = screen.getByRole('button', { name: /save chart/i });
    await user.click(saveButton);

    // Verify chart creation was called with correct data
    await waitFor(() => {
      expect(mockCreateChart).toHaveBeenCalledTimes(1);
    });

    expect(mockCreateChart).toHaveBeenCalledWith({
      name: 'Revenue by Region',
      description: 'Monthly revenue analysis',
      type: 'bar',
      dataSourceId: '1',
      query: 'SELECT * FROM Test Dataset',
      config: expect.objectContaining({
        xAxis: 'region',
        yAxis: 'revenue',
        legend: true,
        grid: true,
      }),
    });

    // Verify success toast was shown
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringMatching(/chart created successfully/i),
        'success'
      );
    });

    // Verify navigation to charts list
    await waitFor(() => {
      expect(screen.getByText('Charts List Page')).toBeInTheDocument();
    });
  });

  it('should handle API failure during chart save and allow retry', async () => {
    const user = userEvent.setup();

    // Mock chart creation to fail first, then succeed
    const apiError = new Error('Network error: Failed to connect to server');
    mockCreateChart
      .mockRejectedValueOnce(apiError)
      .mockResolvedValueOnce({
        id: '123',
        name: 'Test Chart',
        type: 'bar',
        dataSourceId: '1',
        query: 'SELECT * FROM Test Dataset',
        config: {
          xAxis: 'region',
          yAxis: 'revenue',
          colors: ['#3b82f6'],
          legend: true,
          grid: true,
        },
        createdBy: 'test-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Chart);

    renderWithProviders(<ChartBuilderWizard />);

    // STEP 1: Select dataset
    const selectButton = screen.getByRole('button', { name: /select test dataset/i });
    await user.click(selectButton);

    // STEP 2: Configure chart
    await waitFor(() => {
      expect(screen.getByText('Configure Chart')).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/enter chart name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Test Chart');

    // Select X-axis using custom Dropdown component
    const xAxisLabel = screen.getByText(/x-axis column/i);
    const xAxisDropdown = xAxisLabel.closest('div')?.querySelector('[role="combobox"]');
    await user.click(xAxisDropdown!);
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    const xAxisOption = screen.getByRole('option', { name: /region/i });
    await user.click(xAxisOption);

    // Select Y-axis using custom Dropdown component
    const yAxisLabel = screen.getByText(/y-axis column/i);
    const yAxisDropdown = yAxisLabel.closest('div')?.querySelector('[role="combobox"]');
    await user.click(yAxisDropdown!);
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    const yAxisOption = screen.getByRole('option', { name: /revenue/i });
    await user.click(yAxisOption);

    const continueButton = screen.getByRole('button', { name: /preview chart/i });
    await user.click(continueButton);

    // STEP 3: Preview & Save (first attempt - should fail)
    await waitFor(() => {
      expect(screen.getByText('Preview & Save')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /save chart/i });
    await user.click(saveButton);

    // Verify error was handled
    await waitFor(() => {
      expect(mockCreateChart).toHaveBeenCalledTimes(1);
    });

    // Verify error toast was shown with the error message
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringMatching(/network error|failed/i),
        'error'
      );
    });

    // Verify we're still on the preview step (not navigated away)
    expect(screen.getByText('Preview & Save')).toBeInTheDocument();

    // Verify save button is still enabled and can be clicked again
    expect(saveButton).not.toBeDisabled();

    // RETRY: Click save button again
    await user.click(saveButton);

    // Verify second attempt succeeded
    await waitFor(() => {
      expect(mockCreateChart).toHaveBeenCalledTimes(2);
    });

    // Verify success toast shown on retry
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringMatching(/chart created successfully/i),
        'success'
      );
    });

    // Verify navigation to charts list after successful retry
    await waitFor(() => {
      expect(screen.getByText('Charts List Page')).toBeInTheDocument();
    });
  });
});
