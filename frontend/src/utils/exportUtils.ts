import html2canvas from 'html2canvas';
import { logger } from './logger';

export const exportToPNG = async (element: HTMLElement, filename: string): Promise<void> => {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
    });

    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    logger.error('Failed to export to PNG:', error);
    throw new Error('Failed to export to PNG');
  }
};

export const exportToJSON = <T>(data: T, filename: string): void => {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `${filename}.json`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
  } catch (error) {
    logger.error('Failed to export to JSON:', error);
    throw new Error('Failed to export to JSON');
  }
};

export const exportToCSV = (data: Record<string, unknown>[], filename: string): void => {
  try {
    if (data.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header];
          const stringValue = value?.toString() || '';
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        }).join(',')
      ),
    ];

    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `${filename}.csv`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
  } catch (error) {
    logger.error('Failed to export to CSV:', error);
    throw new Error('Failed to export to CSV');
  }
};

export const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
};
