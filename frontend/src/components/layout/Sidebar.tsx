import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { usePersistedState } from '../../hooks/usePersistedState';
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

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = usePersistedState('sidebar-collapsed', false);

  const handleLogout = async () => {
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

  return (
    <div className={`flex h-full flex-col bg-gray-900 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo/Brand */}
      <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-gray-800">
        <div className="flex items-center overflow-hidden">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <ChartBarIcon className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="ml-3 text-white font-semibold text-lg whitespace-nowrap transition-opacity duration-200">
              Analytics
            </span>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
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
                className={({ isActive }) =>
                  `group flex items-center gap-x-3 rounded-lg p-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gray-800 text-white shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
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
      <div className="border-t border-gray-800 p-4 space-y-3">
        {!isCollapsed ? (
          <>
            {/* User Profile */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
            </div>

            {/* Theme Selector */}
            <ThemeMenu />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-x-2 rounded-lg bg-gray-800 px-3 py-2.5 text-sm font-semibold text-gray-400 hover:bg-gray-700 hover:text-white transition-all duration-200"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {/* User Avatar */}
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.username.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Theme Selector */}
            <ThemeMenu isCollapsed />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all duration-200"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
