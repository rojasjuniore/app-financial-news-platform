import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Moon,
  Sun,
  TrendingUp,
  Hash,
  Target,
  BarChart3,
  Save,
  Plus,
  X,
  Bot,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { feedService } from '../services/feedService';
import toast from 'react-hot-toast';

import type { UserPreferences } from '../types';

interface UserInterests {
  tickers: string[];
  sectors: string[];
  topics: string[];
  marketTypes: string[];
}

const Settings: React.FC = () => {
  const { actualTheme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  const isDarkMode = actualTheme === 'dark';
  
  // Estados para configuraciones funcionales con la API
  const [interests, setInterests] = useState<UserInterests>({
    tickers: [],
    sectors: [],
    topics: [],
    marketTypes: ['stocks'],
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    sentimentBias: 'balanced',
    riskTolerance: 'medium',
    timeHorizon: 'medium_term',
    newsFrequency: 'moderate',
    defaultLLMModel: 'openai',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Nuevos tickers/sectores para agregar
  const [newTicker, setNewTicker] = useState('');
  const [newSector, setNewSector] = useState('');
  const [newTopic, setNewTopic] = useState('');

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
        toast.error(t('errors.unauthorized'));
        return;
      }
      
      console.log('🔄 Cargando configuraciones del usuario...');
      console.log('👤 Usuario actual:', user.email);
      
      const profile = await feedService.getProfile();
      console.log('📋 Perfil cargado:', profile);
      
      if (profile && profile.interests) {
        console.log('✅ Cargando intereses:', profile.interests);
        setInterests(profile.interests);
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
        toast.error('Debes estar logueado para guardar configuraciones');
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
        toast.error(`Error actualizando intereses: ${error.response?.data?.error || error.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);
      
      if (!user) {
        toast.error('Debes estar logueado para guardar configuraciones');
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
        toast.error(`Error actualizando preferencias: ${error.response?.data?.error || error.message}`);
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
            {t('errors.unauthorized')}
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
            {t('settings.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('settings.description')}
          </p>
        </div>

        <div className="space-y-6">
          {/* Tema */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {isDarkMode ? (
                  <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Sun className="w-5 h-5 text-yellow-600" />
                )}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('settings.theme')}
                </h3>
              </div>
              <button
                onClick={toggleTheme}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isDarkMode ? t('nav.lightMode') : t('nav.darkMode')}
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('settings.themeDescription')}
            </p>
          </motion.div>

          {/* Modelo LLM por defecto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('settings.defaultAIModel')}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t('settings.defaultAIModelDescription')}
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
                {t('settings.tickersOfInterest')}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t('settings.tickersDescription')}
            </p>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && addTicker()}
                placeholder={t('settings.tickerPlaceholder')}
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
              {interests.tickers.map((ticker) => (
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
              ))}
            </div>
            
            <button
              onClick={handleSaveInterests}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t('common.saving') : t('settings.saveChanges')}
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
                Sectores de Interés
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Selecciona los sectores económicos que más te interesan
            </p>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSector()}
                placeholder="Ej: technology, healthcare, finance"
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
              {isSaving ? t('common.saving') : t('settings.saveChanges')}
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
                Temas de Interés
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Agrega temas específicos que te interesan en el mundo financiero
            </p>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTopic()}
                placeholder="Ej: earnings, IPO, merger, AI"
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
              {interests.topics.map((topic) => (
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
              ))}
            </div>
            
            <button
              onClick={handleSaveInterests}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t('common.saving') : t('settings.saveChanges')}
            </button>
          </motion.div>

          {/* Tipos de Mercado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tipos de Mercado
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Selecciona los mercados que te interesan
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
                    {marketType === 'stocks' ? 'Acciones' : marketType === 'crypto' ? 'Criptomonedas' : 'Forex'}
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
              {isSaving ? t('common.saving') : t('settings.saveChanges')}
            </button>
          </motion.div>

          {/* Preferencias de Trading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Preferencias de Trading
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Configura tus preferencias para personalizar el contenido del feed
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sesgo de Sentimiento
                </label>
                <select
                  value={preferences.sentimentBias}
                  onChange={(e) => setPreferences(prev => ({ ...prev, sentimentBias: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="bullish">Alcista (más noticias positivas)</option>
                  <option value="balanced">Balanceado</option>
                  <option value="bearish">Bajista (más noticias negativas)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tolerancia al Riesgo
                </label>
                <select
                  value={preferences.riskTolerance}
                  onChange={(e) => setPreferences(prev => ({ ...prev, riskTolerance: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="low">Bajo</option>
                  <option value="medium">Medio</option>
                  <option value="high">Alto</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Horizonte de Tiempo
                </label>
                <select
                  value={preferences.timeHorizon}
                  onChange={(e) => setPreferences(prev => ({ ...prev, timeHorizon: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="day_trading">Day Trading</option>
                  <option value="short_term">Corto Plazo</option>
                  <option value="medium_term">Mediano Plazo</option>
                  <option value="long_term">Largo Plazo</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frecuencia de Noticias
                </label>
                <select
                  value={preferences.newsFrequency}
                  onChange={(e) => setPreferences(prev => ({ ...prev, newsFrequency: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="high">Alta (muchas noticias)</option>
                  <option value="moderate">Moderada</option>
                  <option value="low">Baja (solo las más importantes)</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={handleSavePreferences}
              disabled={isSaving}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t('common.saving') : t('settings.saveChanges')}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;