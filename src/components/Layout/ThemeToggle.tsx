import React, { useState } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    {
      key: 'light' as const,
      label: 'Light',
      icon: Sun,
      description: 'Light theme'
    },
    {
      key: 'dark' as const,
      label: 'Dark',
      icon: Moon,
      description: 'Dark theme'
    },
    {
      key: 'system' as const,
      label: 'System',
      icon: Monitor,
      description: 'Follow system'
    }
  ];

  const currentTheme = themes.find(t => t.key === theme);
  const CurrentIcon = currentTheme?.icon || Sun;

  const handleThemeChange = (newTheme: typeof theme) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        aria-label="Toggle theme"
        aria-expanded={isOpen}
      >
        <CurrentIcon className="w-5 h-5 transition-transform duration-200" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20 animate-slideUp">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 mb-1">
              Theme
            </div>
            
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isSelected = theme === themeOption.key;
              
              return (
                <button
                  key={themeOption.key}
                  onClick={() => handleThemeChange(themeOption.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-all duration-150 ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${
                      isSelected 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`} />
                    <div className="text-left">
                      <div className="font-medium">
                        {themeOption.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {themeOption.description}
                      </div>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeToggle;