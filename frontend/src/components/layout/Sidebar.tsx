import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

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
    <div className="flex h-full w-64 flex-col bg-gray-900">
      {/* Logo/Brand */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-800">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <ChartBarIcon className="w-5 h-5 text-white" />
          </div>
          <span className="ml-3 text-white font-semibold text-lg">Analytics</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-4 py-6">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {filteredNavigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `group flex gap-x-3 rounded-md p-3 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.username.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-white">{user?.username}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-3 w-full flex items-center gap-x-2 rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
