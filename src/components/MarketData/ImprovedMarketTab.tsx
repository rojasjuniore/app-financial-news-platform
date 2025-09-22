import React from 'react';
import {
  Activity,
  BarChart3,
  DollarSign,
  ExternalLink,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Loader,
  RefreshCw,
  Shield
} from 'lucide-react';
import { Article } from '../../types';
import PolygonDataCardFixed from '../Analysis/PolygonDataCardFixed';

interface ImprovedMarketTabProps {
  article: Article;
  parsedAnalysis: any;
  generateAnalysisMutation: any;
  selectedAI: 'openai' | 'claude' | 'gemini' | 'grok';
}

const ImprovedMarketTab: React.FC<ImprovedMarketTabProps> = ({
  article,
  parsedAnalysis,
  generateAnalysisMutation,
  selectedAI
}) => {
  const hasTickers = article.tickers && article.tickers.length > 0;
  const hasPolygonData = article.llm_analysis?.polygon_data;
  const hasTechnicalAnalysis = article.llm_analysis?.technical_analysis || parsedAnalysis?.technical_analysis;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-green-500" />
          Market Data {hasTickers && `- ${article.tickers![0]}`}
        </h2>
      </div>

      <div className="p-6">
        {hasTickers ? (
          <div className="space-y-6">
            {/* Tickers Overview Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-500" />
                Mentioned Tickers
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {article.tickers!.map(ticker => (
                  <div key={ticker} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        ${ticker}
                      </span>
                      <a
                        href={`https://finance.yahoo.com/quote/${ticker}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 transition-colors"
                        title="View on Yahoo Finance"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <BarChart3 className="w-3 h-3" />
                        <span>Click for live data</span>
                      </div>
                      {/* Show sector if available */}
                      {article.sectors && article.sectors.length > 0 && (
                        <div className="text-purple-600 dark:text-purple-400">
                          {typeof article.sectors[0] === 'string' ? article.sectors[0] : article.sectors[0].sector}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Sentiment Section */}
            {article.sentiment && (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Market Sentiment Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Article Sentiment:</span>
                    <div className="flex items-center gap-2">
                      {(typeof article.sentiment === 'string' ? article.sentiment : article.sentiment?.label || '').toLowerCase().includes('bullish') ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (typeof article.sentiment === 'string' ? article.sentiment : article.sentiment?.label || '').toLowerCase().includes('bearish') ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : (
                        <Activity className="w-4 h-4 text-gray-500" />
                      )}
                      <span className={`font-semibold ${
                        (typeof article.sentiment === 'string' ? article.sentiment : article.sentiment?.label || '').toLowerCase().includes('bullish')
                          ? 'text-green-600 dark:text-green-400'
                          : (typeof article.sentiment === 'string' ? article.sentiment : article.sentiment?.label || '').toLowerCase().includes('bearish')
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {typeof article.sentiment === 'string' ? article.sentiment : article.sentiment?.label || 'Neutral'}
                      </span>
                    </div>
                  </div>
                  {typeof article.sentiment === 'object' && article.sentiment?.score && (
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Confidence:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                            style={{ width: `${article.sentiment.score * 100}%` }}
                          />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {(article.sentiment.score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Real-time Data Section */}
            {hasPolygonData ? (
              <PolygonDataCardFixed
                polygonData={article.llm_analysis!.polygon_data!}
                ticker={article.tickers![0]}
              />
            ) : hasTechnicalAnalysis ? (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Technical Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Market Trend:</span>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {article.llm_analysis?.technical_analysis?.trend || parsedAnalysis?.technical_analysis?.trend || 'Not Available'}
                    </p>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Outlook:</span>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {article.llm_analysis?.technical_analysis?.outlook || parsedAnalysis?.technical_analysis?.outlook || 'Not Available'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-800 dark:text-yellow-300">
                    💡 Tip: Generate fresh analysis to get real-time prices and advanced technical indicators
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-6 text-center border border-yellow-200 dark:border-yellow-800">
                <BarChart3 className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Real-Time Data Not Loaded
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Generate AI analysis to fetch live prices, volume data, and technical indicators
                </p>
                <button
                  onClick={() => generateAnalysisMutation.mutate({ aiModel: selectedAI, forceRegenerate: true })}
                  disabled={generateAnalysisMutation.isPending}
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {generateAnalysisMutation.isPending ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Loading Market Data...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Load Live Market Data
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          // No tickers detected
          <div className="space-y-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
                No Stock Tickers Detected
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                This article doesn't mention specific stocks or tickers.
                Market data is available for articles that reference tradeable securities like AAPL, TSLA, or GOOGL.
              </p>
            </div>

            {/* Show sectors if available */}
            {article.sectors && article.sectors.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-500" />
                  Related Market Sectors
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {article.sectors.map((sector, index) => {
                    const sectorName = typeof sector === 'string' ? sector : sector.sector;
                    return (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-semibold"
                      >
                        {sectorName}
                      </span>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  These sectors may be impacted by the news discussed in this article
                </p>
              </div>
            )}

            {/* Educational tip */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                How Market Data Works
              </h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Articles mentioning stock tickers enable market data display</li>
                <li>• AI analysis fetches real-time prices from financial APIs</li>
                <li>• Technical indicators help assess market momentum</li>
                <li>• Sentiment analysis provides market mood insights</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImprovedMarketTab;