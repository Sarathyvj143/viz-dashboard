import { Outlet } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from './Sidebar';
import ErrorBoundary from '../common/ErrorBoundary';

export default function MainLayout() {
  const { theme } = useTheme();

  return (
    <ErrorBoundary>
      <div className="flex h-screen" style={{ backgroundColor: theme.colors.bgPrimary }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
