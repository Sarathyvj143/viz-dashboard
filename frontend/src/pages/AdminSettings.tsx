import { useThemedStyles } from '../hooks/useThemedStyles';
import Header from '../components/layout/Header';
import ThemeSelector from '../components/theme/ThemeSelector';

export default function AdminSettings() {
  const styles = useThemedStyles();
  return (
    <div>
      <Header
        title="Settings"
        subtitle="Configure application settings and preferences"
      />
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        {/* Theme Settings Section */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <ThemeSelector />
        </section>

        {/* Additional settings sections can be added here */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-2" style={styles.heading.primary}>
            Other Settings
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Additional settings can be configured here
          </p>
        </section>
      </div>
    </div>
  );
}
