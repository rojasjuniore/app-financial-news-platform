import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatService } from '../../services/chatService';
import ChatWidget from './ChatWidget';
import { MessageCircle, Plus, Search, Clock, Bot, User, X, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ChatSession } from '../../types';
import '../../styles/chat.css';


interface ChatLayoutProps {
  initialArticleId?: string;
  onClose?: () => void;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ initialArticleId, onClose }) => {
  const { t } = useTranslation();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(initialArticleId || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Obtener historial de chats
  const { data: chatHistory = [], isLoading: isLoadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['chat-history'],
    queryFn: () => chatService.getUserHistory(),
    refetchInterval: 30000 // Actualizar cada 30 segundos
  });

  // Filtrar chats por término de búsqueda
  const filteredChats = chatHistory.filter((chat: ChatSession) =>
    chat.articleTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.articleTickers?.some(ticker => ticker.toLowerCase().includes(searchTerm.toLowerCase())) ||
    false
  );

  // Seleccionar chat inicial si se proporciona
  useEffect(() => {
    if (initialArticleId && !selectedArticleId) {
      setSelectedArticleId(initialArticleId);
    }
  }, [initialArticleId, selectedArticleId]);

  // Auto-actualizar historial cuando se crea una nueva conversación
  useEffect(() => {
    const interval = setInterval(() => {
      refetchHistory();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetchHistory]);

  const handleChatSelect = (chat: ChatSession) => {
    setSelectedChatId(chat.id || chat.sessionId || null);
    setSelectedArticleId(chat.articleId);
  };

  const handleNewChat = () => {
    setSelectedChatId(null);
    setSelectedArticleId(null);
  };

  const formatLastActivity = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace unos minutos';
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    if (diffInHours < 168) return `Hace ${Math.floor(diffInHours / 24)}d`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex z-50">
      {/* Sidebar - Chat History */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col`}>
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-indigo-600" />
              Historial de Chats
            </h2>
            <button
              onClick={handleNewChat}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              title="Nuevo Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar chats..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Lista de Chats */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingHistory ? (
            <div className="p-4 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cargando historial...</p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-4 text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No se encontraron chats' : 'No hay chats aún'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {searchTerm ? 'Intenta con otros términos' : 'Selecciona un artículo para comenzar'}
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredChats.map((chat: ChatSession) => (
                <button
                  key={chat.id || chat.sessionId || `${chat.userId}_${chat.articleId}`}
                  onClick={() => handleChatSelect(chat)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    selectedChatId === chat.id || selectedArticleId === chat.articleId
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700'
                      : 'border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                        {chat.articleTitle || 'Chat sin título'}
                      </h3>
                      {chat.articleTickers && chat.articleTickers.length > 0 && (
                        <div className="flex gap-1 mb-2">
                          {chat.articleTickers.slice(0, 2).map((ticker: string) => (
                            <span
                              key={ticker}
                              className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded"
                            >
                              {ticker}
                            </span>
                          ))}
                          {chat.articleTickers.length > 2 && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                              +{chat.articleTickers.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{formatLastActivity(chat.lastActivity || chat.createdAt || new Date().toISOString())}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <MessageCircle className="w-3 h-3" />
                          <span>{chat.totalMessages || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer del Sidebar */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {filteredChats.length} chat{filteredChats.length !== 1 ? 's' : ''} disponible{filteredChats.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header del Chat Principal */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-indigo-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Asistente de IA Financiero
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedArticleId ? 'Análisis en contexto' : 'Selecciona un artículo para comenzar'}
                </p>
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Chat Content */}
        <div className="flex-1" style={{ minHeight: 0, overflow: 'hidden' }}>
          {selectedArticleId ? (
            <ChatWidget 
              articleId={selectedArticleId} 
              integrated={true}
              key={selectedArticleId} // Forzar re-render cuando cambia el artículo
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md mx-auto p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <Bot className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  ¡Bienvenido al Chat de IA!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Selecciona un artículo del historial o ve a un artículo específico para comenzar a chatear con nuestro asistente de IA financiero.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Bot className="w-4 h-4" />
                    <span>Análisis inteligente con múltiples modelos de IA</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Search className="w-4 h-4" />
                    <span>Búsqueda web en tiempo real</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <MessageCircle className="w-4 h-4" />
                    <span>Historial de conversaciones persistente</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;