import { useTheme } from '../../contexts/ThemeContext';

export default function DashboardEditor() {
  const { theme } = useTheme();

  return (
    <div
      className="p-6 rounded-lg shadow-md"
      style={{ backgroundColor: theme.colors.bgSecondary }}
    >
      <h2 className="text-xl font-semibold mb-4">Dashboard Editor</h2>
      <p style={{ color: theme.colors.textSecondary }}>
        Dashboard editor component placeholder
      </p>
    </div>
  );
}
