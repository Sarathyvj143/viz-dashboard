import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import ErrorBoundary from '../common/ErrorBoundary';

export default function MainLayout() {
  const { theme } = useTheme();
  // Mobile menu should always start closed on page load (not persisted)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <ErrorBoundary>
      <div className="flex h-screen" style={{ backgroundColor: theme.colors.bgPrimary }}>
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-lg shadow-lg"
            style={{
              backgroundColor: theme.colors.bgSecondary,
              color: theme.colors.textPrimary,
            }}
            aria-label="Toggle menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

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
