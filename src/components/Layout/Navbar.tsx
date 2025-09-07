import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { 
  TrendingUp, 
  User, 
  ChevronDown
} from 'lucide-react';

const Navbar: React.FC = () => {
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
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Mobile Only (Desktop has it in sidebar) */}
          <div className="flex items-center md:hidden">
            <Link 
              to="/dashboard" 
              className="flex items-center space-x-2 group"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all duration-200">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Financial News
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
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                aria-expanded={isProfileOpen}
                aria-haspopup="menu"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full flex items-center justify-center">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <ChevronDown 
                  className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                    isProfileOpen ? 'rotate-180' : ''
                  }`} 
                />
              </button>

              {/* Quick Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.displayName || 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                      {user.email}
                    </p>
                  </div>
                  
                  <div className="px-4 py-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {t('nav.quickInfo') || 'Quick Info'}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{t('nav.memberSince') || 'Member Since'}</span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {new Date(user.metadata?.creationTime || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
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