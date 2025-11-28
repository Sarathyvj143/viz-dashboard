import { useThemedStyles } from '../hooks/useThemedStyles';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/layout/Header';
import ThemeSelector from '../components/theme/ThemeSelector';

export default function AdminSettings() {
  const styles = useThemedStyles();
  const { theme } = useTheme();
  return (
    <div style={{ backgroundColor: theme.colors.bgPrimary, minHeight: '100vh' }}>
      <Header
        title="Settings"
        subtitle="Configure application settings and preferences"
      />
      <div className="p-3 sm:p-4 md:p-6 w-full space-y-4 sm:space-y-6 md:space-y-8">
        {/* Theme Settings Section */}
        <section className="rounded-xl shadow-sm p-6" style={{ backgroundColor: theme.colors.bgSecondary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary }}>
          <ThemeSelector />
        </section>

        {/* Additional settings sections can be added here */}
        <section className="rounded-xl shadow-sm p-6" style={{ backgroundColor: theme.colors.bgSecondary, borderWidth: '1px', borderStyle: 'solid', borderColor: theme.colors.borderPrimary }}>
          <h3 className="text-lg font-semibold mb-2" style={styles.heading.primary}>
            Other Settings
          </h3>
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
            Additional settings can be configured here
          </p>
        </section>
      </div>
    </div>
  );
}
