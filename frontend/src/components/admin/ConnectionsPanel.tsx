import { useTheme } from '../../contexts/ThemeContext';

export default function ConnectionsPanel() {
  const { theme } = useTheme();

  return (
    <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: theme.colors.bgPrimary }}>
      <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.textPrimary }}>Database Connections</h2>
      <p style={{ color: theme.colors.textSecondary }}>Connections panel component placeholder</p>
    </div>
  );
}
