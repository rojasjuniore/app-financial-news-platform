import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { feedService } from '../services/feedService';
import { FirestoreTimestamp } from '../types';
import { 
  Search as SearchIcon, 
  Loader, 
  Hash, 
  Calendar, 
  Share2, 
  Bookmark,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  // Función para realizar búsqueda
  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => feedService.searchArticles({ q: searchQuery, limit: 50 }),
    enabled: searchQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim().length >= 2) {
      setSearchQuery(searchTerm.trim());
      setSearchParams({ q: searchTerm.trim() });
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchQuery('');
    setSearchParams({});
  };

  const handleShare = async (article: any) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: window.location.origin + `/article/${article.id}`
        });
      } else {
        await navigator.clipboard.writeText(
          `${article.title}\n${window.location.origin}/article/${article.id}`
        );
        toast.success('Enlace copiado al portapapeles');
      }
    } catch (error) {
      console.error('Error compartiendo:', error);
    }
  };

  const handleSaveArticle = (articleId: string) => {
    feedService.saveArticle(articleId);
    toast.success('Artículo guardado');
  };

  const getSentimentIcon = (sentiment?: string) => {
    if (!sentiment) return null;
    
    const s = sentiment.toLowerCase();
    if (s.includes('bullish') || s === 'positive') {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (s.includes('bearish') || s === 'negative') {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const formatTimeAgo = (date: string | FirestoreTimestamp | undefined) => {
    if (!date) return 'Fecha no disponible';
    
    try {
      let articleDate: Date;
      
      if (typeof date === 'string') {
        articleDate = new Date(date);
      } else if ((date as FirestoreTimestamp)._seconds) {
        articleDate = new Date((date as FirestoreTimestamp)._seconds * 1000);
      } else {
        articleDate = new Date(date as any);
      }
      
      if (isNaN(articleDate.getTime())) return 'Fecha no disponible';
      
      return articleDate.toLocaleString('es-ES', { 
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Mexico_City'
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  // Auto-focus en el campo de búsqueda al cargar la página
  useEffect(() => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.focus();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header con buscador */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Buscar Artículos
          </h1>
          
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título, descripción o ticker (ej: AAPL, Tesla, mercado...)"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoComplete="off"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <button
              type="submit"
              disabled={searchTerm.trim().length < 2}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Resultados */}
        <div>
          {searchQuery && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Resultados para: "{searchQuery}"
              </h2>
              {searchResults && (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {searchResults.articles.length} artículos encontrados
                </p>
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center items-center h-32">
              <Loader className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">
                Error realizando la búsqueda
              </p>
            </div>
          )}

          {searchResults && searchResults.articles.length === 0 && (
            <div className="text-center py-12">
              <SearchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Intenta con otros términos de búsqueda
              </p>
            </div>
          )}

          {searchResults && searchResults.articles.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.articles.map((article) => (
                <div 
                  key={article.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all hover:scale-[1.02] overflow-hidden"
                >
                  {/* Imagen */}
                  {article.urlToImage && (
                    <div className="relative">
                      <img
                        src={article.urlToImage}
                        alt={article.title}
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="p-4">
                    {/* Título */}
                    <Link
                      to={`/article/${article.id}`}
                      className="block group mb-2"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 text-sm leading-tight">
                        {article.title}
                      </h3>
                    </Link>

                    {/* Meta información */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span>{typeof article.source === 'string' ? article.source : 'Unknown'}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(article.publishedAt || article.published_at || article.createdAt || article.created_at)}</span>
                      {article.sentiment && (
                        <>
                          <span>•</span>
                          {getSentimentIcon(article.sentiment)}
                        </>
                      )}
                    </div>

                    {/* Descripción */}
                    {article.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-xs line-clamp-2 mb-3">
                        {article.description}
                      </p>
                    )}

                    {/* Tickers */}
                    {article.tickers && article.tickers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {article.tickers.slice(0, 3).map((ticker) => (
                          <span
                            key={ticker}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded text-xs font-medium"
                          >
                            <Hash className="w-2.5 h-2.5" />
                            {ticker}
                          </span>
                        ))}
                        {article.tickers.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                            +{article.tickers.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleShare(article)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all"
                          title="Compartir"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          onClick={() => handleSaveArticle(article.id)}
                          className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-all"
                          title="Guardar"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>

                        {article.url && (
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-full transition-all"
                            title="Leer original"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!searchQuery && (
            <div className="text-center py-12">
              <SearchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Busca artículos financieros
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Encuentra noticias por título, descripción o ticker de acciones
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;