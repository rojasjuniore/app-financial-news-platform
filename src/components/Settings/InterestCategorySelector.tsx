import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  X,
  Sliders,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Info,
  AlertCircle
} from 'lucide-react';

interface InterestItem {
  name: string;
  weight: number;
  isActive: boolean;
}

interface InterestCategorySelectorProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  items: InterestItem[];
  suggestions: string[];
  placeholder: string;
  onChange: (items: InterestItem[]) => void;
  onWeightChange: (name: string, weight: number) => void;
  maxWeight?: number;
  showWeights?: boolean;
}

const InterestCategorySelector: React.FC<InterestCategorySelectorProps> = ({
  title,
  description,
  icon,
  color,
  items,
  suggestions,
  placeholder,
  onChange,
  onWeightChange,
  maxWeight = 100,
  showWeights = true
}) => {
  const { t } = useTranslation();
  const [newItem, setNewItem] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedWeights, setExpandedWeights] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Filter suggestions to show only those not already added
  const availableSuggestions = suggestions.filter(
    suggestion => !items.some(item => item.name.toLowerCase() === suggestion.toLowerCase())
  );

  const addItem = (itemName: string) => {
    const trimmedName = itemName.trim();
    if (!trimmedName || items.some(item => item.name.toLowerCase() === trimmedName.toLowerCase())) {
      return;
    }

    const newItems = [...items, {
      name: trimmedName,
      weight: 50, // Default weight
      isActive: true
    }];

    onChange(newItems);
    setNewItem('');
    setShowSuggestions(false);
  };

  const removeItem = (nameToRemove: string) => {
    const newItems = items.filter(item => item.name !== nameToRemove);
    onChange(newItems);
  };

  const toggleItem = (name: string) => {
    const newItems = items.map(item =>
      item.name === name ? { ...item, isActive: !item.isActive } : item
    );
    onChange(newItems);
  };

  const updateWeight = (name: string, newWeight: number) => {
    const clampedWeight = Math.max(0, Math.min(maxWeight, newWeight));
    onWeightChange(name, clampedWeight);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addItem(newItem);
    }
  };

  const getColorClasses = () => {
    const colorMap: { [key: string]: string } = {
      green: 'border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      purple: 'border-purple-500 bg-purple-50 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      blue: 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      orange: 'border-orange-500 bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      red: 'border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      indigo: 'border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300'
    };
    return colorMap[color] || colorMap.blue;
  };

  const getWeightColor = (weight: number) => {
    if (weight >= 80) return 'text-green-600 dark:text-green-400';
    if (weight >= 60) return 'text-blue-600 dark:text-blue-400';
    if (weight >= 40) return 'text-yellow-600 dark:text-yellow-400';
    if (weight >= 20) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getTotalWeight = () => {
    return items.reduce((sum, item) => item.isActive ? sum + item.weight : sum, 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/20`}>
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          </div>
        </div>
        {showWeights && (
          <button
            onClick={() => setExpandedWeights(!expandedWeights)}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              expandedWeights ? `text-${color}-600` : 'text-gray-400'
            }`}
            title="Toggle weight controls"
          >
            <Sliders className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Weight Summary */}
      {showWeights && items.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total Weight:</span>
            <span className={`font-semibold ${getWeightColor(getTotalWeight())}`}>
              {getTotalWeight()}
            </span>
          </div>
          {getTotalWeight() > 100 && (
            <div className="flex items-center mt-2 text-xs text-orange-600 dark:text-orange-400">
              <AlertCircle className="w-3 h-3 mr-1" />
              Total weight exceeds 100. Consider reducing some weights.
            </div>
          )}
        </div>
      )}

      {/* Input Section */}
      <div className="relative">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newItem}
            onChange={(e) => {
              setNewItem(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(newItem.length > 0 || availableSuggestions.length > 0)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => addItem(newItem)}
            disabled={!newItem.trim()}
            className={`px-4 py-2 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            <Plus className="w-4 h-4" />
            {t('common.add')}
          </button>
        </div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && availableSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg mt-1"
            >
              <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Popular suggestions:
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {availableSuggestions.slice(0, 8).map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => addItem(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Current Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
              item.isActive
                ? getColorClasses()
                : 'border-gray-200 bg-gray-50 text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'
            }`}
            draggable
            onDragStart={() => setDraggedItem(item.name)}
            onDragEnd={() => setDraggedItem(null)}
          >
            {/* Toggle Button */}
            <button
              onClick={() => toggleItem(item.name)}
              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                item.isActive
                  ? `border-${color}-500 bg-${color}-500 text-white`
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              {item.isActive && <Eye className="w-3 h-3" />}
            </button>

            {/* Item Name */}
            <span className={`flex-1 font-medium capitalize ${item.isActive ? '' : 'line-through'}`}>
              {item.name}
            </span>

            {/* Weight Controls */}
            <AnimatePresence>
              {showWeights && expandedWeights && item.isActive && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-2"
                >
                  <button
                    onClick={() => updateWeight(item.name, item.weight - 10)}
                    className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center justify-center"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="range"
                    min="0"
                    max={maxWeight}
                    step="5"
                    value={item.weight}
                    onChange={(e) => updateWeight(item.name, parseInt(e.target.value))}
                    className="w-16 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
                  />
                  <span className={`text-xs font-mono w-8 text-center ${getWeightColor(item.weight)}`}>
                    {item.weight}
                  </span>
                  <button
                    onClick={() => updateWeight(item.name, item.weight + 10)}
                    className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center justify-center"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Weight Display (when collapsed) */}
            {showWeights && !expandedWeights && item.isActive && (
              <div className={`text-xs font-mono px-2 py-1 rounded ${getWeightColor(item.weight)} bg-white dark:bg-gray-800`}>
                {item.weight}
              </div>
            )}

            {/* Remove Button */}
            <button
              onClick={() => removeItem(item.name)}
              className={`text-${color}-600 dark:text-${color}-400 hover:text-red-600 dark:hover:text-red-400 transition-colors`}
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-sm">No {title.toLowerCase()} added yet</p>
          <p className="text-xs mt-1">Add some to personalize your feed</p>
        </div>
      )}
    </motion.div>
  );
};

export default InterestCategorySelector;