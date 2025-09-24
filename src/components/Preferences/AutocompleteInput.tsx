import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, TrendingUp, Plus, X } from 'lucide-react';

interface AutocompleteInputProps {
  suggestions: Array<{
    value: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    category?: string;
  }>;
  selectedItems: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  color?: string;
  maxItems?: number;
  allowCustom?: boolean;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  suggestions,
  selectedItems,
  onAdd,
  onRemove,
  placeholder = 'Search...',
  label,
  icon,
  color = 'blue',
  maxItems = 10,
  allowCustom = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState(suggestions);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.length > 0) {
      const filtered = suggestions.filter(suggestion => {
        const searchTerm = inputValue.toLowerCase();
        const label = suggestion.label.toLowerCase();
        const value = suggestion.value.toLowerCase();
        const description = suggestion.description?.toLowerCase() || '';

        // Check if already selected
        if (selectedItems.includes(suggestion.value)) {
          return false;
        }

        // Fuzzy search
        return label.includes(searchTerm) ||
               value.includes(searchTerm) ||
               description.includes(searchTerm) ||
               // Check if all characters of search term are in the label in order
               searchTerm.split('').every(char => {
                 const index = label.indexOf(char);
                 if (index !== -1) {
                   label = label.slice(index + 1);
                   return true;
                 }
                 return false;
               });
      });

      setFilteredSuggestions(filtered.slice(0, maxItems));
      setShowSuggestions(true);
    } else {
      // Show popular suggestions when input is empty
      const popular = suggestions
        .filter(s => !selectedItems.includes(s.value))
        .slice(0, 8);
      setFilteredSuggestions(popular);
      setShowSuggestions(false);
    }
  }, [inputValue, suggestions, selectedItems, maxItems]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value: string) => {
    onAdd(value);
    setInputValue('');
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
        handleSelect(filteredSuggestions[highlightedIndex].value);
      } else if (allowCustom && inputValue.trim()) {
        handleSelect(inputValue.trim().toUpperCase());
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const getColorClasses = () => {
    const colors = {
      blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      green: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
      purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      indigo: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-4">
      {label && (
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        </div>
      )}

      <div className="relative" ref={dropdownRef}>
        {/* Input Field */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && filteredSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto"
            >
              {filteredSuggestions.map((suggestion, index) => (
                <div
                  key={suggestion.value}
                  onClick={() => handleSelect(suggestion.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between group ${
                    index === highlightedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {suggestion.icon || <TrendingUp className="w-4 h-4 text-gray-400" />}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {suggestion.label}
                      </div>
                      {suggestion.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {suggestion.description}
                        </div>
                      )}
                    </div>
                  </div>
                  {suggestion.category && (
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                      {suggestion.category}
                    </span>
                  )}
                  <Plus className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No suggestions message */}
        {showSuggestions && inputValue && filteredSuggestions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="text-center text-gray-500 dark:text-gray-400">
              {allowCustom ? (
                <div>
                  <p>No matches found</p>
                  <button
                    onClick={() => handleSelect(inputValue.trim().toUpperCase())}
                    className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Add "{inputValue.toUpperCase()}" anyway
                  </button>
                </div>
              ) : (
                <p>No matches found</p>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((item) => {
            const suggestion = suggestions.find(s => s.value === item);
            return (
              <motion.span
                key={item}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${getColorClasses()}`}
              >
                {suggestion?.icon}
                {suggestion?.label || item}
                <button
                  onClick={() => onRemove(item)}
                  className="ml-1 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            );
          })}
        </div>
      )}

      {/* Popular Suggestions */}
      {!showSuggestions && selectedItems.length === 0 && filteredSuggestions.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Popular choices:</p>
          <div className="flex flex-wrap gap-2">
            {filteredSuggestions.slice(0, 6).map((suggestion) => (
              <button
                key={suggestion.value}
                onClick={() => handleSelect(suggestion.value)}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;