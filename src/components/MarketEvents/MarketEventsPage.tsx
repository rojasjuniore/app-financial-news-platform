import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Building, TrendingUp, TrendingDown, DollarSign,
  Clock, AlertTriangle, ChevronRight, RefreshCw, Filter
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import apiClient from '../../services/api';

interface MarketEvent {
  type: 'earnings' | 'economic' | 'dividend' | 'split';
  ticker: string;
  date: string;
  time?: string;
  title: string;
  description: string;
  importance: 'low' | 'medium' | 'high';
  impact: string;
  forecast?: string;
  previous?: string;
}

interface MarketEventsPageProps {
  onClose?: () => void;
}

const MarketEventsPage: React.FC<MarketEventsPageProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [eventsByDay, setEventsByDay] = useState<{[key: string]: MarketEvent[]}>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  useEffect(() => {
    fetchMarketEvents();
  }, [filter]);

  const fetchMarketEvents = async () => {
    setLoading(true);
    try {
      console.log('📅 Fetching market events...');
      
      const endpoint = filter === 'all' 
        ? '/api/economic-calendar' 
        : `/api/economic-calendar?importance=${filter}`;
        
      const response = await apiClient.get(endpoint);
      
      if (response.data.success) {
        setEvents(response.data.events);
        setEventsByDay(response.data.eventsByDay || {});
        setLastUpdate(response.data.meta.generatedAt);
        
        toast.success(`✅ ${response.data.events.length} eventos cargados`);
      }
    } catch (error: any) {
      console.error('❌ Error fetching market events:', error);
      toast.error(t('errors.loadingMarketEvents'));
    } finally {
      setLoading(false);
    }
  };

  const refreshEvents = async () => {
    try {
      await apiClient.post('/api/economic-calendar/refresh');
      toast.success('📅 Calendario actualizado');
      fetchMarketEvents();
    } catch (error) {
      toast.error(t('errors.updatingCalendar'));
    }
  };

  const getEventIcon = (event: MarketEvent) => {
    switch (event.type) {
      case 'earnings':
        return <Building className="w-4 h-4" />;
      case 'economic':
        return <TrendingUp className="w-4 h-4" />;
      case 'dividend':
        return <DollarSign className="w-4 h-4" />;
      case 'split':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800';
      case 'medium':
        return 'border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800';
      case 'low':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800';
      default:
        return 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  const getImportanceDotColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-orange-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatEventDate = (dateString: string, time?: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    let dayText = '';
    if (date.toDateString() === today.toDateString()) {
      dayText = 'Hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dayText = 'Mañana';
    } else {
      dayText = date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    return time ? `${dayText} ${time}` : dayText;
  };

  const getTodayEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => event.date === today);
  };

  const getUpcomingEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => event.date > today);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Cargando eventos de mercado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
              )}
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  Eventos de Mercado
                  <span className="text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-full font-medium">
                    HOT
                  </span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Última actualización: {new Date(lastUpdate).toLocaleString('es-ES')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Lista
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Calendario
                </button>
              </div>

              <button
                onClick={refreshEvents}
                className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2 font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Filtrar por importancia:</span>
            
            {[
              { key: 'all', label: 'Todos' },
              { key: 'high', label: 'Alta', color: 'red' },
              { key: 'medium', label: 'Media', color: 'orange' },
              { key: 'low', label: 'Baja', color: 'green' }
            ].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === key
                    ? `bg-${color || 'blue'}-100 dark:bg-${color || 'blue'}-900/30 text-${color || 'blue'}-700 dark:text-${color || 'blue'}-400`
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {label}
                {key !== 'all' && (
                  <span className={`inline-block w-2 h-2 rounded-full ml-2 bg-${color}-500`} />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getTodayEvents().length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Eventos hoy
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {events.filter(e => e.importance === 'high').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Alta importancia
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getUpcomingEvents().length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Próximos eventos
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Events List */}
        <motion.div variants={itemVariants} className="space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay eventos disponibles
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Intenta cambiar el filtro o actualizar los datos
              </p>
            </div>
          ) : (
            events.map((event, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-l-4 ${getImportanceColor(event.importance)} hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    event.importance === 'high' 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      : event.importance === 'medium'
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  }`}>
                    {getEventIcon(event)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {event.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {event.description}
                        </p>
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatEventDate(event.date, event.time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getImportanceDotColor(event.importance)}`} />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                            {event.importance}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {(event.forecast || event.previous) && (
                      <div className="flex gap-6 text-sm">
                        {event.forecast && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Pronóstico:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {event.forecast}
                            </span>
                          </div>
                        )}
                        {event.previous && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Anterior:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {event.previous}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                        {event.ticker}
                      </span>
                      <span className="text-xs text-gray-500">
                        Impacto: {event.impact}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MarketEventsPage;