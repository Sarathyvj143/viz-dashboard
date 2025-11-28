import { useTheme } from '../../contexts/ThemeContext';

export default function SettingsPanel() {
  const { theme } = useTheme();

  return (
    <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: theme.colors.bgPrimary }}>
      <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.textPrimary }}>Settings</h2>
      <p style={{ color: theme.colors.textSecondary }}>Settings panel component placeholder</p>
    </div>
  );
}
