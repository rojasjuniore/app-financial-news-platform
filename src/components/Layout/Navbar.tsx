import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import {
  TrendingUp,
  User,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, isMobileMenuOpen = false }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const toggleProfileMenu = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors duration-300">
      <div className="px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Mobile Menu Button & Logo */}
          <div className="flex items-center gap-3 md:hidden">
            {/* Mobile Menu Button */}
            <button
              onClick={onToggleMobileMenu}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            {/* Mobile Logo */}
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 group"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all duration-200">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-gray-100 hidden xs:block">
                <span className="sm:hidden">FN</span>
                <span className="hidden sm:inline">Financial News</span>
              </span>
            </Link>
          </div>

          {/* Empty space for desktop (logo is in sidebar) */}
          <div className="hidden md:block"></div>

          {/* User Profile */}
          {user && (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={toggleProfileMenu}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 min-h-[44px]"
                aria-expanded={isProfileOpen}
                aria-haspopup="menu"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full flex items-center justify-center flex-shrink-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt=""
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
                    />
                  ) : (
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-32">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <ChevronDown
                  className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 hidden sm:block ${
                    isProfileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Quick Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <div className="px-3 sm:px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.displayName || 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                      {user.email}
                    </p>
                  </div>

                  <div className="px-3 sm:px-4 py-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {t('nav.quickInfo') || 'Quick Info'}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{t('nav.memberSince') || 'Member Since'}</span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {new Date(user.metadata?.creationTime || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{t('nav.lastLogin') || 'Last Login'}</span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {new Date(user.metadata?.lastSignInTime || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
export type { NavbarProps };