import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  DollarSign, 
  Bitcoin, 
  Globe, 
  ChevronRight, 
  Check, 
  Sparkles,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Zap,
  Target
} from 'lucide-react';
import { feedService } from '../../services/news/feedService';
import toast from 'react-hot-toast';

interface Interest {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

const MARKET_TYPES: Interest[] = [
  { 
    id: 'stocks', 
    label: 'Acciones', 
    icon: <TrendingUp className="w-6 h-6" />,
    description: 'NYSE, NASDAQ, S&P 500'
  },
  { 
    id: 'crypto', 
    label: 'Criptomonedas', 
    icon: <Bitcoin className="w-6 h-6" />,
    description: 'Bitcoin, Ethereum, DeFi'
  },
  { 
    id: 'forex', 
    label: 'Forex', 
    icon: <DollarSign className="w-6 h-6" />,
    description: 'EUR/USD, GBP/USD'
  },
  { 
    id: 'commodities', 
    label: 'Commodities', 
    icon: <Globe className="w-6 h-6" />,
    description: 'Oro, Petróleo, Plata'
  }
];

const POPULAR_TICKERS = [
  { symbol: 'AAPL', name: 'Apple', type: 'stock' },
  { symbol: 'GOOGL', name: 'Google', type: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft', type: 'stock' },
  { symbol: 'AMZN', name: 'Amazon', type: 'stock' },
  { symbol: 'TSLA', name: 'Tesla', type: 'stock' },
  { symbol: 'META', name: 'Meta', type: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA', type: 'stock' },
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
  { symbol: 'SOL', name: 'Solana', type: 'crypto' },
];

const SECTORS = [
  { id: 'tech', label: 'Tecnología', icon: '💻' },
  { id: 'finance', label: 'Finanzas', icon: '🏦' },
  { id: 'health', label: 'Salud', icon: '🏥' },
  { id: 'energy', label: 'Energía', icon: '⚡' },
  { id: 'consumer', label: 'Consumo', icon: '🛒' },
  { id: 'industrial', label: 'Industrial', icon: '🏭' },
  { id: 'realestate', label: 'Inmobiliario', icon: '🏢' },
  { id: 'materials', label: 'Materiales', icon: '🔧' },
];

const InterestsSetup: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleMarket = (marketId: string) => {
    setSelectedMarkets(prev =>
      prev.includes(marketId)
        ? prev.filter(id => id !== marketId)
        : [...prev, marketId]
    );
  };

  const toggleTicker = (ticker: string) => {
    setSelectedTickers(prev =>
      prev.includes(ticker)
        ? prev.filter(t => t !== ticker)
        : [...prev, ticker]
    );
  };

  const toggleSector = (sectorId: string) => {
    setSelectedSectors(prev =>
      prev.includes(sectorId)
        ? prev.filter(s => s !== sectorId)
        : [...prev, sectorId]
    );
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await feedService.updateInterests({
        marketTypes: selectedMarkets,
        tickers: selectedTickers,
        sectors: selectedSectors,
        topics: []
      });
      
      toast.success('¡Perfecto! Tu feed está listo 🎉');
      navigate('/feed');
    } catch (error) {
      toast.error(t('errors.savingPreferences'));
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedMarkets.length > 0;
      case 2: return selectedTickers.length > 0;
      case 3: return selectedSectors.length > 0;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl mb-6 shadow-2xl shadow-indigo-500/25">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Personaliza tu experiencia
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Cuéntanos tus intereses para crear un feed de noticias perfectamente adaptado a ti
          </p>
        </div>

        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">Paso {step} de 3</span>
            <span className="text-sm font-medium text-indigo-600">{Math.round((step / 3) * 100)}% completado</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          {/* Step 1: Markets */}
          {step === 1 && (
            <div className="animate-fadeIn">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mr-4">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">¿Qué mercados te interesan?</h2>
                  <p className="text-gray-600">Selecciona uno o más mercados</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MARKET_TYPES.map((market) => (
                  <button
                    key={market.id}
                    onClick={() => toggleMarket(market.id)}
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-200 ${
                      selectedMarkets.includes(market.id)
                        ? 'border-indigo-600 bg-indigo-50 shadow-lg scale-[1.02]'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
                        selectedMarkets.includes(market.id)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {market.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-lg text-gray-900">{market.label}</h3>
                        <p className="text-sm text-gray-500 mt-1">{market.description}</p>
                      </div>
                      {selectedMarkets.includes(market.id) && (
                        <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Tickers */}
          {step === 2 && (
            <div className="animate-fadeIn">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Selecciona tus favoritos</h2>
                  <p className="text-gray-600">Elige los activos que quieres seguir</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {POPULAR_TICKERS.map((ticker) => (
                  <button
                    key={ticker.symbol}
                    onClick={() => toggleTicker(ticker.symbol)}
                    className={`relative p-4 rounded-xl border transition-all duration-200 ${
                      selectedTickers.includes(ticker.symbol)
                        ? 'border-purple-600 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`font-bold text-lg ${
                        selectedTickers.includes(ticker.symbol) ? 'text-purple-700' : 'text-gray-900'
                      }`}>
                        ${ticker.symbol}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{ticker.name}</div>
                    </div>
                    {selectedTickers.includes(ticker.symbol) && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {selectedTickers.length > 0 && (
                <div className="mt-6 p-4 bg-purple-50 rounded-xl">
                  <p className="text-sm text-purple-700 font-medium">
                    {selectedTickers.length} ticker{selectedTickers.length !== 1 ? 's' : ''} seleccionado{selectedTickers.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Sectors */}
          {step === 3 && (
            <div className="animate-fadeIn">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mr-4">
                  <Zap className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Sectores de interés</h2>
                  <p className="text-gray-600">¿Qué industrias quieres seguir?</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {SECTORS.map((sector) => (
                  <button
                    key={sector.id}
                    onClick={() => toggleSector(sector.id)}
                    className={`relative p-4 rounded-xl border transition-all duration-200 ${
                      selectedSectors.includes(sector.id)
                        ? 'border-pink-600 bg-pink-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{sector.icon}</div>
                      <div className={`font-medium text-sm ${
                        selectedSectors.includes(sector.id) ? 'text-pink-700' : 'text-gray-900'
                      }`}>
                        {sector.label}
                      </div>
                    </div>
                    {selectedSectors.includes(sector.id) && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : navigate('/feed')}
            className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {step === 1 ? 'Omitir' : 'Atrás'}
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed() || isLoading}
            className={`px-8 py-3 rounded-2xl font-medium transition-all duration-200 flex items-center ${
              canProceed() && !isLoading
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl shadow-lg shadow-indigo-500/25 transform hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                {step === 3 ? 'Completar' : 'Siguiente'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterestsSetup;