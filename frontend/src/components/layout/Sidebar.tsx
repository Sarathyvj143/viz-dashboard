import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useTheme } from '../../contexts/ThemeContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import ThemeMenu from '../theme/ThemeMenu';
import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  CircleStackIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (value: boolean) => void;
}

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = usePersistedState('sidebar-collapsed', false);

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboards', href: '/dashboards', icon: HomeIcon, roles: ['admin', 'editor', 'viewer'] },
    { name: 'Charts', href: '/charts', icon: ChartBarIcon, roles: ['admin', 'editor', 'viewer'] },
    { name: 'Connections', href: '/connections', icon: CircleStackIcon, roles: ['admin', 'editor'] },
    { name: 'Users', href: '/users', icon: UsersIcon, roles: ['admin'] },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, roles: ['admin'] },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role || 'viewer')
  );

  // Lock body scroll when mobile menu is open (coordinated with other components)
  useBodyScrollLock(isMobileMenuOpen);

  // Keyboard navigation for mobile menu (Escape to close, focus trap)
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    // Handle Escape key to close menu
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    // Focus trap: keep focus within sidebar when open
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const sidebar = document.querySelector('[data-mobile-sidebar]');
      if (!sidebar) return;

      const focusableElements = sidebar.querySelectorAll<HTMLElement>(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if on first element, go to last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if on last element, go to first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleTabKey);

    // Focus first focusable element when menu opens
    setTimeout(() => {
      const sidebar = document.querySelector('[data-mobile-sidebar]');
      const firstFocusable = sidebar?.querySelector<HTMLElement>(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }, 100); // Small delay to ensure sidebar is fully rendered

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close mobile menu"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsMobileMenuOpen(false);
            }
          }}
        />
      )}

      {/* Sidebar */}
      <div
        data-mobile-sidebar
        className={`
          flex h-full flex-col transition-all duration-300 ease-in-out
          fixed md:relative inset-y-0 left-0 z-50
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
        style={{ backgroundColor: theme.colors.bgSecondary }}
        role="navigation"
        aria-label="Main navigation"
      >
      {/* Logo/Brand */}
      <div
        className="flex h-16 shrink-0 items-center justify-between px-4 border-b"
        style={{ borderColor: theme.colors.borderPrimary }}
      >
        <div className="flex items-center overflow-hidden">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(to bottom right, ${theme.colors.accentPrimary}, ${theme.colors.accentSecondary})` }}>
            <ChartBarIcon className="w-5 h-5" style={{ color: '#ffffff' }} />
          </div>
          {!isCollapsed && (
            <span
              className="ml-3 font-semibold text-lg whitespace-nowrap transition-opacity duration-200"
              style={{ color: theme.colors.textPrimary }}
            >
              Analytics
            </span>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:block p-1.5 rounded-lg transition-colors hover:opacity-80"
          style={{ color: theme.colors.textSecondary }}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-3 py-6">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {filteredNavigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={`group flex items-center gap-x-3 rounded-lg p-3 text-sm font-semibold transition-all duration-200 ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                style={({ isActive }) => ({
                  backgroundColor: isActive
                    ? `${theme.colors.accentPrimary}20`
                    : 'transparent',
                  color: isActive
                    ? theme.colors.accentPrimary
                    : theme.colors.textSecondary,
                  borderLeft: isActive
                    ? `3px solid ${theme.colors.accentPrimary}`
                    : '3px solid transparent',
                })}
                title={isCollapsed ? item.name : ''}
              >
                <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                {!isCollapsed && (
                  <span className="transition-opacity duration-200">{item.name}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div
        className="border-t p-4 space-y-3"
        style={{ borderColor: theme.colors.borderPrimary }}
      >
        {!isCollapsed ? (
          <>
            {/* User Profile */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, ${theme.colors.accentPrimary}, ${theme.colors.accentSecondary})` }}>
                  <span className="font-semibold text-sm" style={{ color: '#ffffff' }}>
                    {user?.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: theme.colors.textPrimary }}
                >
                  {user?.username}
                </p>
                <p
                  className="text-xs capitalize"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {user?.role}
                </p>
              </div>
            </div>

            {/* Theme Selector */}
            <ThemeMenu />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-x-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 hover:opacity-80"
              style={{
                backgroundColor: theme.colors.bgTertiary,
                color: theme.colors.textSecondary,
              }}
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {/* User Avatar */}
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, ${theme.colors.accentPrimary}, ${theme.colors.accentSecondary})` }}>
              <span className="font-semibold text-sm" style={{ color: '#ffffff' }}>
                {user?.username.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Theme Selector */}
            <ThemeMenu isCollapsed />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-lg transition-all duration-200 hover:opacity-80"
              style={{
                backgroundColor: theme.colors.bgTertiary,
                color: theme.colors.textSecondary,
              }}
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
