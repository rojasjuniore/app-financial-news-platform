import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import { Send, Bot, User, X, Loader, MessageCircle, Sparkles, Minimize2, Maximize2, ChevronDown, Brain, Zap, Cpu, Rocket } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

interface ChatWidgetProps {
  articleId: string;
  integrated?: boolean;
}

// Configuración de modelos LLM (se actualizará con traducciones dinámicamente)
const LLM_MODELS_CONFIG = [
  {
    id: 'openai',
    name: 'GPT-4',
    icon: Brain,
    color: 'from-green-500 to-emerald-600',
    descriptionKey: 'chat.preciseConservative',
    badge: 'PRO'
  },
  {
    id: 'claude',
    name: 'Claude 3',
    icon: Bot,
    color: 'from-orange-500 to-red-600',
    descriptionKey: 'chat.detailedStructured',
    badge: 'SMART'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    icon: Zap,
    color: 'from-blue-500 to-indigo-600',
    descriptionKey: 'chat.globalMultimodal',
    badge: 'FAST'
  },
  {
    id: 'grok',
    name: 'Grok',
    icon: Rocket,
    color: 'from-purple-500 to-pink-600',
    descriptionKey: 'chat.directUnique',
    badge: 'BOLD'
  }
];

const ChatWidget: React.FC<ChatWidgetProps> = ({ articleId, integrated = false }) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(!integrated); // Si está integrado, siempre abierto
  const [isMinimized, setIsMinimized] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Crear modelos con traducciones
  const LLM_MODELS = LLM_MODELS_CONFIG.map(model => ({
    ...model,
    description: t(model.descriptionKey)
  }));
  
  // Get default model from localStorage
  const defaultModelId = localStorage.getItem('userDefaultLLM') || 'openai';
  const defaultModel = LLM_MODELS.find(m => m.id === defaultModelId) || LLM_MODELS[0];
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  
  const {
    messages,
    sendMessage,
    isLoading,
    isSessionLoading
  } = useChat(articleId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for changes in default model preference
  useEffect(() => {
    const handleStorageChange = () => {
      const newDefaultModelId = localStorage.getItem('userDefaultLLM') || 'openai';
      const newDefaultModel = LLM_MODELS.find(m => m.id === newDefaultModelId);
      if (newDefaultModel && newDefaultModel.id !== selectedModel.id) {
        setSelectedModel(newDefaultModel);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [selectedModel, LLM_MODELS]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;
    
    const userMessage = message;
    setMessage('');
    sendMessage(userMessage, selectedModel.id);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    `📊 ${t('chat.quickPrompts.analyzeMarket')}`,
    `💡 ${t('chat.quickPrompts.recommendation')}`,
    `🔍 ${t('chat.quickPrompts.relatedNews')}`,
    `📈 ${t('chat.quickPrompts.technicalIndicators')}`
  ];

  // Renderizado para modo integrado
  if (integrated) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-800 transition-colors">
        {/* Header integrado */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <selectedModel.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                {t('chat.aiAssistant')} 
                <Sparkles className="w-4 h-4" />
              </h3>
              <p className="text-xs text-white/80">{t('chat.realTimeAnalysis')}</p>
            </div>
          </div>
          
          {/* Selector de Modelo */}
          <div className="relative">
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 group"
            >
              <div className={`w-6 h-6 bg-gradient-to-r ${selectedModel.color} rounded-lg flex items-center justify-center`}>
                <selectedModel.icon className="w-3 h-3 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{selectedModel.name}</span>
                <span className="text-xs text-white/70">{selectedModel.badge}</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showModelSelector ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown del selector */}
            {showModelSelector && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{t('chat.selectAIModel')}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('chat.eachModelUniqueAnalysis')}</p>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {LLM_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model);
                        setShowModelSelector(false);
                      }}
                      className={`w-full flex items-center space-x-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 ${
                        selectedModel.id === model.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-r-2 border-indigo-500' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 bg-gradient-to-r ${model.color} rounded-xl flex items-center justify-center`}>
                        <model.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center space-x-2">
                          <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{model.name}</h5>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-md bg-gradient-to-r ${model.color} text-white`}>
                            {model.badge}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{model.description}</p>
                      </div>
                      {selectedModel.id === model.id && (
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages integrado */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50 transition-colors">
          {isSessionLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <Loader className="animate-spin w-10 h-10 text-indigo-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors duration-300">{t('chat.preparingAssistant')}</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mb-4 transition-colors duration-300">
                <Bot className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-300">
                {t('chat.greeting')}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 transition-colors duration-300">
                {t('chat.greetingDescription')}
              </p>
              
              {/* Quick prompts integrado */}
              <div className="w-full space-y-2">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setMessage(prompt.substring(2).trim())}
                    className="w-full text-left px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 group"
                  >
                    <span className="text-gray-700 dark:text-gray-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors duration-200">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className={`flex items-start space-x-2 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.role === 'user' 
                          ? 'bg-gradient-to-br from-indigo-600 to-purple-600' 
                          : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600'
                      } transition-colors duration-300`}>
                        {msg.role === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-gray-700 dark:text-gray-300 transition-colors duration-300" />
                        )}
                      </div>
                      
                      <div className={`px-4 py-3 rounded-2xl transition-colors duration-300 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                          : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200'
                      }`}>
                        {msg.role === 'user' ? (
                          <p className="text-sm">{msg.content}</p>
                        ) : (
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {msg.timestamp && (
                      <p className={`text-xs text-gray-400 mt-1 ${
                        msg.role === 'user' ? 'text-right mr-10' : 'ml-10'
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center transition-colors duration-300">
                      <Bot className="w-4 h-4 text-gray-700 dark:text-gray-300 transition-colors duration-300" />
                    </div>
                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-4 py-3 rounded-2xl transition-colors duration-300">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input integrado */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-300">
          <div className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('chat.placeholder')}
              className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !message.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px]"
            >
              {isLoading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizado original para modo flotante
  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 z-50 ${isOpen ? 'scale-0' : 'scale-100'}`}
        aria-label={t('chat.openChat')}
      >
        <MessageCircle className="w-6 h-6" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl dark:shadow-gray-900/40 flex flex-col z-50 transition-all duration-300 ${
          isMinimized ? 'w-80 h-16' : 'w-[380px] h-[600px]'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-3xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                <selectedModel.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  {t('chat.aiAssistant')} 
                  <Sparkles className="w-4 h-4" />
                </h3>
                {!isMinimized && <p className="text-xs text-white/80">{t('chat.alwaysReady')}</p>}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {!isMinimized && (
                <div className="relative">
                  <button
                    onClick={() => setShowModelSelector(!showModelSelector)}
                    className="flex items-center space-x-2 px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 group"
                  >
                    <div className={`w-5 h-5 bg-gradient-to-r ${selectedModel.color} rounded-md flex items-center justify-center`}>
                      <selectedModel.icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-medium">{selectedModel.name}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showModelSelector ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown del selector flotante */}
                  {showModelSelector && (
                    <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                      <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{t('chat.selectAIModel')}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('chat.eachModelUnique')}</p>
                      </div>
                      
                      <div className="max-h-80 overflow-y-auto">
                        {LLM_MODELS.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setSelectedModel(model);
                              setShowModelSelector(false);
                            }}
                            className={`w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 ${
                              selectedModel.id === model.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-r-2 border-indigo-500' : ''
                            }`}
                          >
                            <div className={`w-8 h-8 bg-gradient-to-r ${model.color} rounded-lg flex items-center justify-center`}>
                              <model.icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="flex items-center space-x-2">
                                <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{model.name}</h5>
                                <span className={`px-1.5 py-0.5 text-xs font-medium rounded bg-gradient-to-r ${model.color} text-white`}>
                                  {model.badge}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{model.description}</p>
                            </div>
                            {selectedModel.id === model.id && (
                              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
                {isSessionLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-center">
                      <Loader className="animate-spin w-10 h-10 text-indigo-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors duration-300">{t('chat.preparingAssistant')}</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mb-4 transition-colors duration-300">
                      <Bot className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-300">
                      {t('chat.greeting')}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 transition-colors duration-300">
                      {t('chat.greetingDescription')}
                    </p>
                    
                    {/* Quick prompts */}
                    <div className="w-full space-y-2">
                      {quickPrompts.map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => setMessage(prompt.substring(2).trim())}
                          className="w-full text-left px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 group"
                        >
                          <span className="text-gray-700 dark:text-gray-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors duration-200">{prompt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                          <div className={`flex items-start space-x-2 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              msg.role === 'user' 
                                ? 'bg-gradient-to-br from-indigo-600 to-purple-600' 
                                : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600'
                            } transition-colors duration-300`}>
                              {msg.role === 'user' ? (
                                <User className="w-4 h-4 text-white" />
                              ) : (
                                <Bot className="w-4 h-4 text-gray-700 dark:text-gray-300 transition-colors duration-300" />
                              )}
                            </div>
                            
                            <div className={`px-4 py-3 rounded-2xl transition-colors duration-300 ${
                              msg.role === 'user'
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200'
                            }`}>
                              {msg.role === 'user' ? (
                                <p className="text-sm">{msg.content}</p>
                              ) : (
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {msg.timestamp && (
                            <p className={`text-xs text-gray-400 mt-1 ${
                              msg.role === 'user' ? 'text-right mr-10' : 'ml-10'
                            }`}>
                              {new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="flex items-start space-x-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center transition-colors duration-300">
                            <Bot className="w-4 h-4 text-gray-700 dark:text-gray-300 transition-colors duration-300" />
                          </div>
                          <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-4 py-3 rounded-2xl transition-colors duration-300">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                              <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-3xl transition-colors duration-300">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t('chat.placeholder')}
                    className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !message.trim()}
                    className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px]"
                  >
                    {isLoading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2 transition-colors duration-300">
                  {t('chat.poweredByAI')}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;