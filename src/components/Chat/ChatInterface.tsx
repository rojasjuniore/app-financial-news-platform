import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, Sparkles, TrendingUp, AlertCircle, X } from 'lucide-react';
import ChatMessageSimple from './ChatMessageSimple';
import { useAuth } from '../../hooks/useAuth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  model?: string;
  sources?: any[];
  tradingPlanDetected?: boolean;
}

interface ChatInterfaceProps {
  articleId: string;
  articleTitle?: string;
  onClose?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ articleId, articleTitle, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();

  // Suggested questions
  const suggestedQuestions = [
    "¿Cuál es mi plan de trading en este artículo?",
    "Analiza el ratio riesgo/recompensa",
    "¿Los puntos de entrada son buenos?",
    "¿Qué dice el análisis técnico?",
    "¿Cuál es el sentimiento del mercado?"
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `¡Hola! 👋 Soy tu asistente de trading con IA. 

Puedo ayudarte a analizar el plan de trading de este artículo, evaluar riesgos, revisar puntos de entrada/salida y más.

${articleTitle ? `**Artículo:** ${articleTitle}\n\n` : ''}¿En qué puedo ayudarte hoy?`,
          timestamp: new Date(),
          model: 'assistant'
        }
      ]);
    }
  }, [articleTitle]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const token = await user?.getIdToken();
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/enhanced/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          articleId,
          message: text,
          sessionContext: {
            language: 'es',
            tradingContext: true,
            noCache: false
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response.message || data.response,
          timestamp: new Date(),
          confidence: data.response.confidence,
          model: data.response.model,
          sources: data.response.sources,
          tradingPlanDetected: data.response.tradingPlanDetected
        };

        setMessages(prev => [...prev, assistantMessage]);

        // If reply suggestions are provided, we could show them
        if (data.suggestions && data.suggestions.length > 0) {
          // Could implement suggestion chips here
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Trading Assistant</h2>
            <p className="text-sm opacity-90">Análisis inteligente en tiempo real</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <ChatMessageSimple key={message.id} message={message} />
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Bot className="w-4 h-4" />
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions (show only at start) */}
      {messages.length <= 1 && (
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preguntas sugeridas:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => sendMessage(question)}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta sobre el plan de trading, análisis técnico, riesgos..."
              className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-800 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              rows={1}
              disabled={isLoading}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <div className="absolute right-2 bottom-2 text-xs text-gray-400">
              {inputValue.length > 0 && `${inputValue.length}/1000`}
            </div>
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              inputValue.trim() && !isLoading
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="hidden sm:inline">Analizando...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">Enviar</span>
              </>
            )}
          </button>
        </div>
        
        {/* Help text */}
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-3 h-3" />
          <span>Enter para enviar, Shift+Enter para nueva línea</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;