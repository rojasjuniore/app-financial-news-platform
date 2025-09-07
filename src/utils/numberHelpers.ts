/**
 * Number Helper Functions
 * Safely convert and format numbers from various sources
 */

export const toNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const formatPrice = (value: any, decimals: number = 2): string => {
  const num = toNumber(value);
  return num.toFixed(decimals);
};

export const formatPercent = (value: any, decimals: number = 2): string => {
  const num = toNumber(value);
  return `${num >= 0 ? '+' : ''}${num.toFixed(decimals)}%`;
};

export const formatCurrency = (value: any, decimals: number = 2): string => {
  const num = toNumber(value);
  return `$${num.toFixed(decimals)}`;
};

export const formatChange = (value: any, decimals: number = 2): string => {
  const num = toNumber(value);
  return `${num >= 0 ? '+' : ''}$${Math.abs(num).toFixed(decimals)}`;
};