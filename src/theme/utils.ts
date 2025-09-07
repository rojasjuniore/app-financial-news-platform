/**
 * Financial News App - Theme Utilities
 * Helper functions for working with the design system
 */

import { theme } from './index';

/**
 * Get financial color based on value change
 */
export const getFinancialColor = (value: number, neutral: number = 0) => {
  if (value > neutral) return theme.colors.financial.bullish[500];
  if (value < neutral) return theme.colors.financial.bearish[500];
  return theme.colors.financial.neutral[500];
};

/**
 * Get financial CSS class based on value change
 */
export const getFinancialClass = (value: number, neutral: number = 0, prefix: string = 'price') => {
  if (value > neutral) return `${prefix}-bullish`;
  if (value < neutral) return `${prefix}-bearish`;
  return `${prefix}-neutral`;
};

/**
 * Get badge variant based on sentiment
 */
export const getSentimentBadgeClass = (sentiment: string) => {
  const normalizedSentiment = sentiment.toLowerCase();
  
  if (normalizedSentiment.includes('bullish') || normalizedSentiment.includes('positive')) {
    return 'financial-badge-bullish';
  }
  if (normalizedSentiment.includes('bearish') || normalizedSentiment.includes('negative')) {
    return 'financial-badge-bearish';
  }
  return 'financial-badge-neutral';
};

/**
 * Format percentage change with appropriate styling
 */
export const formatPercentageChange = (value: number): {
  formatted: string;
  className: string;
  icon: string;
} => {
  const formatted = `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  const className = getFinancialClass(value, 0, 'change-indicator');
  const icon = value >= 0 ? 'arrow-up' : 'arrow-down';
  
  return { formatted, className, icon };
};

/**
 * Format price with currency symbol
 */
export const formatPrice = (value: number, currency: string = '$'): string => {
  return `${currency}${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Get market status styling
 */
export const getMarketStatusClass = (isOpen: boolean) => {
  return `market-status ${isOpen ? 'open' : 'closed'}`;
};

/**
 * Generate responsive grid classes based on item count
 */
export const getResponsiveGridClass = (itemCount: number) => {
  if (itemCount <= 2) return 'grid grid-cols-1 sm:grid-cols-2 gap-4';
  if (itemCount <= 3) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';
  return 'grid-responsive';
};

/**
 * Get card shadow class based on elevation level
 */
export const getCardShadowClass = (elevation: 'none' | 'subtle' | 'medium' | 'high' = 'medium') => {
  switch (elevation) {
    case 'none':
      return 'shadow-none border border-gray-200';
    case 'subtle':
      return 'shadow-sm';
    case 'high':
      return 'card-elevated';
    default:
      return 'financial-card-shadow';
  }
};

/**
 * Generate skeleton loader classes for different content types
 */
export const getSkeletonClass = (type: 'text' | 'avatar' | 'card' | 'price' = 'text') => {
  const baseClass = 'skeleton-loader animate-pulse';
  
  switch (type) {
    case 'avatar':
      return `${baseClass} w-10 h-10 rounded-full`;
    case 'card':
      return `${baseClass} h-32 w-full rounded-lg`;
    case 'price':
      return `${baseClass} h-6 w-20 rounded`;
    default:
      return `${baseClass} h-4 w-full rounded`;
  }
};

/**
 * Get button size classes
 */
export const getButtonSizeClass = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md') => {
  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };
  
  return sizeClasses[size];
};

/**
 * Get button variant classes
 */
export const getButtonVariantClass = (variant: 'primary' | 'secondary' | 'ghost' | 'bullish' | 'bearish' = 'primary') => {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    bullish: 'btn-bullish',
    bearish: 'btn-bearish'
  };
  
  return variantClasses[variant];
};

/**
 * Generate complete button classes
 */
