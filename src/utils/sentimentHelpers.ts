import { Sentiment } from '../types';

/**
 * Helper functions para manejar el sentiment que puede venir en diferentes formatos
 */

// Obtener el valor de sentiment como string
export const getSentimentString = (
  sentiment: Sentiment | { score?: number; label?: string } | undefined
): string => {
  if (!sentiment) return 'neutral';
  
  // Si es un objeto con label
  if (typeof sentiment === 'object' && 'label' in sentiment) {
    return sentiment.label || 'neutral';
  }
  
  // Si es un string directo
  if (typeof sentiment === 'string') {
    return sentiment;
  }
  
  return 'neutral';
};

// Obtener el score de sentiment
export const getSentimentScore = (
  sentiment: Sentiment | { score?: number; label?: string } | undefined
): number => {
  if (!sentiment) return 0;
  
  // Si es un objeto con score
  if (typeof sentiment === 'object' && 'score' in sentiment) {
    return sentiment.score || 0;
  }
  
  // Si es un string, mapear a scores aproximados
  if (typeof sentiment === 'string') {
    const scoreMap: Record<string, number> = {
      'very_bullish': 0.9,
      'bullish': 0.6,
      'positive': 0.3,
      'neutral': 0,
      'negative': -0.3,
      'bearish': -0.6,
      'very_bearish': -0.9
    };
    return scoreMap[sentiment] || 0;
  }
  
  return 0;
};

// Verificar si el sentiment es positivo
export const isPositiveSentiment = (
  sentiment: Sentiment | { score?: number; label?: string } | undefined
): boolean => {
  const sentStr = getSentimentString(sentiment).toLowerCase();
  return sentStr.includes('bullish') || 
         sentStr === 'positive' || 
         sentStr === 'very_bullish' ||
         getSentimentScore(sentiment) > 0.1;
};

// Verificar si el sentiment es negativo
export const isNegativeSentiment = (
  sentiment: Sentiment | { score?: number; label?: string } | undefined
): boolean => {
  const sentStr = getSentimentString(sentiment).toLowerCase();
  return sentStr.includes('bearish') || 
         sentStr === 'negative' || 
         sentStr === 'very_bearish' ||
         getSentimentScore(sentiment) < -0.1;
};

// Formatear sentiment para mostrar
export const formatSentiment = (
  sentiment: Sentiment | { score?: number; label?: string } | undefined
): string => {
  const sentStr = getSentimentString(sentiment);
  return sentStr.replace('_', ' ').toUpperCase();
};

// Obtener color de sentiment para UI
export const getSentimentColor = (
  sentiment: Sentiment | { score?: number; label?: string } | undefined
): string => {
  if (isPositiveSentiment(sentiment)) {
    return 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  }
  
  if (isNegativeSentiment(sentiment)) {
    return 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  }
  
  return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';
};

// Obtener emoji de sentiment
export const getSentimentEmoji = (
  sentiment: Sentiment | { score?: number; label?: string } | undefined
): string => {
  if (isPositiveSentiment(sentiment)) return '📈';
  if (isNegativeSentiment(sentiment)) return '📉';
  return '➖';
};