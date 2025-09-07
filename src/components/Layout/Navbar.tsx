import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import { 
  TrendingUp, 
  User, 
  LogOut, 
  Bookmark, 
  Settings, 
  Menu, 
  X,
  Home,
  Search,
  Bell,
  ChevronDown,
  Newspaper,
  MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useMenuFocus } from '../../hooks/a11y/useFocusManagement';
import { useNavigationAnnounce } from '../A11y/LiveRegion';

const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Accessibility hooks
  const { announceMenuState, announceNavigation, LiveRegionComponent } = useNavigationAnnounce();
  const profileMenuFocus = useMenuFocus();
  const mobileMenuFocus = useMenuFocus();
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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

  // Handle menu state changes with announcements
  const toggleProfileMenu = () => {
    const newState = !isProfileOpen;
    setIsProfileOpen(newState);
    announceMenuState(t('nav.profile'), newState);
    
    if (newState) {
      setTimeout(() => profileMenuFocus.focusFirst(), 100);
    }
  };

  const toggleMobileMenu = () => {
    const newState = !isMenuOpen;
    setIsMenuOpen(newState);
    announceMenuState('Mobile navigation', newState);
    
    if (newState) {
      setTimeout(() => mobileMenuFocus.focusFirst(), 100);
    }
  };

  // Handle keyboard navigation for dropdown menus
  const handleProfileDropdownKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsProfileOpen(false);
      announceMenuState(t('nav.profile'), false);
    }
    profileMenuFocus.handleKeyDown(event);
  };

  const handleMobileMenuKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsMenuOpen(false);
      announceMenuState('Mobile navigation', false);
    }
    mobileMenuFocus.handleKeyDown(event);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clean up menu focus when component unmounts
  useEffect(() => {
    return () => {
      profileMenuFocus.clearItems();
      mobileMenuFocus.clearItems();
    };
  }, []);

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300" role="navigation" aria-label="Main navigation" id="navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to="/dashboard" 
              className="flex items-center space-x-3 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1"
              aria-label="Financial News - Dashboard"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all duration-200">
                <TrendingUp className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100 hidden sm:block transition-colors duration-300">
                Financial News
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isActive('/dashboard')
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              aria-current={isActive('/dashboard') ? 'page' : undefined}
            >
              <Home className="w-4 h-4 inline mr-2" aria-hidden="true" />
              {t('nav.dashboard')}
            </Link>

            <Link
              to="/feed"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isActive('/feed')
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              aria-current={isActive('/feed') ? 'page' : undefined}
            >
              <Newspaper className="w-4 h-4 inline mr-2" aria-hidden="true" />
              {t('nav.feed')}
            </Link>

            <Link
              to="/saved"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isActive('/saved')
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              aria-current={isActive('/saved') ? 'page' : undefined}
            >
              <Bookmark className="w-4 h-4 inline mr-2" aria-hidden="true" />
              {t('nav.saved')}
            </Link>

            <Link
              to="/search"
              className={`px-3 py-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isActive('/search')
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              aria-label={t('nav.search')}
              aria-current={isActive('/search') ? 'page' : undefined}
            >
              <Search className="w-5 h-5" aria-hidden="true" />
            </Link>

            <Link
              to="/chat"
              className={`px-3 py-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isActive('/chat')
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              aria-label="Chat"
              aria-current={isActive('/chat') ? 'page' : undefined}
            >
              <MessageCircle className="w-5 h-5" aria-hidden="true" />
            </Link>

            <button 
              className="relative px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true"></span>
            </button>

            <LanguageSelector />
            <ThemeToggle />
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={toggleProfileMenu}
                  onKeyDown={(e) => handleProfileDropdownKeyDown(e as any)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-expanded={isProfileOpen}
                  aria-haspopup="menu"
                  aria-label={`${t('nav.profile')} - ${user.displayName || user.email?.split('@')[0]}`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full flex items-center justify-center">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="w-5 h-5 text-white" aria-hidden="true" />
                    )}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown 
                    className={`w-4 h-4 text-gray-500 dark:text-gray-400 hidden md:block transition-all duration-200 ${
                      isProfileOpen ? 'rotate-180' : ''
                    }`} 
                    aria-hidden="true" 
                  />
                </button>

                {/* Dropdown */}
                {isProfileOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 transition-colors duration-200"
                    role="menu"
                    aria-label={t('nav.profile')}
                  >
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">
                        {user.displayName || 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate transition-colors duration-200">
                        {user.email}
                      </p>
                    </div>
                    
                    <Link
                      ref={(el) => { if (el) profileMenuFocus.registerItem(el); }}
                      to="/profile"
                      onClick={() => {
                        setIsProfileOpen(false);
                        announceNavigation(t('nav.profile'));
                      }}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-700 dark:focus:text-blue-300"
                      role="menuitem"
                    >
                      <User className="w-4 h-4" aria-hidden="true" />
                      <span>{t('nav.profile')}</span>
                    </Link>
                    
                    <Link
                      ref={(el) => { if (el) profileMenuFocus.registerItem(el); }}
                      to="/settings"
                      onClick={() => {
                        setIsProfileOpen(false);
                        announceNavigation(t('nav.settings'));
                      }}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-700 dark:focus:text-blue-300"
                      role="menuitem"
                    >
                      <Settings className="w-4 h-4" aria-hidden="true" />
                      <span>{t('nav.settings')}</span>
                    </Link>
                    
                    <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                      <button
                        ref={(el) => { if (el) profileMenuFocus.registerItem(el); }}
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 w-full text-left focus:outline-none focus:bg-red-50 dark:focus:bg-red-900/20"
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4" aria-hidden="true" />
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              onKeyDown={(e) => handleMobileMenuKeyDown(e as any)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              aria-label={isMenuOpen ? t('common.close') : 'Menu'}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-gray-700 dark:text-gray-300" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div 
            ref={mobileMenuRef}
            className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700"
            role="menu"
            aria-label="Mobile navigation"
          >
            <div className="space-y-1">
              <Link
                ref={(el) => { if (el) mobileMenuFocus.registerItem(el); }}
                to="/dashboard"
                onClick={() => {
                  setIsMenuOpen(false);
                  announceNavigation(t('nav.dashboard'));
                }}
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isActive('/dashboard')
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                role="menuitem"
              >
                <Home className="w-4 h-4 inline mr-2" aria-hidden="true" />
                {t('nav.dashboard')}
              </Link>

              <Link
                ref={(el) => { if (el) mobileMenuFocus.registerItem(el); }}
                to="/feed"
                onClick={() => {
                  setIsMenuOpen(false);
                  announceNavigation(t('nav.feed'));
                }}
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isActive('/feed')
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                role="menuitem"
              >
                <Newspaper className="w-4 h-4 inline mr-2" aria-hidden="true" />
                {t('nav.feed')}
              </Link>

              <Link
                ref={(el) => { if (el) mobileMenuFocus.registerItem(el); }}
                to="/saved"
                onClick={() => {
                  setIsMenuOpen(false);
                  announceNavigation(t('nav.saved'));
                }}
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isActive('/saved')
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                role="menuitem"
              >
                <Bookmark className="w-4 h-4 inline mr-2" aria-hidden="true" />
                {t('nav.saved')}
              </Link>

              <Link
                ref={(el) => { if (el) mobileMenuFocus.registerItem(el); }}
                to="/search"
                onClick={() => {
                  setIsMenuOpen(false);
                  announceNavigation(t('nav.search'));
                }}
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isActive('/search')
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                role="menuitem"
              >
                <Search className="w-4 h-4 inline mr-2" aria-hidden="true" />
                {t('nav.search')}
              </Link>

              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('nav.language')}</span>
                  <LanguageSelector />
                </div>
                <div className="px-4 py-2">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
    <LiveRegionComponent />
    </>
  );
};

export default Navbar;