export const getButtonClass = (
  variant: 'primary' | 'secondary' | 'ghost' | 'bullish' | 'bearish' = 'primary',
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md',
  disabled: boolean = false,
  fullWidth: boolean = false
) => {
  const classes = [
    'inline-flex items-center justify-center font-medium rounded-lg transition-all focus-ring',
    getButtonVariantClass(variant),
    getButtonSizeClass(size)
  ];
  
  if (disabled) {
    classes.push('opacity-50 cursor-not-allowed');
  }
  
  if (fullWidth) {
    classes.push('w-full');
  }
  
  return classes.join(' ');
};

/**
 * Generate input classes with validation states
 */
export const getInputClass = (
  state: 'default' | 'error' | 'success' = 'default',
  size: 'sm' | 'md' | 'lg' = 'md'
) => {
  const baseClass = 'input-modern focus-ring';
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-4 py-3 text-base'
  };
  
  const stateClasses = {
    default: '',
    error: 'input-error',
    success: 'input-success'
  };
  
  return `${baseClass} ${sizeClasses[size]} ${stateClasses[state]}`.trim();
};

/**
 * Generate ticker badge classes
 */
export const getTickerBadgeClass = (
  variant: 'default' | 'bullish' | 'bearish' = 'default',
  size: 'sm' | 'md' = 'md'
) => {
  const baseClass = 'ticker-badge';
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1'
  };
  
  const variantClasses = {
    default: '',
    bullish: 'bg-green-100 text-green-800 border-green-200',
    bearish: 'bg-red-100 text-red-800 border-red-200'
  };
  
  return `${baseClass} ${sizeClasses[size]} ${variantClasses[variant]}`.trim();
};

/**
 * Theme-aware utility for conditional classes
 */
export const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Get appropriate contrast color for backgrounds
 */
export const getContrastColor = (backgroundColor: string): string => {
  // Simple contrast calculation - in a real app you might want a more sophisticated approach
  const isLight = backgroundColor.includes('50') || backgroundColor.includes('100');
  return isLight ? theme.colors.gray[900] : theme.colors.gray[50];
};

/**
 * Animation delay utilities for staggered animations
 */
export const getAnimationDelay = (index: number, baseDelay: number = 100): string => {
  return `${index * baseDelay}ms`;
};

/**
 * Responsive text size utilities
 */
export const getResponsiveTextSize = (
  mobile: string = 'text-base',
  tablet: string = 'sm:text-lg',
  desktop: string = 'lg:text-xl'
): string => {
  return `${mobile} ${tablet} ${desktop}`;
};

/**
 * Generate loading state classes
 */
export const getLoadingStateClass = (type: 'spinner' | 'skeleton' = 'skeleton') => {
  if (type === 'spinner') {
    return 'flex items-center justify-center p-4';
  }
  return 'animate-pulse';
};

/**
 * Financial data formatting utilities
 */
export const formatFinancialValue = (
  value: number,
  type: 'currency' | 'percentage' | 'number' = 'number',
  options?: Intl.NumberFormatOptions
): string => {
  const defaultOptions: Intl.NumberFormatOptions = {
    currency: type === 'currency' ? 'USD' : undefined,
    style: type === 'percentage' ? 'percent' : type === 'currency' ? 'currency' : 'decimal',
    minimumFractionDigits: type === 'percentage' ? 2 : type === 'currency' ? 2 : 0,
    maximumFractionDigits: type === 'percentage' ? 2 : type === 'currency' ? 2 : 2,
    ...options
  };
  
  if (type === 'percentage') {
    return (value / 100).toLocaleString('en-US', defaultOptions);
  }
  
  return value.toLocaleString('en-US', defaultOptions);
};

// Export theme for convenience
export { theme };

// Type exports
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'bullish' | 'bearish';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type InputState = 'default' | 'error' | 'success';
export type CardElevation = 'none' | 'subtle' | 'medium' | 'high';
export type SkeletonType = 'text' | 'avatar' | 'card' | 'price';