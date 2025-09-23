import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Activity,
  Hash,
  Shield,
  Star,
  Image as ImageIcon,
  Brain,
  BarChart3,
  Tag
} from 'lucide-react';
import { Article } from '../../types';
import { getSentimentColor, formatSentiment, isPositiveSentiment, isNegativeSentiment } from '../../utils/sentimentHelpers';

interface NewsListItemProps {
  article: Article;
  showImportanceBar?: boolean;
}

const ImportanceBar: React.FC<{ score: number }> = ({ score }) => (
  <div className="flex items-center gap-2 text-xs mb-2">
    <span className="text-gray-500 dark:text-gray-400 min-w-[70px]">Importancia:</span>
    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 max-w-[100px]">
      <div
        className={`h-1.5 rounded-full transition-all duration-300 ${
          score >= 80 ? 'bg-gradient-to-r from-red-500 to-red-600' :
          score >= 60 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
          score >= 40 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
          'bg-gradient-to-r from-gray-400 to-gray-500'
        }`}
        style={{ width: `${Math.max(score, 5)}%` }}
      />
    </div>
    <span className={`font-bold text-xs min-w-[35px] ${
      score >= 80 ? 'text-red-600 dark:text-red-400' :
      score >= 60 ? 'text-orange-600 dark:text-orange-400' :
      score >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
      'text-gray-500 dark:text-gray-400'
    }`}>
      {score}%
    </span>
  </div>
);

const NewsListItem: React.FC<NewsListItemProps> = ({ article, showImportanceBar = false }) => {
  const [imageError, setImageError] = useState(false);

  // Parse dates
  const parseDate = (dateValue: string | any | undefined): Date | null => {
    if (!dateValue) return null;

    if (typeof dateValue === 'string') {
      return new Date(dateValue);
    } else if (dateValue._seconds) {
      return new Date(dateValue._seconds * 1000);
    }
    return null;
  };

  const publishedDate = parseDate(article.publishedAt) || parseDate(article.published_at);
  const createdDate = parseDate(article.createdAt) || parseDate(article.created_at);

  const formatTimeAgo = (date: Date | null) => {
    if (!date || isNaN(date.getTime())) return '';

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  // Get FinBERT sentiment data
  const getFinBERTData = () => {
    if (typeof article.sentiment === 'object' && article.sentiment?.score) {
      return {
        score: article.sentiment.score,
        label: article.sentiment.label || 'neutral',
        hasScore: true
      };
    }
    return {
      score: 0,
      label: typeof article.sentiment === 'string' ? article.sentiment : 'neutral',
      hasScore: false
    };
  };

  const finbertData = getFinBERTData();
  const sentimentColor = getSentimentColor(article.sentiment);
  const timeAgo = formatTimeAgo(publishedDate || createdDate);
  const hasImage = article.urlToImage && !imageError;

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-start gap-4">
        {/* Image Section */}
        <div className="flex-shrink-0">
          {hasImage ? (
            <img
              src={article.urlToImage}
              alt={article.title}
              className="w-24 h-18 sm:w-32 sm:h-24 rounded-lg object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-24 h-18 sm:w-32 sm:h-24 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Importance bar if needed */}
          {showImportanceBar && article.importance_score !== undefined && (
            <ImportanceBar score={article.importance_score} />
          )}

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight">
            <Link
              to={`/article/${article.id}`}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {article.title}
            </Link>
          </h3>

          {/* Description */}
          {article.description && (
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
              {article.description}
            </p>
          )}

          {/* Meta info row */}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3 flex-wrap">
            {/* Source */}
            <div className="flex items-center gap-1">
              <span className="font-medium">
                {typeof article.source === 'string'
                  ? article.source
                  : article.source?.name || 'Fuente desconocida'}
              </span>
            </div>

            {/* Time */}
            {timeAgo && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{timeAgo}</span>
              </div>
            )}

            {/* Quality Score */}
            {article.quality_score && (
              <div className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                <span className={`font-medium ${
                  article.quality_score >= 85 ? 'text-green-600 dark:text-green-400' :
                  article.quality_score >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  Q{article.quality_score}
                </span>
                {article.quality_score >= 85 && (
                  <Star className="w-3 h-3 text-amber-500" />
                )}
              </div>
            )}

            {/* FinBERT Sentiment with Score */}
            {article.sentiment && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${sentimentColor}`}>
                <Brain className="w-3 h-3" />
                {isPositiveSentiment(article.sentiment) && <TrendingUp className="w-3 h-3" />}
                {isNegativeSentiment(article.sentiment) && <TrendingDown className="w-3 h-3" />}
                {!isPositiveSentiment(article.sentiment) && !isNegativeSentiment(article.sentiment) && <Activity className="w-3 h-3" />}
                <span className="font-medium">
                  {formatSentiment(article.sentiment)}
                  {finbertData.hasScore && (
                    <span className="ml-1 opacity-75">
                      ({Math.round(finbertData.score * 100)}%)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Tags Section - More comprehensive */}
          <div className="space-y-2">
            {/* Tickers Row */}
            {article.tickers && article.tickers.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <Hash className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Tickers:</span>
                {article.tickers.map((ticker, index) => (
                  <span
                    key={ticker}
                    className="inline-flex items-center px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs font-medium"
                  >
                    ${ticker}
                  </span>
                ))}
              </div>
            )}

            {/* Sectors Row */}
            {article.sectors && article.sectors.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <Shield className="w-3 h-3 text-purple-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Sectores:</span>
                {article.sectors.map((sector, index) => {
                  const sectorName = typeof sector === 'string' ? sector : sector.sector;
                  return (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded text-xs font-medium"
                    >
                      {sectorName}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Topics Row */}
            {article.extracted_entities?.topics && article.extracted_entities.topics.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <Tag className="w-3 h-3 text-green-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Topics:</span>
                {article.extracted_entities.topics.slice(0, 5).map((topic, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded text-xs font-medium"
                  >
                    {topic}
                  </span>
                ))}
                {article.extracted_entities.topics.length > 5 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{article.extracted_entities.topics.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {/* External link */}
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Ver artículo original"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Read more link */}
          <Link
            to={`/article/${article.id}`}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Leer más
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NewsListItem;