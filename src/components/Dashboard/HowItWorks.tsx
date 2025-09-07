import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Brain,
  Globe,
  Shield,
  TrendingUp,
  Zap,
  Award,
  Users,
  Clock,
  BarChart3,
  Sparkles,
  Bot,
  Newspaper,
  Target,
  CheckCircle,
  ArrowRight,
  X,
  Play,
  Eye,
  Heart,
  MessageSquare,
  RefreshCw,
  Lock,
  Cpu
} from 'lucide-react';

interface HowItWorksProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowItWorks: React.FC<HowItWorksProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      icon: Globe,
      color: 'blue',
      title: i18n.language === 'es' ? '📰 Recopilación Global' : '📰 Global Collection',
      description: i18n.language === 'es' 
        ? 'Analizamos más de 500 fuentes financieras cada 5 minutos'
        : 'We analyze 500+ financial sources every 5 minutes',
      details: [
        i18n.language === 'es' ? 'Bloomberg, Reuters, CNBC' : 'Bloomberg, Reuters, CNBC',
        i18n.language === 'es' ? 'Actualización en tiempo real' : 'Real-time updates',
        i18n.language === 'es' ? '24/7 sin interrupciones' : '24/7 non-stop monitoring'
      ]
    },
    {
      icon: Brain,
      color: 'purple',
      title: i18n.language === 'es' ? '🤖 IA Financiera Especializada' : '🤖 Specialized Financial AI',
      description: i18n.language === 'es'
        ? 'FinBERT analiza el sentimiento del mercado con 92% de precisión'
        : 'FinBERT analyzes market sentiment with 92% accuracy',
      details: [
        i18n.language === 'es' ? 'Detecta tendencias alcistas/bajistas' : 'Detects bullish/bearish trends',
        i18n.language === 'es' ? 'Elimina noticias falsas' : 'Filters out fake news',
        i18n.language === 'es' ? 'Califica la calidad del contenido' : 'Rates content quality'
      ]
    },
    {
      icon: Target,
      color: 'green',
      title: i18n.language === 'es' ? '🎯 Personalización Inteligente' : '🎯 Smart Personalization',
      description: i18n.language === 'es'
        ? 'Tu feed se adapta a tus intereses y estilo de inversión'
        : 'Your feed adapts to your interests and investment style',
      details: [
        i18n.language === 'es' ? 'Aprende de tus preferencias' : 'Learns from your preferences',
        i18n.language === 'es' ? 'Filtra por sectores favoritos' : 'Filters by favorite sectors',
        i18n.language === 'es' ? 'Prioriza tu nivel de riesgo' : 'Prioritizes your risk level'
      ]
    },
    {
      icon: MessageSquare,
      color: 'orange',
      title: i18n.language === 'es' ? '💬 Asistente IA Multi-Modelo' : '💬 Multi-Model AI Assistant',
      description: i18n.language === 'es'
        ? '4 modelos de IA para análisis profundo: GPT-4, Claude, Gemini y Grok'
        : '4 AI models for deep analysis: GPT-4, Claude, Gemini, and Grok',
      details: [
        i18n.language === 'es' ? 'Análisis técnico instantáneo' : 'Instant technical analysis',
        i18n.language === 'es' ? 'Planes de trading personalizados' : 'Personalized trading plans',
        i18n.language === 'es' ? 'Respuestas en tu idioma' : 'Answers in your language'
      ]
    }
  ];

  const trustIndicators = [
    {
      icon: Users,
      value: '10,000+',
      label: i18n.language === 'es' ? 'Usuarios Activos' : 'Active Users'
    },
    {
      icon: Newspaper,
      value: '50,000+',
      label: i18n.language === 'es' ? 'Artículos Diarios' : 'Daily Articles'
    },
    {
      icon: Clock,
      value: '< 1s',
      label: i18n.language === 'es' ? 'Tiempo de Carga' : 'Load Time'
    },
    {
      icon: Shield,
      value: '99.9%',
      label: i18n.language === 'es' ? 'Disponibilidad' : 'Uptime'
    }
  ];

  const aiModels = [
    {
      name: 'GPT-4',
      logo: '🧠',
      description: i18n.language === 'es' ? 'Análisis preciso y conservador' : 'Precise and conservative analysis'
    },
    {
      name: 'Claude',
      logo: '🤖',
      description: i18n.language === 'es' ? 'Análisis estructurado y detallado' : 'Structured and detailed analysis'
    },
    {
      name: 'Gemini',
      logo: '✨',
      description: i18n.language === 'es' ? 'Contexto global multimodal' : 'Global multimodal context'
    },
    {
      name: 'Grok',
      logo: '🚀',
      description: i18n.language === 'es' ? 'Perspectiva directa y única' : 'Direct and unique perspective'
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {i18n.language === 'es' ? '¿Cómo Funciona Financial News?' : 'How Does Financial News Work?'}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {i18n.language === 'es' 
                        ? 'Tecnología de vanguardia para tu éxito financiero'
                        : 'Cutting-edge technology for your financial success'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Trust Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {trustIndicators.map((indicator, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 text-center"
                  >
                    <indicator.icon className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{indicator.value}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{indicator.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Process Flow */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  {i18n.language === 'es' ? 'Nuestro Proceso en 4 Pasos' : 'Our 4-Step Process'}
                </h3>
                
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-24 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full hidden md:block">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${(activeStep + 1) * 25}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  {/* Steps */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {steps.map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative"
                      >
                        <div
                          className={`cursor-pointer transition-all ${
                            activeStep === index ? 'scale-105' : ''
                          }`}
                          onClick={() => setActiveStep(index)}
                        >
                          {/* Step Number */}
                          <div className="flex items-center justify-center mb-4">
                            <div className={`
                              w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg
                              ${activeStep === index 
                                ? 'bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg' 
                                : 'bg-gray-300 dark:bg-gray-600'}
                            `}>
                              {index + 1}
                            </div>
                          </div>

                          {/* Icon and Title */}
                          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-center mb-3">
                              <step.icon className={`w-10 h-10 text-${step.color}-600 dark:text-${step.color}-400`} />
                            </div>
                            <h4 className="font-semibold text-gray-900 dark:text-white text-center mb-2">
                              {step.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Active Step Details */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl p-6"
                    >
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        {i18n.language === 'es' ? 'Características Clave:' : 'Key Features:'}
                      </h4>
                      <ul className="space-y-2">
                        {steps[activeStep].details.map((detail, idx) => (
                          <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                          >
                            <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            {detail}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* AI Models Showcase */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-600" />
                  {i18n.language === 'es' ? 'Potenciado por 4 Modelos de IA' : 'Powered by 4 AI Models'}
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {aiModels.map((model, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="text-3xl mb-2 text-center">{model.logo}</div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-center mb-1">
                        {model.name}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                        {model.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Security & Privacy */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  {i18n.language === 'es' ? 'Seguridad y Privacidad' : 'Security & Privacy'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-green-600 dark:text-green-400 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {i18n.language === 'es' ? 'Encriptación SSL' : 'SSL Encryption'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {i18n.language === 'es' 
                          ? 'Todos tus datos están protegidos con encriptación de nivel bancario'
                          : 'All your data is protected with bank-level encryption'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Eye className="w-5 h-5 text-green-600 dark:text-green-400 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {i18n.language === 'es' ? 'Sin Venta de Datos' : 'No Data Selling'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {i18n.language === 'es'
                          ? 'Nunca vendemos tu información personal a terceros'
                          : 'We never sell your personal information to third parties'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Cpu className="w-5 h-5 text-green-600 dark:text-green-400 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {i18n.language === 'es' ? 'Procesamiento Local' : 'Local Processing'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {i18n.language === 'es'
                          ? 'Tus preferencias se procesan localmente para máxima privacidad'
                          : 'Your preferences are processed locally for maximum privacy'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8 text-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <Play className="w-5 h-5" />
                  {i18n.language === 'es' ? 'Comenzar a Usar la App' : 'Start Using the App'}
                </motion.button>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                  {i18n.language === 'es'
                    ? '💡 Tip: Configura tus intereses en Ajustes para una experiencia personalizada'
                    : '💡 Tip: Set up your interests in Settings for a personalized experience'}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HowItWorks;