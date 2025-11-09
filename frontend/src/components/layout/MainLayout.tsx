import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ErrorBoundary from '../common/ErrorBoundary';

export default function MainLayout() {
  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50">
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
