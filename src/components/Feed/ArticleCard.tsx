import React, { useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Article, FirestoreTimestamp } from '../../types';
import { useIntersectionObserver, useLazyImage } from '../../hooks/usePerformance';
import { useContentAnnounce } from '../A11y/LiveRegion';
import QualityBadge from '../QualityBadge/QualityBadge';
import { getSentimentColor, formatSentiment, isPositiveSentiment, isNegativeSentiment } from '../../utils/sentimentHelpers';

interface ArticleCardProps {
  article: Article;
  onView?: () => void;
  index?: number;
}

const ArticleCard: React.FC<ArticleCardProps> = React.memo(({
  article,
  onView,
  index = 0
}) => {
  const [ref, isIntersecting, hasBeenVisible] = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: false
  });

  // Accessibility hooks
  const { announceContentUpdate, LiveRegionComponent } = useContentAnnounce();

  // Trigger view tracking when component becomes visible
  useEffect(() => {
    if (isIntersecting && hasBeenVisible && onView) {
      onView();
    }
  }, [isIntersecting, hasBeenVisible, onView]);

  // Memoize expensive computations
  const sentimentColor = useMemo(() => {
    return getSentimentColor(article.sentiment);
  }, [article.sentiment]);

  const { addedDate, publishedDate } = useMemo(() => {
    // Helper function to parse date
    const parseDate = (dateValue: string | FirestoreTimestamp | undefined): Date | null => {
      if (!dateValue) return null;
      
      if (typeof dateValue === 'string') {
        return new Date(dateValue);
      } else if ((dateValue as FirestoreTimestamp)._seconds) {
        return new Date((dateValue as FirestoreTimestamp)._seconds * 1000);
      }
      return null;
    };
    
    // Get both dates
    const createdDate = parseDate(article.createdAt) || parseDate(article.created_at);
    const pubDate = parseDate(article.publishedAt) || parseDate(article.published_at);
    
    // Format dates
    const formatDate = (date: Date | null) => {
      if (!date || isNaN(date.getTime())) return null;
      return date.toLocaleString('es-ES', { 
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    };
    
    return {
      addedDate: formatDate(createdDate),
      publishedDate: formatDate(pubDate)
    };
  }, [article.createdAt, article.created_at, article.publishedAt, article.published_at]);


  // Animation variants for staggered animations
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1
    },
    hover: {
      y: -4,
      scale: 1.02,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
    }
  };

  return (
    <article
      ref={ref}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/20 overflow-hidden group will-change-transform transition-colors duration-300"
      aria-label={`Artículo: ${article.title}`}
    >
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate={isIntersecting ? "visible" : "hidden"}
        whileHover="hover"
        transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
        layout
        className="h-full"
      >
      {/* Card Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3" id={`article-meta-${article.id}`}>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
            {article.source && (
              <>
                <span className="font-medium">
                  {typeof article.source === 'string' 
                    ? article.source 
                    : (article.source as any)?.name || 'Fuente desconocida'}
                </span>
                <span>•</span>
              </>
            )}
            <div className="flex flex-col gap-1">
              {addedDate && (
                <div className="flex items-center text-xs">
                  <Clock className="w-3.5 h-3.5 mr-1 text-blue-500" />
                  <span className="text-blue-600 dark:text-blue-400">Agregado: {addedDate}</span>
                </div>
              )}
              {publishedDate && publishedDate !== addedDate && (
                <div className="flex items-center text-xs">
                  <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">Publicado: {publishedDate}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Quality Badge */}
            {article.quality_classification && (
              <QualityBadge 
                classification={article.quality_classification}
                size="sm"
                showTooltip={true}
              />
            )}
            
            {/* Sentiment Badge */}
            {article.sentiment && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${sentimentColor}`}>
                {formatSentiment(article.sentiment)}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <header className="mb-3">
          <Link 
            to={`/article/${article.id}`}
            className="block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-describedby={`article-meta-${article.id}`}
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 transition-colors duration-300">
              {article.title}
            </h2>
          </Link>
        </header>

        {/* Description */}
        {article.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-4 transition-colors duration-300">
            {article.description}
          </p>
        )}

        {/* Tickers */}
        {article.tickers && article.tickers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {article.tickers.slice(0, 3).map(ticker => (
              <span
                key={ticker}
                className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs font-medium transition-colors duration-300"
              >
                ${ticker}
              </span>
            ))}
            {article.tickers.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs transition-colors duration-300">
                +{article.tickers.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Sectors */}
        {article.sectors && article.sectors.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {article.sectors.slice(0, 2).map((sector, index) => {
              const sectorName = typeof sector === 'string' ? sector : sector.sector;
              return (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded text-xs font-medium transition-colors duration-300"
                >
                  {sectorName}
                </span>
              );
            })}
            {article.sectors.length > 2 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs transition-colors duration-300">
                +{article.sectors.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Personalization Badge */}
        {article.personalization && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-100 dark:border-blue-800 transition-colors duration-300">
            <div className="flex items-start space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 transition-colors duration-300" />
              <p className="text-xs text-blue-800 dark:text-blue-300 font-medium transition-colors duration-300">
                {article.personalization.reason}
              </p>
            </div>
          </div>
        )}

        {/* Actions - Solo "Leer más" */}
        <div className="flex items-center justify-end pt-4 border-t border-gray-100 dark:border-gray-700 transition-colors duration-300">
          <Link
            to={`/article/${article.id}`}
            className="flex items-center space-x-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-300 group/link focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-label={`Leer artículo completo: ${article.title}`}
          >
            <span>Leer más</span>
            <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" aria-hidden="true" />
          </Link>
        </div>
      </div>
      </motion.div>
      <LiveRegionComponent />
    </article>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return (
    prevProps.article.id === nextProps.article.id &&
    prevProps.article.quality_classification === nextProps.article.quality_classification &&
    prevProps.index === nextProps.index
  );
});

ArticleCard.displayName = 'ArticleCard';

export default ArticleCard;