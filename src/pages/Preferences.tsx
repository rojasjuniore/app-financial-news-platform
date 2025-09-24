import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Hash,
  Target,
  BarChart3,
  Save,
  Plus,
  X,
  TrendingUp,
  Key,
  Sliders,
  AlertCircle,
  Building2,
  Newspaper,
  Check,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { feedService } from '../services/news/feedService';
import toast from 'react-hot-toast';
import AutocompleteInputAPI from '../components/Preferences/AutocompleteInputAPI';

import type { UserPreferences } from '../types';

interface UserInterests {
  tickers: string[];
  sectors: string[];
  topics: string[];
  marketTypes: string[];
  keywords: string[]; // NUEVO: Palabras clave personalizadas
}

const Preferences: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // Estados para configuraciones funcionales con la API
  const [interests, setInterests] = useState<UserInterests>({
    tickers: [],
    sectors: [],
    topics: [],
    marketTypes: ['stocks'],
    keywords: [], // NUEVO: Palabras clave
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    sentimentBias: 'balanced',
    riskTolerance: 'medium',
    timeHorizon: 'medium_term',
    newsFrequency: 'moderate',
    defaultLLMModel: 'openai',
    minRelevanceScore: 30, // NUEVO: Score mínimo de relevancia
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State for input fields (for sectors, topics, keywords that don't use autocomplete yet)
  const [newSector, setNewSector] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  // Cargar configuraciones actuales del usuario
  useEffect(() => {
    loadUserSettings();
    // Load default LLM from localStorage if exists
    const savedLLM = localStorage.getItem('userDefaultLLM');
    if (savedLLM) {
      setPreferences(prev => ({ ...prev, defaultLLMModel: savedLLM as any }));
    }
  }, []);

  const loadUserSettings = async () => {
    try {
      setIsLoading(true);
      
      if (!user) {
        console.log('⚠️ User not authenticated');
        return;
      }
      
      console.log('🔄 Loading user settings...');
      console.log('👤 Current user:', user.email);
      
      const profile = await feedService.getProfile();
      console.log('📋 Profile loaded:', profile);
      
      if (profile && profile.interests) {
        console.log('✅ Loading interests:', profile.interests);
        setInterests({
          tickers: profile.interests.tickers || [],
          sectors: profile.interests.sectors || [],
          topics: profile.interests.topics || [],
          marketTypes: profile.interests.marketTypes || [],
          keywords: profile.interests.keywords || []
        });

        // Mark if user has interests configured
        const hasInterests = ((profile.interests.tickers?.length || 0) > 0 ||
                            (profile.interests.sectors?.length || 0) > 0 ||
                            (profile.interests.marketTypes?.length || 0) > 0 ||
                            (profile.interests.keywords?.length || 0) > 0);
        if (hasInterests) {
          localStorage.setItem('userHasInterests', 'true');
        }
      }
      
      if (profile && profile.preferences) {
        console.log('✅ Loading preferences:', profile.preferences);
        setPreferences({
          ...profile.preferences,
          defaultLLMModel: profile.preferences.defaultLLMModel || 'openai'
        });
      }
      
    } catch (error: any) {
      console.error('❌ Error loading settings:', error);
      if (error.response?.status === 401) {
        toast.error(t('errors.unauthorized'));
      } else {
        toast.error(`Error loading settings: ${error.response?.data?.error || error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveInterests = async () => {
    try {
      setIsSaving(true);
      
      if (!user) {
        toast.error(t('errors.loginRequired'));
        return;
      }
      
      console.log('💾 Saving interests:', interests);
      const result = await feedService.updateInterests(interests);
      console.log('✅ Interests save result:', result);

      // Mark that user has interests if they have at least one configured
      if (interests.tickers.length > 0 || interests.sectors.length > 0 ||
          interests.marketTypes.length > 0 || interests.keywords.length > 0) {
        localStorage.setItem('userHasInterests', 'true');
      }

      // Invalidate profile cache to force reload
      await queryClient.invalidateQueries({ queryKey: ['profile'] });

      toast.success(t('settings.changesSaved'));
    } catch (error: any) {
      console.error('❌ Error updating interests:', error);
      if (error.response?.status === 401) {
        toast.error(t('errors.unauthorized'));
      } else {
        toast.error(t('errors.updateFailed'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);
      
      if (!user) {
        toast.error(t('errors.loginRequired'));
        return;
      }
      
      console.log('💾 Saving preferences:', preferences);
      const result = await feedService.updatePreferences(preferences);
      console.log('✅ Preferences save result:', result);
      toast.success(t('settings.changesSaved'));
    } catch (error: any) {
      console.error('❌ Error updating preferences:', error);
      if (error.response?.status === 401) {
        toast.error(t('errors.unauthorized'));
      } else {
        toast.error(t('errors.updateFailed'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const addTicker = (ticker: string) => {
    setInterests(prev => ({
      ...prev,
      tickers: [...prev.tickers, ticker]
    }));
  };

  const removeTicker = (ticker: string) => {
    setInterests(prev => ({
      ...prev,
      tickers: prev.tickers.filter(t => t !== ticker)
    }));
  };

  const addSector = (sector: string) => {
    if (!interests.sectors.includes(sector)) {
      setInterests(prev => ({
        ...prev,
        sectors: [...prev.sectors, sector]
      }));
    }
  };

  const removeSector = (sector: string) => {
    setInterests(prev => ({
      ...prev,
      sectors: prev.sectors.filter(s => s !== sector)
    }));
  };

  const addTopic = (topic: string) => {
    if (!interests.topics.includes(topic)) {
      setInterests(prev => ({
        ...prev,
        topics: [...prev.topics, topic]
      }));
    }
  };

  const removeTopic = (topic: string) => {
    setInterests(prev => ({
      ...prev,
      topics: prev.topics.filter(t => t !== topic)
    }));
  };

  const toggleMarketType = (marketType: string) => {
    setInterests(prev => ({
      ...prev,
      marketTypes: prev.marketTypes.includes(marketType)
        ? prev.marketTypes.filter(m => m !== marketType)
        : [...prev.marketTypes, marketType]
    }));
  };

  const addKeyword = (keyword: string) => {
    if (!interests.keywords.includes(keyword)) {
      setInterests(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword]
      }));
    }
  };

  const removeKeyword = (keyword: string) => {
    setInterests(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('errors.unauthorized')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('preferences.loginRequired')}
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('auth.signIn')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('preferences.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('preferences.description')}
          </p>
        </div>

        <div className="space-y-6">
          {/* Modelo LLM por defecto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('preferences.defaultAIModel')}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t('preferences.defaultAIModelDescription')}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'openai' as const, name: 'GPT-4', icon: '🤖', color: 'green' },
                { id: 'claude' as const, name: 'Claude', icon: '🧠', color: 'purple' },
                { id: 'gemini' as const, name: 'Gemini', icon: '✨', color: 'blue' },
                { id: 'grok' as const, name: 'Grok', icon: '⚡', color: 'orange' }
              ].map((model) => (
                <button
                  key={model.id}
                  onClick={async () => {
                    const newPreferences = { ...preferences, defaultLLMModel: model.id };
                    setPreferences(newPreferences);
                    // Save to localStorage for immediate use
                    localStorage.setItem('userDefaultLLM', model.id);
                    // Save to backend
                    try {
                      setIsSaving(true);
                      if (user) {
                        await feedService.updatePreferences(newPreferences);
                        toast.success(t('settings.changesSaved'));
                      }
                    } catch (error) {
                      console.error('Error saving LLM preference:', error);
                      toast.error(t('errors.generic'));
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    preferences.defaultLLMModel === model.id
                      ? `border-${model.color}-500 bg-${model.color}-50 dark:bg-${model.color}-900/20`
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="text-2xl mb-1">{model.icon}</div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white">{model.name}</div>
                  {preferences.defaultLLMModel === model.id && (
                    <div className={`text-xs text-${model.color}-600 dark:text-${model.color}-400 mt-1`}>
                      {t('common.selected')}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Intereses - Tickers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Hash className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('preferences.tickersOfInterest')}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t('preferences.tickersDescription')}
            </p>

            <AutocompleteInputAPI
              dataType="tickers"
              selectedItems={interests.tickers}
              onAdd={addTicker}
              onRemove={removeTicker}
              placeholder="Search by ticker or company name (e.g., Apple, AAPL, Tesla)"
              color="green"
              allowCustom={true}
              label="Add stocks, crypto, forex, commodities, ETFs, and more"
              icon={<Building2 className="w-4 h-4 text-green-600 dark:text-green-400" />}
            />

            {/* Quick Add Popular Tickers */}
            <div className="mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick add popular:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { ticker: 'AAPL', name: 'Apple', type: '📱' },
                  { ticker: 'NVDA', name: 'NVIDIA', type: '🎮' },
                  { ticker: 'TSLA', name: 'Tesla', type: '🚗' },
                  { ticker: 'BTC-USD', name: 'Bitcoin', type: '₿' },
                  { ticker: 'ETH-USD', name: 'Ethereum', type: '💎' },
                  { ticker: 'EUR/USD', name: 'Euro/Dollar', type: '💱' },
                  { ticker: 'GOLD', name: 'Gold', type: '🥇' },
                  { ticker: 'SPY', name: 'S&P 500 ETF', type: '📊' }
                ].map((item) => {
                  const isSelected = interests.tickers.includes(item.ticker);
                  return (
                    <button
                      key={item.ticker}
                      onClick={() => !isSelected && addTicker(item.ticker)}
                      disabled={isSelected}
                      className={`px-3 py-1 text-sm rounded-full transition-colors flex items-center gap-1 ${
                        isSelected
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/30'
                      }`}
                    >
                      <span>{item.type}</span>
                      <span className="font-medium">{item.ticker}</span>
                      <span className="text-xs opacity-75">({item.name})</span>
                      {!isSelected && <Plus className="w-3 h-3 ml-1" />}
                      {isSelected && <Check className="w-3 h-3 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleSaveInterests}
              disabled={isSaving}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t('common.saving') : t('common.saveChanges')}
            </button>
          </motion.div>

          {/* Intereses - Sectores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('preferences.sectorsOfInterest')}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t('preferences.sectorsDescription')}
            </p>
            
            <AutocompleteInputAPI
              dataType="sectors"
              selectedItems={interests.sectors}
              onAdd={addSector}
              onRemove={removeSector}
              placeholder={t('preferences.sectorPlaceholder')}
              color="purple"
              allowCustom={false}
            />

            {/* Quick Add Popular Sectors */}
            <div className="mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick add popular:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'technology', name: 'Technology', icon: '💻' },
                  { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
                  { id: 'financials', name: 'Financials', icon: '🏦' },
                  { id: 'energy', name: 'Energy', icon: '⚡' },
                  { id: 'consumer-discretionary', name: 'Consumer', icon: '🛒' },
                  { id: 'industrials', name: 'Industrials', icon: '🏭' },
                  { id: 'real-estate', name: 'Real Estate', icon: '🏠' },
                  { id: 'materials', name: 'Materials', icon: '🪨' }
                ].map((sector) => {
                  const isSelected = interests.sectors.includes(sector.id);
                  return (
                    <button
                      key={sector.id}
                      onClick={() => !isSelected && addSector(sector.id)}
                      disabled={isSelected}
                      className={`px-3 py-1 text-sm rounded-full transition-colors flex items-center gap-1 ${
                        isSelected
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/30'
                      }`}
                    >
                      <span>{sector.icon}</span>
                      <span className="font-medium">{sector.name}</span>
                      {!isSelected && <Plus className="w-3 h-3 ml-1" />}
                      {isSelected && <Check className="w-3 h-3 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleSaveInterests}
              disabled={isSaving}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t('common.saving') : t('common.saveChanges')}
            </button>
          </motion.div>

          {/* Intereses - Temas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('preferences.topicsOfInterest')}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t('preferences.topicsDescription')}
            </p>
            
            <AutocompleteInputAPI
              dataType="topics"
              selectedItems={interests.topics}
              onAdd={addTopic}
              onRemove={removeTopic}
              placeholder={t('preferences.topicPlaceholder')}
              color="blue"
              allowCustom={true}
            />

            {/* Quick Add Popular Topics */}
            <div className="mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick add popular:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'artificial-intelligence', name: 'AI', icon: '🤖' },
                  { id: 'earnings', name: 'Earnings', icon: '📊' },
                  { id: 'mergers-acquisitions', name: 'M&A', icon: '🤝' },
                  { id: 'ipo', name: 'IPO', icon: '🎯' },
                  { id: 'regulation', name: 'Regulation', icon: '⚖️' },
                  { id: 'climate-change', name: 'Climate', icon: '🌍' },
                  { id: 'inflation', name: 'Inflation', icon: '📈' },
                  { id: 'federal-reserve', name: 'Fed', icon: '🏛️' }
                ].map((topic) => {
                  const isSelected = interests.topics.includes(topic.id);
                  return (
                    <button
                      key={topic.id}
                      onClick={() => !isSelected && addTopic(topic.id)}
                      disabled={isSelected}
                      className={`px-3 py-1 text-sm rounded-full transition-colors flex items-center gap-1 ${
                        isSelected
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/30'
                      }`}
                    >
                      <span>{topic.icon}</span>
                      <span className="font-medium">{topic.name}</span>
                      {!isSelected && <Plus className="w-3 h-3 ml-1" />}
                      {isSelected && <Check className="w-3 h-3 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleSaveInterests}
              disabled={isSaving}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t('common.saving') : t('common.saveChanges')}
            </button>
          </motion.div>

          {/* Keywords Personalizadas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('preferences.keywords')}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t('preferences.keywordsDescription')}
            </p>
            
            <AutocompleteInputAPI
              dataType="keywords"
              selectedItems={interests.keywords}
              onAdd={addKeyword}
              onRemove={removeKeyword}
              placeholder={t('preferences.keywordPlaceholder')}
              color="indigo"
              allowCustom={true}
            />

            {/* Quick Add Popular Keywords */}
            <div className="mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick add popular:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'breaking', name: 'Breaking', icon: '⚡' },
                  { id: 'analysis', name: 'Analysis', icon: '🔍' },
                  { id: 'forecast', name: 'Forecast', icon: '🔮' },
                  { id: 'exclusive', name: 'Exclusive', icon: '🎯' },
                  { id: 'profit', name: 'Profit', icon: '💰' },
                  { id: 'loss', name: 'Loss', icon: '📉' },
                  { id: 'growth', name: 'Growth', icon: '🚀' },
                  { id: 'recession', name: 'Recession', icon: '⚠️' }
                ].map((keyword) => {
                  const isSelected = interests.keywords.includes(keyword.id);
                  return (
                    <button
                      key={keyword.id}
                      onClick={() => !isSelected && addKeyword(keyword.id)}
                      disabled={isSelected}
                      className={`px-3 py-1 text-sm rounded-full transition-colors flex items-center gap-1 ${
                        isSelected
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/30'
                      }`}
                    >
                      <span>{keyword.icon}</span>
                      <span className="font-medium">{keyword.name}</span>
                      {!isSelected && <Plus className="w-3 h-3 ml-1" />}
                      {isSelected && <Check className="w-3 h-3 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleSaveInterests}
              disabled={isSaving}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t('common.saving') : t('common.saveChanges')}
            </button>
          </motion.div>

          {/* Tipos de Mercado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('preferences.marketTypes')}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t('preferences.marketTypesDescription')}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { id: 'stocks', name: 'Stocks', icon: '📈', description: 'US & International equities' },
                { id: 'crypto', name: 'Crypto', icon: '₿', description: 'Digital currencies & tokens' },
                { id: 'forex', name: 'Forex', icon: '💱', description: 'Currency pairs' },
                { id: 'commodities', name: 'Commodities', icon: '🛢️', description: 'Gold, oil, agriculture' },
                { id: 'etfs', name: 'ETFs', icon: '📊', description: 'Exchange-traded funds' },
                { id: 'indices', name: 'Indices', icon: '📉', description: 'Market indices' },
                { id: 'bonds', name: 'Bonds', icon: '📜', description: 'Fixed income securities' },
                { id: 'reits', name: 'REITs', icon: '🏢', description: 'Real estate trusts' }
              ].map((market) => (
                <div
                  key={market.id}
                  onClick={() => toggleMarketType(market.id)}
                  className={`cursor-pointer rounded-lg border-2 p-3 transition-all duration-200 ${
                    interests.marketTypes.includes(market.id)
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl">{market.icon}</span>
                    {interests.marketTypes.includes(market.id) && (
                      <Check className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    )}
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {market.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {market.description}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setInterests(prev => ({
                  ...prev,
                  marketTypes: ['stocks', 'crypto', 'forex', 'commodities', 'etfs', 'indices', 'bonds', 'reits']
                }))}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Select All
              </button>
              <span className="text-gray-400">•</span>
              <button
                onClick={() => setInterests(prev => ({
                  ...prev,
                  marketTypes: []
                }))}
                className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
              >
                Clear All
              </button>
              <span className="text-gray-400">•</span>
              <button
                onClick={() => setInterests(prev => ({
                  ...prev,
                  marketTypes: ['stocks', 'crypto', 'etfs', 'indices'] // Popular markets
                }))}
                className="text-sm text-orange-600 dark:text-orange-400 hover:underline"
              >
                Quick Add Popular
              </button>
            </div>

            <button
              onClick={handleSaveInterests}
              disabled={isSaving}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t('common.saving') : t('common.saveChanges')}
            </button>
          </motion.div>

          {/* Score Mínimo de Relevancia */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Sliders className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('preferences.relevanceScore')}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t('preferences.relevanceScoreDescription')}
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('preferences.minimumRelevanceRequired')}: 
                  </span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 ml-2">
                    {preferences.minRelevanceScore || 30}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {(preferences.minRelevanceScore ?? 30) === 0 
                      ? `🌍 ${t('preferences.seeAll')}`
                      : (preferences.minRelevanceScore ?? 30) < 30
                      ? `📨 ${t('preferences.moreContent')}`
                      : (preferences.minRelevanceScore ?? 30) < 60
                      ? `✅ ${t('preferences.balanced')}`
                      : (preferences.minRelevanceScore ?? 30) < 80
                      ? `🎯 ${t('preferences.relevant')}`
                      : `🔥 ${t('preferences.onlyTheBest')}`}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {preferences.minRelevanceScore === 0
                      ? t('preferences.youWillSeeAllArticles')
                      : t('preferences.onlyArticlesAbove', { score: preferences.minRelevanceScore })}
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={preferences.minRelevanceScore || 30}
                  onChange={(e) => setPreferences(prev => ({ 
                    ...prev, 
                    minRelevanceScore: parseInt(e.target.value) 
                  }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                  style={{
                    background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${preferences.minRelevanceScore || 30}%, #E5E7EB ${preferences.minRelevanceScore || 30}%, #E5E7EB 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-2 mb-4">
                <button
                  onClick={() => setPreferences(prev => ({ ...prev, minRelevanceScore: 0 }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    preferences.minRelevanceScore === 0
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {t('preferences.all')}
                </button>
                <button
                  onClick={() => setPreferences(prev => ({ ...prev, minRelevanceScore: 25 }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    preferences.minRelevanceScore === 25
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  25%+
                </button>
                <button
                  onClick={() => setPreferences(prev => ({ ...prev, minRelevanceScore: 50 }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    preferences.minRelevanceScore === 50
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  50%+
                </button>
                <button
                  onClick={() => setPreferences(prev => ({ ...prev, minRelevanceScore: 75 }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    preferences.minRelevanceScore === 75
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  75%+
                </button>
                <button
                  onClick={() => setPreferences(prev => ({ ...prev, minRelevanceScore: 90 }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    preferences.minRelevanceScore === 90
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  90%+
                </button>
              </div>

              <div className={`border rounded-lg p-3 ${
                (preferences.minRelevanceScore ?? 30) === 0
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : (preferences.minRelevanceScore ?? 30) >= 75
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                  : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              }`}>
                <div className="flex items-start gap-2">
                  <AlertCircle className={`w-4 h-4 mt-0.5 ${
                    (preferences.minRelevanceScore ?? 30) === 0
                      ? 'text-blue-600 dark:text-blue-400'
                      : (preferences.minRelevanceScore ?? 30) >= 75
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-green-600 dark:text-green-400'
                  }`} />
                  <div className={`text-sm ${
                    (preferences.minRelevanceScore ?? 30) === 0
                      ? 'text-blue-700 dark:text-blue-300'
                      : (preferences.minRelevanceScore ?? 30) >= 75
                      ? 'text-orange-700 dark:text-orange-300'
                      : 'text-green-700 dark:text-green-300'
                  }`}>
                    <strong>{t('preferences.howItWorks')}:</strong><br/>
                    {(preferences.minRelevanceScore ?? 30) === 0
                      ? t('preferences.seeAllArticlesNoFilter')
                      : (preferences.minRelevanceScore ?? 30) < 50
                      ? t('preferences.balancedFilter', { score: preferences.minRelevanceScore ?? 30 })
                      : (preferences.minRelevanceScore ?? 30) < 75
                      ? t('preferences.focusedFilter', { score: preferences.minRelevanceScore ?? 30 })
                      : t('preferences.strictFilter', { score: preferences.minRelevanceScore ?? 30 })}
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSavePreferences}
              disabled={isSaving}
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t('common.saving') : t('preferences.saveRelevanceFilter')}
            </button>
          </motion.div>

          {/* Preferencias de Trading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('preferences.tradingPreferences')}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t('preferences.tradingDescription')}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('preferences.sentimentBias')}
                </label>
                <select
                  value={preferences.sentimentBias}
                  onChange={(e) => setPreferences(prev => ({ ...prev, sentimentBias: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="bullish">{t('preferences.bullish')}</option>
                  <option value="balanced">{t('preferences.balanced')}</option>
                  <option value="bearish">{t('preferences.bearish')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('preferences.riskTolerance')}
                </label>
                <select
                  value={preferences.riskTolerance}
                  onChange={(e) => setPreferences(prev => ({ ...prev, riskTolerance: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="low">{t('preferences.low')}</option>
                  <option value="medium">{t('preferences.medium')}</option>
                  <option value="high">{t('preferences.high')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('preferences.timeHorizon')}
                </label>
                <select
                  value={preferences.timeHorizon}
                  onChange={(e) => setPreferences(prev => ({ ...prev, timeHorizon: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="day_trading">{t('preferences.dayTrading')}</option>
                  <option value="short_term">{t('preferences.shortTerm')}</option>
                  <option value="medium_term">{t('preferences.mediumTerm')}</option>
                  <option value="long_term">{t('preferences.longTerm')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('preferences.newsFrequency')}
                </label>
                <select
                  value={preferences.newsFrequency}
                  onChange={(e) => setPreferences(prev => ({ ...prev, newsFrequency: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="high">{t('preferences.highFrequency')}</option>
                  <option value="moderate">{t('preferences.moderateFrequency')}</option>
                  <option value="low">{t('preferences.lowFrequency')}</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={handleSavePreferences}
              disabled={isSaving}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t('common.saving') : t('common.saveChanges')}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Preferences;