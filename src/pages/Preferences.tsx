import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { feedService } from '../services/news/feedService';
import toast from 'react-hot-toast';

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

  // Nuevos tickers/sectores para agregar
  const [newTicker, setNewTicker] = useState('');
  const [newSector, setNewSector] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newKeyword, setNewKeyword] = useState(''); // NUEVO: Para keywords

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
        console.log('⚠️ Usuario no autenticado');
        return;
      }
      
      console.log('🔄 Cargando configuraciones del usuario...');
      console.log('👤 Usuario actual:', user.email);
      
      const profile = await feedService.getProfile();
      console.log('📋 Perfil cargado:', profile);
      
      if (profile && profile.interests) {
        console.log('✅ Cargando intereses:', profile.interests);
        setInterests({
          tickers: profile.interests.tickers || [],
          sectors: profile.interests.sectors || [],
          topics: profile.interests.topics || [],
          marketTypes: profile.interests.marketTypes || [],
          keywords: profile.interests.keywords || []
        });
      }
      
      if (profile && profile.preferences) {
        console.log('✅ Cargando preferencias:', profile.preferences);
        setPreferences({
          ...profile.preferences,
          defaultLLMModel: profile.preferences.defaultLLMModel || 'openai'
        });
      }
      
    } catch (error: any) {
      console.error('❌ Error cargando configuraciones:', error);
      if (error.response?.status === 401) {
        toast.error(t('errors.unauthorized'));
      } else {
        toast.error(`Error cargando configuraciones: ${error.response?.data?.error || error.message}`);
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
      
      console.log('💾 Guardando intereses:', interests);
      const result = await feedService.updateInterests(interests);
      console.log('✅ Resultado guardar intereses:', result);
      toast.success(t('settings.changesSaved'));
    } catch (error: any) {
      console.error('❌ Error actualizando intereses:', error);
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
      
      console.log('💾 Guardando preferencias:', preferences);
      const result = await feedService.updatePreferences(preferences);
      console.log('✅ Resultado guardar preferencias:', result);
      toast.success(t('settings.changesSaved'));
    } catch (error: any) {
      console.error('❌ Error actualizando preferencias:', error);
      if (error.response?.status === 401) {
        toast.error(t('errors.unauthorized'));
      } else {
        toast.error(t('errors.updateFailed'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const addTicker = () => {
    if (newTicker && !interests.tickers.includes(newTicker.toUpperCase())) {
      setInterests(prev => ({
        ...prev,
        tickers: [...prev.tickers, newTicker.toUpperCase()]
      }));
      setNewTicker('');
    }
  };

  const removeTicker = (ticker: string) => {
    setInterests(prev => ({
      ...prev,
      tickers: prev.tickers.filter(t => t !== ticker)
    }));
  };

  const addSector = () => {
    if (newSector && !interests.sectors.includes(newSector.toLowerCase())) {
      setInterests(prev => ({
        ...prev,
        sectors: [...prev.sectors, newSector.toLowerCase()]
      }));
      setNewSector('');
    }
  };

  const removeSector = (sector: string) => {
    setInterests(prev => ({
      ...prev,
      sectors: prev.sectors.filter(s => s !== sector)
    }));
  };

  const addTopic = () => {
    if (newTopic && !interests.topics.includes(newTopic.toLowerCase())) {
      setInterests(prev => ({
        ...prev,
        topics: [...prev.topics, newTopic.toLowerCase()]
      }));
      setNewTopic('');
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

  // NUEVO: Funciones para manejar keywords
  const addKeyword = () => {
    if (newKeyword && !interests.keywords.includes(newKeyword.toLowerCase())) {
      setInterests(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.toLowerCase()]
      }));
      setNewKeyword('');
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
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && addTicker()}
                placeholder={t('preferences.tickerPlaceholder')}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={addTicker}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('common.add')}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {interests.tickers.length > 0 ? (
                interests.tickers.map((ticker) => (
                  <span
                    key={ticker}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-sm"
                  >
                    {ticker}
                    <button
                      onClick={() => removeTicker(ticker)}
                      className="text-green-600 dark:text-green-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <div className="flex flex-wrap gap-2">
                  {['AAPL', 'TSLA', 'MSFT'].map((ticker) => (
                    <span
                      key={ticker}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-sm"
                    >
                      {ticker}
                    </span>
                  ))}
                </div>
              )}
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
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSector()}
                placeholder={t('preferences.sectorPlaceholder')}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={addSector}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('common.add')}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {interests.sectors.map((sector) => (
                <span
                  key={sector}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded-full text-sm capitalize"
                >
                  {sector}
                  <button
                    onClick={() => removeSector(sector)}
                    className="text-purple-600 dark:text-purple-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
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
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTopic()}
                placeholder={t('preferences.topicPlaceholder')}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={addTopic}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('common.add')}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {interests.topics.length > 0 ? (
                interests.topics.map((topic) => (
                  <span
                    key={topic}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm capitalize"
                  >
                    {topic}
                    <button
                      onClick={() => removeTopic(topic)}
                      className="text-blue-600 dark:text-blue-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-sm">
                    trump
                  </span>
                </div>
              )}
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
                {t('preferences.keywords') || 'Palabras Clave'}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t('preferences.keywordsDescription') || 'Agrega palabras clave específicas para filtrar noticias'}
            </p>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                placeholder={t('preferences.keywordPlaceholder') || 'Ej: inflation, recession, growth'}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={addKeyword}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('common.add')}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {interests.keywords && interests.keywords.length > 0 ? (
                interests.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 rounded-full text-sm"
                  >
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <div className="flex flex-wrap gap-2">
                  {['inflation', 'recession', 'IPO'].map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-sm cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/20"
                      onClick={() => {
                        setNewKeyword(keyword);
                        addKeyword();
                      }}
                    >
                      {keyword}
                      <Plus className="w-3 h-3" />
                    </span>
                  ))}
                </div>
              )}
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
                {t('preferences.relevanceScore') || 'Control de Contenido en tu Feed'}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t('preferences.relevanceScoreDescription') || 'Decide qué tan estricto quieres que sea el filtro. Un valor alto muestra solo artículos muy relevantes para ti.'}
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Relevancia Mínima Requerida: 
                  </span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 ml-2">
                    {preferences.minRelevanceScore || 30}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {(preferences.minRelevanceScore ?? 30) === 0 
                      ? '🌍 Ver Todo'
                      : (preferences.minRelevanceScore ?? 30) < 30
                      ? '📨 Más Contenido'
                      : (preferences.minRelevanceScore ?? 30) < 60
                      ? '✅ Balanceado'
                      : (preferences.minRelevanceScore ?? 30) < 80
                      ? '🎯 Relevante'
                      : '🔥 Solo lo Mejor'}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {preferences.minRelevanceScore === 0
                      ? 'Verás todos los artículos'
                      : `Solo artículos ≥${preferences.minRelevanceScore}% relevancia`}
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
                  Todo
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
                    <strong>Cómo funciona:</strong><br/>
                    {(preferences.minRelevanceScore ?? 30) === 0
                      ? 'Verás TODOS los artículos disponibles, sin filtros. Ideal para explorar contenido nuevo.'
                      : (preferences.minRelevanceScore ?? 30) < 50
                      ? `Solo verás artículos con ${preferences.minRelevanceScore ?? 30}% o más de coincidencia con tus intereses. Balance entre cantidad y relevancia.`
                      : (preferences.minRelevanceScore ?? 30) < 75
                      ? `Solo artículos con ${preferences.minRelevanceScore ?? 30}% o más de relevancia. Contenido más enfocado en tus preferencias.`
                      : `Filtro muy estricto: solo artículos con ${preferences.minRelevanceScore ?? 30}% o más de relevancia. Verás menos contenido pero muy personalizado.`}
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
              {isSaving ? t('common.saving') : 'Guardar Filtro de Relevancia'}
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