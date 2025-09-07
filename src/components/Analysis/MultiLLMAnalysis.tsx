import React, { useState } from 'react';
import { Bot, Plus, RefreshCw, ChevronDown, Sparkles, Loader, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LLMAnalysis {
  id: string;
  model_used: string;
  timestamp: string;
  technical_analysis?: any;
  sentiment_analysis?: any;
  trading_plan?: any;
  polygon_data?: any;
  no_ticker_message?: string;
}

interface MultiLLMAnalysisProps {
  currentAnalysis: LLMAnalysis | null;
  allAnalyses: LLMAnalysis[];
  onRegenerate: (model: string, mode: 'replace' | 'add') => void;
  isLoading: boolean;
  articleId: string;
}

const MultiLLMAnalysis: React.FC<MultiLLMAnalysisProps> = ({
  currentAnalysis,
  allAnalyses,
  onRegenerate,
  isLoading,
  articleId
}) => {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'replace' | 'add'>('replace');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);

  const aiModels = [
    { id: 'openai', name: 'GPT-4', icon: '🤖', color: 'bg-green-500' },
    { id: 'claude', name: 'Claude', icon: '🧠', color: 'bg-purple-500' },
    { id: 'gemini', name: 'Gemini', icon: '✨', color: 'bg-blue-500' },
    { id: 'grok', name: 'Grok', icon: '⚡', color: 'bg-orange-500' }
  ];

  const handleModelSelect = (modelId: string) => {
    onRegenerate(modelId, selectedMode);
    setShowMenu(false);
  };

  const getModelInfo = (modelId: string) => {
    return aiModels.find(m => m.id === modelId) || aiModels[0];
  };

  const toggleCompareAnalysis = (analysisId: string) => {
    setSelectedAnalyses(prev => 
      prev.includes(analysisId) 
        ? prev.filter(id => id !== analysisId)
        : [...prev, analysisId]
    );
  };

  return (
    <div className="relative">
      {/* Header con opciones */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {t('analysis.title')}
          </h2>
          
          {/* Indicador de múltiples análisis */}
          {allAnalyses.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                {allAnalyses.length} análisis disponibles
              </span>
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  compareMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {compareMode ? 'Ver individual' : 'Comparar'}
              </button>
            </div>
          )}
        </div>

        {/* Menú de acciones */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">Opciones</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && !isLoading && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              {/* Selector de modo */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedMode('replace')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedMode === 'replace'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    🔄 Reemplazar
                  </button>
                  <button
                    onClick={() => setSelectedMode('add')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedMode === 'add'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    ➕ Agregar opinión
                  </button>
                </div>
              </div>

              {/* Lista de modelos */}
              <div className="p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                  {selectedMode === 'replace' 
                    ? 'Regenerar análisis con:'
                    : 'Agregar segunda opinión de:'}
                </p>
                {aiModels.map((model) => {
                  const isUsed = allAnalyses.some(a => a.model_used === model.id);
                  return (
                    <button
                      key={model.id}
                      onClick={() => handleModelSelect(model.id)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{model.icon}</span>
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-white">
                            {model.name}
                          </div>
                          {isUsed && selectedMode === 'add' && (
                            <div className="text-xs text-amber-600 dark:text-amber-400">
                              Ya tienes un análisis de {model.name}
                            </div>
                          )}
                        </div>
                      </div>
                      {currentAnalysis?.model_used === model.id && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                          Actual
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Info adicional */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
                {selectedMode === 'add' ? (
                  <div className="flex items-start gap-2">
                    <Plus className="w-3 h-3 mt-0.5 text-green-600" />
                    <span>Las segundas opiniones se guardan para comparación posterior</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <RefreshCw className="w-3 h-3 mt-0.5 text-blue-600" />
                    <span>Reemplazar generará un nuevo análisis con el modelo seleccionado</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modo comparación */}
      {compareMode && allAnalyses.length > 1 && (
        <div className="mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">
              Selecciona los análisis a comparar:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {allAnalyses.map((analysis) => {
                const model = getModelInfo(analysis.model_used);
                const isSelected = selectedAnalyses.includes(analysis.id);
                return (
                  <button
                    key={analysis.id}
                    onClick={() => toggleCompareAnalysis(analysis.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">{model.icon}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="text-xs font-medium text-gray-900 dark:text-white">
                      {model.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(analysis.timestamp).toLocaleDateString()}
                    </div>
                  </button>
                );
              })}
            </div>
            
            {selectedAnalyses.length >= 2 && (
              <button
                className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Comparar {selectedAnalyses.length} análisis seleccionados
              </button>
            )}
          </div>
        </div>
      )}

      {/* Análisis actual o comparación */}
      {!compareMode && currentAnalysis && (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {(() => {
                const model = getModelInfo(currentAnalysis.model_used);
                return (
                  <>
                    <span className="text-lg">{model.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Análisis de {model.name}
                    </span>
                  </>
                );
              })()}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(currentAnalysis.timestamp).toLocaleString()}
            </span>
          </div>
          {/* Aquí iría el contenido del análisis */}
        </div>
      )}
    </div>
  );
};

export default MultiLLMAnalysis;