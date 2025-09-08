/**
 * Enhanced Chat Widget Component
 * Integrates WebSocket for real-time updates, conversation threading, and sentiment tracking
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, TrendingUp, TrendingDown, Activity, MessageSquare, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import MessageRenderer from './MessageRenderer';
import { useMessageFormatter } from '../../hooks/useMessageFormatter';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sentiment?: {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  parentMessageId?: string;
  processing?: boolean;
}

interface SentimentTrend {
  shortTerm: string;
  mediumTerm: string;
  overall: string;
}

interface Suggestion {
  type: string;
  text: string;
  confidence: number;
}

interface EnhancedChatWidgetProps {
  articleId: string;
  onClose: () => void;
  isOpen: boolean;
}

const EnhancedChatWidget: React.FC<EnhancedChatWidgetProps> = ({
  articleId,
  onClose,
  isOpen
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { enhanceMessage } = useMessageFormatter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUsersTyping, setOtherUsersTyping] = useState<Set<string>>(new Set());
  const [sentimentTrends, setSentimentTrends] = useState<SentimentTrend | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState(1);
  const [userToken, setUserToken] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get user token
  useEffect(() => {
    const getToken = async () => {
      if (user) {
        try {
          const token = await user.getIdToken();
          setUserToken(token);
        } catch (error) {
          console.error('Failed to get user token:', error);
        }
      }
    };
    getToken();
  }, [user]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isOpen || !user || !userToken) return;

    const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:3000', {
      auth: {
        token: userToken
      },
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Join article room
      socketInstance.emit('join:article', { articleId });
      
      // Subscribe to sentiment updates
      socketInstance.emit('sentiment:subscribe', { articleId });
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    // Handle initial data
    socketInstance.on('article:initial_data', (data) => {
      if (data.recentMessages) {
        setMessages(data.recentMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      }
      setActiveUsers(data.activeUsers || 1);
    });

    // Handle new messages
    socketInstance.on('chat:new_message', (data) => {
      if (data.userId !== user.uid) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'user',
          content: data.message,
          timestamp: new Date(data.timestamp)
        }]);
      }
    });

    // Handle AI responses
    socketInstance.on('chat:ai_response', (data) => {
      setMessages(prev => {
        const newMessages = [...prev];
        const processingIndex = newMessages.findIndex(m => m.processing);
        const enhancedContent = enhanceMessage(data.response);
        if (processingIndex !== -1) {
          newMessages[processingIndex] = {
            ...newMessages[processingIndex],
            content: enhancedContent,
            processing: false
          };
        } else {
          newMessages.push({
            id: data.messageId,
            role: 'assistant',
            content: enhancedContent,
            timestamp: new Date(data.timestamp)
          });
        }
        return newMessages;
      });
      setIsLoading(false);
    });

    // Handle processing status
    socketInstance.on('chat:processing', () => {
      setIsLoading(true);
    });

    // Handle completion with suggestions
    socketInstance.on('chat:complete', (data) => {
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
      if (data.threadId) {
        setThreadId(data.threadId);
      }
      setIsLoading(false);
    });

    // Handle sentiment updates
    socketInstance.on('sentiment:update', (data) => {
      if (data.trends) {
        setSentimentTrends(data.trends);
      }
    });

    // Handle sentiment alerts
    socketInstance.on('sentiment:alert', (data) => {
      console.log('Sentiment alert:', data.alert);
      // Could show a notification here
    });

    // Handle typing indicators
    socketInstance.on('chat:user_typing', (data) => {
      if (data.userId !== user.uid) {
        setOtherUsersTyping(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      }
    });

    // Handle user join/leave
    socketInstance.on('user:left', (data) => {
      setActiveUsers(data.activeUsers);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.emit('leave:article', { articleId });
      socketInstance.disconnect();
    };
  }, [isOpen, articleId, user, userToken]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!socket || !isTyping) {
      setIsTyping(true);
      socket?.emit('chat:typing', { articleId, isTyping: true });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('chat:typing', { articleId, isTyping: false });
    }, 1000);
  }, [socket, articleId, isTyping]);

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !userToken) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);
    setSuggestions([]);

    try {
      // Send via enhanced API
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/enhanced-chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          articleId,
          message: inputMessage,
          threadId,
          sessionContext: {
            selectedModel: 'openai',
            priority: 1
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        // Add AI response with enhanced formatting
        const enhancedContent = enhanceMessage(data.response.message);
        const aiMessage: Message = {
          id: Date.now().toString() + '-ai',
          role: 'assistant',
          content: enhancedContent,
          timestamp: new Date(),
          sentiment: data.sentiment?.current
        };

        setMessages(prev => [...prev, aiMessage]);
        
        if (data.thread) {
          setThreadId(data.thread.threadId);
        }
        
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }
        
        if (data.sentiment?.trends) {
          setSentimentTrends(data.sentiment.trends);
        }
      } else {
        console.error('Failed to send message:', data.error);
        // Add error message
        setMessages(prev => [...prev, {
          id: Date.now().toString() + '-error',
          role: 'system',
          content: t('errors.sendingMessage'),
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-error',
        role: 'system',
        content: 'Network error. Please check your connection.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: Suggestion) => {
    setInputMessage(suggestion.text);
    inputRef.current?.focus();
  };

  // Get sentiment icon
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
      case 'bullish':
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative':
      case 'bearish':
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Enhanced Chat
            </h3>
            {isConnected && (
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <div className="flex items-center space-x-2">
            {activeUsers > 1 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {activeUsers} users
              </span>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sentiment Trends */}
        {sentimentTrends && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">Short:</span>
                {getSentimentIcon(sentimentTrends.shortTerm)}
                <span className="text-gray-700 dark:text-gray-300">
                  {sentimentTrends.shortTerm}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">Medium:</span>
                {getSentimentIcon(sentimentTrends.mediumTerm)}
                <span className="text-gray-700 dark:text-gray-300">
                  {sentimentTrends.mediumTerm}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">Overall:</span>
                {getSentimentIcon(sentimentTrends.overall)}
                <span className="text-gray-700 dark:text-gray-300">
                  {sentimentTrends.overall}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${
                message.role === 'user' 
                  ? 'justify-end' 
                  : message.role === 'system'
                  ? 'justify-center'
                  : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.role === 'system'
                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {message.processing ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    <MessageRenderer content={message.content} role={message.role} />
                    {message.sentiment && (
                      <div className="flex items-center mt-2 space-x-1">
                        {getSentimentIcon(message.sentiment.sentiment)}
                        <span className="text-xs opacity-75">
                          {Math.round(message.sentiment.confidence * 100)}% confident
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ))}
          
          {/* Typing indicator */}
          {otherUsersTyping.size > 0 && (
            <div className="flex items-center space-x-2 text-gray-500 text-sm">
              <div className="flex space-x-1">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>•</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>•</span>
              </div>
              <span>Someone is typing...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="px-4 py-2 border-t dark:border-gray-700">
            <p className="text-xs text-gray-500 mb-2">Suggested replies:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {suggestion.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t dark:border-gray-700">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={userToken ? t('chat.placeholder') : t('chat.placeholderAuthenticating')}
              disabled={isLoading || !userToken}
              className="flex-1 px-3 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim() || !userToken}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          {!userToken && user && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
              Authenticating...
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnhancedChatWidget;