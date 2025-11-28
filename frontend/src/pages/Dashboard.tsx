import { useTheme } from '../contexts/ThemeContext';

export default function Dashboard() {
  const { theme } = useTheme();

  return (
    <main className="p-3 sm:p-4 md:p-6 lg:p-8 w-full" style={{ backgroundColor: theme.colors.bgPrimary, minHeight: '100vh' }}>
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6" style={{ color: theme.colors.textPrimary }}>Dashboard</h1>
      <p className="text-sm sm:text-base" style={{ color: theme.colors.textSecondary }}>Dashboard page placeholder</p>
    </main>
  );
}
