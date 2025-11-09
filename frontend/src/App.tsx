import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { apiClient } from './api/client';
import { ThemeProvider } from './contexts/ThemeContext';
import MainLayout from './components/layout/MainLayout';
import ToastContainer from './components/common/ToastContainer';
import Login from './pages/Login';
import DashboardList from './pages/DashboardList';
import DashboardDetail from './pages/DashboardDetail';
import Dashboard from './pages/Dashboard';
import ChartList from './pages/ChartList';
import ChartDetail from './pages/ChartDetail';
import ChartCreate from './pages/ChartCreate';
import AdminSettings from './pages/AdminSettings';
import PublicDashboard from './pages/PublicDashboard';
import ConnectionsPage from './pages/ConnectionsPage';
import UsersPage from './pages/UsersPage';

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Admin Route component
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboards" replace />;
  }

  return <>{children}</>;
}

// Editor or Admin Route component
function EditorRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin' && user?.role !== 'editor') {
    return <Navigate to="/dashboards" replace />;
  }

  return <>{children}</>;
}

// App component with auth handler setup
function AppContent() {
  const navigate = useNavigate();
  const { logout, checkAuth } = useAuthStore();

  useEffect(() => {
    // Register unauthorized handler
    apiClient.setUnauthorizedHandler(() => {
      logout();
      navigate('/login', { replace: true });
    });

    // Check auth on mount
    checkAuth();
  }, [navigate, logout, checkAuth]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/public/:shareToken" element={<PublicDashboard />} />

      {/* Protected routes with layout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboards" element={<DashboardList />} />
        <Route path="/dashboards/:id" element={<DashboardDetail />} />
        <Route path="/charts" element={<ChartList />} />
        <Route path="/charts/new" element={<EditorRoute><ChartCreate /></EditorRoute>} />
        <Route path="/charts/:id" element={<ChartDetail />} />

        {/* Editor or Admin routes */}
        <Route path="/connections" element={<EditorRoute><ConnectionsPage /></EditorRoute>} />

        {/* Admin only routes */}
        <Route path="/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboards" replace />} />
      <Route path="*" element={<Navigate to="/dashboards" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AppContent />
        <ToastContainer />
      </ThemeProvider>
    </Router>
  );
}

export default App;
