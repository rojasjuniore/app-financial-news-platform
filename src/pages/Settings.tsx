import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Eye,
  Download,
  Upload,
  Settings as SettingsIcon,
  Bell,
  Globe,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { feedService } from '../services/news/feedService';
import toast from 'react-hot-toast';
import InterestCategorySelector from '../components/Settings/InterestCategorySelector';
import PersonalizationPreview from '../components/Settings/PersonalizationPreview';

import type { UserPreferences, InterestWeight, MarketType, UserInterests as ImportedUserInterests } from '../types';

type UserInterests = ImportedUserInterests;

interface InterestItem {
  name: string;
  weight: number;
  isActive: boolean;
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
    weights: {
      tickers: {},
      sectors: {},
      topics: {},
      marketTypes: { stocks: 50, crypto: 50, forex: 50 }
    }
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
  const [showPreview, setShowPreview] = useState(false);

  // Sugerencias populares
  const tickerSuggestions = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'BTC', 'ETH', 'SPY', 'QQQ'];
  const sectorSuggestions = ['technology', 'healthcare', 'finance', 'energy', 'automotive', 'retail', 'crypto', 'real estate'];
  const topicSuggestions = ['earnings', 'IPO', 'merger', 'AI', 'crypto', 'regulation', 'innovation', 'recession'];

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
        setInterests({
          ...profile.interests,
          weights: profile.interests.weights || {
            tickers: {},
            sectors: {},
            topics: {},
            marketTypes: { stocks: 50, crypto: 50, forex: 50 }
          }
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

  // Convertir arrays a InterestItems para el selector
  const getInterestItems = (items: string[], category: 'tickers' | 'sectors' | 'topics'): InterestItem[] => {
    return items.map(item => ({
      name: item,
      weight: interests.weights?.[category]?.[item] || 50,
      isActive: true
    }));
  };

  // Manejar cambios en categorías de interés
  const handleInterestChange = (category: 'tickers' | 'sectors' | 'topics', items: InterestItem[]) => {
    const names = items.map(item => item.name);
    const weights: { [key: string]: number } = {};
    items.forEach(item => {
      weights[item.name] = item.weight;
    });

    setInterests(prev => ({
      ...prev,
      [category]: names,
      weights: {
        tickers: prev.weights?.tickers || {},
        sectors: prev.weights?.sectors || {},
        topics: prev.weights?.topics || {},
        marketTypes: prev.weights?.marketTypes || { stocks: 50, crypto: 50, forex: 50 },
        [category]: weights
      }
    }));
  };

  // Manejar cambios de peso
  const handleWeightChange = (category: 'tickers' | 'sectors' | 'topics', name: string, weight: number) => {
    setInterests(prev => ({
      ...prev,
      weights: {
        tickers: prev.weights?.tickers || {},
        sectors: prev.weights?.sectors || {},
        topics: prev.weights?.topics || {},
        marketTypes: prev.weights?.marketTypes || { stocks: 50, crypto: 50, forex: 50 },
        [category]: {
          ...(prev.weights?.[category] || {}),
          [name]: weight
        }
      }
    }));
  };

  const toggleMarketType = (marketType: MarketType) => {
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

          {/* Intereses - Tickers con Selector Avanzado */}
          <InterestCategorySelector
            title={t('settings.tickersOfInterest')}
            description={t('settings.tickersDescription')}
            icon={<Hash className="w-5 h-5" />}
            color="green"
            items={getInterestItems(interests.tickers, 'tickers')}
            suggestions={tickerSuggestions}
            placeholder={t('settings.tickerPlaceholder')}
            onChange={(items) => handleInterestChange('tickers', items)}
            onWeightChange={(name, weight) => handleWeightChange('tickers', name, weight)}
            showWeights={true}
          />

          {/* Intereses - Sectores con Selector Avanzado */}
          <InterestCategorySelector
            title="Sectores de Interés"
            description="Selecciona los sectores económicos que más te interesan"
            icon={<BarChart3 className="w-5 h-5" />}
            color="purple"
            items={getInterestItems(interests.sectors, 'sectors')}
            suggestions={sectorSuggestions}
            placeholder="Ej: technology, healthcare, finance"
            onChange={(items) => handleInterestChange('sectors', items)}
            onWeightChange={(name, weight) => handleWeightChange('sectors', name, weight)}
            showWeights={true}
          />

          {/* Intereses - Temas con Selector Avanzado */}
          <InterestCategorySelector
            title="Temas de Interés"
            description="Agrega temas específicos que te interesan en el mundo financiero"
            icon={<Target className="w-5 h-5" />}
            color="blue"
            items={getInterestItems(interests.topics, 'topics')}
            suggestions={topicSuggestions}
            placeholder="Ej: earnings, IPO, merger, AI"
            onChange={(items) => handleInterestChange('topics', items)}
            onWeightChange={(name, weight) => handleWeightChange('topics', name, weight)}
            showWeights={true}
          />

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
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['stocks', 'crypto', 'forex'] as MarketType[]).map((marketType) => (
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
          </motion.div>

          {/* Botón Guardar Todos los Intereses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Guardar Cambios de Intereses</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Aplica todos los cambios realizados en tus intereses y pesos de priorización</p>
              </div>
              <button
                onClick={handleSaveInterests}
                disabled={isSaving}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
              >
                <Save className="w-5 h-5" />
                {isSaving ? t('common.saving') : 'Guardar Todos los Intereses'}
              </button>
            </div>
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

          {/* Botón de Vista Previa de Personalización */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Vista Previa de Personalización</h3>
                <p className="text-white/80 text-sm">Mira cómo tus configuraciones afectan el feed de noticias</p>
              </div>
              <button
                onClick={() => setShowPreview(true)}
                className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 font-medium"
              >
                <Eye className="w-5 h-5" />
                Ver Preview
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal de Vista Previa */}
      <PersonalizationPreview
        interests={interests}
        preferences={preferences}
        isVisible={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
};

export default Settings;