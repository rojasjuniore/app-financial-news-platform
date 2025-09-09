import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Moon,
  Sun,
  Globe,
  Bell,
  Lock,
  Shield,
  Palette,
  Smartphone,
  Info,
  Check
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { toast } from 'react-hot-toast';

interface UserSettings {
  notifications: {
    breakingNews: boolean;
    priceAlerts: boolean;
    marketUpdates: boolean;
  };
  privacy: {
    shareAnalytics: boolean;
    personalizedAds: boolean;
  };
}

const Settings: React.FC = () => {
  const { actualTheme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isDarkMode = actualTheme === 'dark';
  
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      breakingNews: true,
      priceAlerts: true,
      marketUpdates: false
    },
    privacy: {
      shareAnalytics: false,
      personalizedAds: false
    }
  });
  
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  // Cargar configuraciones al montar el componente
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        // Primero intentar cargar desde localStorage para respuesta inmediata
        const localSettings = localStorage.getItem(`settings_${user.uid}`);
        if (localSettings) {
          const parsed = JSON.parse(localSettings);
          setSettings(parsed);
        }

        // Luego sincronizar con Firebase
        const docRef = doc(db, 'userSettings', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const firebaseSettings = docSnap.data() as UserSettings;
          setSettings(firebaseSettings);
          // Actualizar localStorage con datos de Firebase
          localStorage.setItem(`settings_${user.uid}`, JSON.stringify(firebaseSettings));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, [user]);

  // Guardar configuraciones
  const saveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Guardar en localStorage inmediatamente
      localStorage.setItem(`settings_${user.uid}`, JSON.stringify(settings));

      // Guardar en Firebase
      const docRef = doc(db, 'userSettings', user.uid);
      await setDoc(docRef, {
        ...settings,
        updatedAt: new Date().toISOString(),
        userId: user.uid
      });

      toast.success(t('settings.changesSaved'));
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t('errors.savingPreferences'));
    } finally {
      setSaving(false);
    }
  };

  // Manejar cambios en notificaciones
  const handleNotificationChange = (key: keyof typeof settings.notifications) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
    setHasChanges(true);
  };

  // Manejar cambios en privacidad
  const handlePrivacyChange = (key: keyof typeof settings.privacy) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: !prev.privacy[key]
      }
    }));
    setHasChanges(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('errors.unauthorized')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('settings.loginRequired')}
          </p>
          <Link 
            to="/login"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('auth.signIn')}
          </Link>
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
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('settings.theme')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('settings.themeDescription')}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isDarkMode ? t('nav.lightMode') : t('nav.darkMode')}
              </button>
            </div>
          </motion.div>

          {/* Idioma */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('settings.language')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('settings.languageDescription')}
                  </p>
                </div>
              </div>
              <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">{t('settings.english')}</option>
                <option value="es">{t('settings.spanish')}</option>
              </select>
            </div>
          </motion.div>

          {/* Notificaciones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('settings.notifications')}
              </h3>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300">
                  {t('settings.breakingNews')}
                </span>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  checked={settings.notifications.breakingNews}
                  onChange={() => handleNotificationChange('breakingNews')}
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300">
                  {t('settings.priceAlerts')}
                </span>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  checked={settings.notifications.priceAlerts}
                  onChange={() => handleNotificationChange('priceAlerts')}
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300">
                  {t('settings.marketUpdates')}
                </span>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  checked={settings.notifications.marketUpdates}
                  onChange={() => handleNotificationChange('marketUpdates')}
                />
              </label>
            </div>
          </motion.div>

          {/* Privacidad */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('settings.privacy')}
              </h3>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300">
                  {t('settings.shareAnalytics')}
                </span>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  checked={settings.privacy.shareAnalytics}
                  onChange={() => handlePrivacyChange('shareAnalytics')}
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300">
                  {t('settings.personalizedAds')}
                </span>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  checked={settings.privacy.personalizedAds}
                  onChange={() => handlePrivacyChange('personalizedAds')}
                />
              </label>
            </div>
          </motion.div>

          {/* Enlace a Preferencias */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {t('settings.personalizeYourFeed')}
                </h3>
                <p className="text-white/80 text-sm">
                  {t('settings.personalizeDescription')}
                </p>
              </div>
              <Link
                to="/preferences"
                className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 font-medium"
              >
                <Palette className="w-5 h-5" />
                {t('settings.goToPreferences')}
              </Link>
            </div>
          </motion.div>

          {/* Información de la cuenta */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('settings.accountInfo')}
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('settings.email')}:</span>
                <span className="text-gray-900 dark:text-white font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('settings.userId')}:</span>
                <span className="text-gray-900 dark:text-white font-mono text-xs">{user.uid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('settings.memberSince')}:</span>
                <span className="text-gray-900 dark:text-white">
                  {user.metadata?.creationTime ? 
                    new Date(user.metadata.creationTime).toLocaleDateString() : 
                    'N/A'
                  }
                </span>
              </div>
            </div>
          </motion.div>

          {/* Botón de guardar cambios */}
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="fixed bottom-6 right-6 z-50"
            >
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>{t('common.saving')}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>{t('settings.saveChanges')}</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;