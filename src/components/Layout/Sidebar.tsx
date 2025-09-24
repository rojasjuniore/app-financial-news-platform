import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Newspaper,
  Bookmark,
  Search,
  MessageCircle,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sliders,
  BarChart3,
  Bot,
  Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNotificationDot, setShowNotificationDot] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t('auth.logoutSuccess'));
      navigate('/login');
    } catch (error) {
      toast.error(t('errors.generic'));
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    // { path: '/dashboard', icon: Home, label: t('nav.dashboard') },
    { path: '/feed', icon: Newspaper, label: t('nav.feed') },
    // { path: '/technical-analysis', icon: BarChart3, label: 'Análisis Técnico', badge: 'PRO' },
    // { path: '/forex-metals', icon: TrendingUp, label: 'Forex & Metales', badge: 'PRO' },
    { path: '/preferences', icon: Sliders, label: 'Preferences' },
    // { path: '/saved', icon: Bookmark, label: t('nav.saved') },
    // { path: '/search', icon: Search, label: t('nav.search') },
    // { path: '/chat', icon: MessageCircle, label: t('nav.chat') || 'Chat' },
    { path: '/voice', icon: Bot, label: 'AI Voice Assistant', badge: 'NEW' },
  ];

  const bottomItems = [
    { path: '/metrics', icon: Activity, label: t('common.locale') === 'es-ES' ? 'Métricas' : 'Metrics' },
    { path: '/profile', icon: User, label: t('nav.profile') },
    { path: '/settings', icon: Settings, label: t('nav.settings') },
  ];

  return (
    <aside
      className={`${isCollapsed ? 'w-20' : 'w-64'
        } bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col transition-all duration-300 relative`}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Link
          to="/dashboard"
          className="flex items-center space-x-3 group"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all duration-200 flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-opacity duration-300">
              Financial News
            </span>
          )}
        </Link>
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 z-10"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'
              } space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${isActive(item.path)
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="text-sm font-medium flex-1">{item.label}</span>
                {(item as any).badge && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full">
                    {(item as any).badge}
                  </span>
                )}
              </>
            )}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                {item.label}
              </div>
            )}
          </Link>
        ))}

        {/* Notifications Link */}
        {/* <Link
          to="/notifications"
          onClick={() => {
            setShowNotificationDot(false);
            if (onClose) onClose();
          }}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'
            } space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${isActive('/notifications')
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          title={isCollapsed ? t('nav.notifications') || 'Notifications' : undefined}
        >
          <div className="relative">
            <Bell className="w-5 h-5 flex-shrink-0" />
            {showNotificationDot && !isActive('/notifications') && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </div>
          {!isCollapsed && (
            <span className="text-sm font-medium">{t('nav.notifications') || 'Notifications'}</span>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
              {t('nav.notifications') || 'Notifications'}
            </div>
          )}
        </Link> */}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        {/* Theme and Language Controls */}
        <div className={`${isCollapsed ? 'space-y-3' : 'space-y-2'}`}>
          {!isCollapsed && (
            <div className="flex items-center justify-between px-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('nav.theme') || 'Theme'}</span>
              <ThemeToggle />
            </div>
          )}
          {!isCollapsed && (
            <div className="flex items-center justify-between px-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('nav.language')}</span>
              <LanguageSelector />
            </div>
          )}
          {isCollapsed && (
            <>
              <div className="flex justify-center">
                <ThemeToggle />
              </div>
              <div className="flex justify-center">
                <LanguageSelector />
              </div>
            </>
          )}
        </div>

        {/* User Section */}
        <div className="space-y-1">
          {bottomItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'
                } space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${isActive(item.path)
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          ))}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'
              } space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20`}
            title={isCollapsed ? t('nav.logout') : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-medium">{t('nav.logout')}</span>
            )}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                {t('nav.logout')}
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;