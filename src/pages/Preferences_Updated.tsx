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
  TrendingUp,
  Key,
  Sliders,
  AlertCircle,
  Building2,
  Newspaper,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { feedService } from '../services/news/feedService';
import toast from 'react-hot-toast';
import AutocompleteInput from '../components/Preferences/AutocompleteInput';
import { POPULAR_TICKERS, MARKET_SECTORS, TRADING_TOPICS, POPULAR_KEYWORDS } from '../data/marketData';

import type { UserPreferences } from '../types';

interface UserInterests {
  tickers: string[];
  sectors: string[];
  topics: string[];
  marketTypes: string[];
  keywords: string[];
}

const Preferences: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [interests, setInterests] = useState<UserInterests>({
    tickers: [],
    sectors: [],
    topics: [],
    marketTypes: ['stocks'],
    keywords: [],
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    sentimentBias: 'balanced',
    riskTolerance: 'medium',
    timeHorizon: 'medium_term',
    newsFrequency: 'moderate',
    defaultLLMModel: 'openai',
    minRelevanceScore: 30,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUserSettings();
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

      if (interests.tickers.length > 0 || interests.sectors.length > 0 ||
          interests.marketTypes.length > 0 || interests.keywords.length > 0) {
        localStorage.setItem('userHasInterests', 'true');
      }

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

  // Handler functions for autocomplete
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
    setInterests(prev => ({
      ...prev,
      sectors: [...prev.sectors, sector]
    }));
  };

  const removeSector = (sector: string) => {
    setInterests(prev => ({
      ...prev,
      sectors: prev.sectors.filter(s => s !== sector)
    }));
  };

  const addTopic = (topic: string) => {
    setInterests(prev => ({
      ...prev,
      topics: [...prev.topics, topic]
    }));
  };

  const removeTopic = (topic: string) => {
    setInterests(prev => ({
      ...prev,
      topics: prev.topics.filter(t => t !== topic)
    }));
  };

  const addKeyword = (keyword: string) => {
    setInterests(prev => ({
      ...prev,
      keywords: [...prev.keywords, keyword]
    }));
  };

  const removeKeyword = (keyword: string) => {
    setInterests(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
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
          {/* Default AI Model */}
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
                    localStorage.setItem('userDefaultLLM', model.id);
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

          {/* Tickers of Interest */}
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

            <AutocompleteInput
              suggestions={POPULAR_TICKERS}
              selectedItems={interests.tickers}
              onAdd={addTicker}
              onRemove={removeTicker}
              placeholder="Search for stocks (e.g., AAPL, TSLA, MSFT)"
              color="green"
              allowCustom={true}
            />

            <button
              onClick={handleSaveInterests}
              disabled={isSaving}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t('common.saving') : t('common.saveChanges')}
            </button>
          </motion.div>

          {/* Market Sectors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('preferences.sectorsOfInterest')}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t('preferences.sectorsDescription')}
            </p>

            <AutocompleteInput
              suggestions={MARKET_SECTORS}
              selectedItems={interests.sectors}
              onAdd={addSector}
              onRemove={removeSector}
              placeholder="Search for sectors (e.g., Technology, Healthcare, Finance)"
              color="purple"
              allowCustom={false}
            />

            <button
              onClick={handleSaveInterests}
              disabled={isSaving}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t('common.saving') : t('common.saveChanges')}
            </button>
          </motion.div>

          {/* Trading Topics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Newspaper className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('preferences.topicsOfInterest')}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t('preferences.topicsDescription')}
            </p>

            <AutocompleteInput
              suggestions={TRADING_TOPICS}
              selectedItems={interests.topics}
              onAdd={addTopic}
              onRemove={removeTopic}
              placeholder="Search for topics (e.g., Earnings, IPOs, Options)"
              color="blue"
              allowCustom={true}
            />

            <button
              onClick={handleSaveInterests}
              disabled={isSaving}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t('common.saving') : t('common.saveChanges')}
            </button>
          </motion.div>

          {/* Keywords */}
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

            <AutocompleteInput
              suggestions={POPULAR_KEYWORDS}
              selectedItems={interests.keywords}
              onAdd={addKeyword}
              onRemove={removeKeyword}
              placeholder="Search for keywords (e.g., Breaking, Rally, Earnings)"
              color="indigo"
              allowCustom={true}
            />

            <button
              onClick={handleSaveInterests}
              disabled={isSaving}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t('common.saving') : t('common.saveChanges')}
            </button>
          </motion.div>

          {/* Market Types - Keep as checkboxes */}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {['stocks', 'crypto', 'forex'].map((marketType) => (
                <label key={marketType} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={interests.marketTypes.includes(marketType)}
                    onChange={() => toggleMarketType(marketType)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-gray-900 dark:text-gray-100 capitalize">
                    {marketType === 'stocks' ? t('preferences.stocks') : marketType === 'crypto' ? t('preferences.crypto') : t('preferences.forex')}
                  </span>
                </label>
              ))}
            </div>

            <button
              onClick={handleSaveInterests}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t('common.saving') : t('common.saveChanges')}
            </button>
          </motion.div>

          {/* Relevance Score - Keep as is */}
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
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
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

          {/* Trading Preferences - Keep as is */}
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