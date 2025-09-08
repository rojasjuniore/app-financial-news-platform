import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Brain, Zap, TrendingUp, AlertTriangle, Target, Bot, ArrowRight, Loader, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { panelDiscussionService, LLMOpinion as ServiceLLMOpinion } from '../../services/panelDiscussionService';
import toast from 'react-hot-toast';

interface LLMOpinion {
  model: string;
  icon: string;
  color: string;
  role: string;
  message: string;
  timestamp: Date;
  type: 'analysis' | 'response' | 'synthesis';
  agreesWithPoints?: string[];
  disagreesWithPoints?: string[];
  newInsights?: string[];
}

interface LLMPanelDiscussionProps {
  articleId: string;
  articleTitle: string;
  tickers?: string[];
  onGenerateDiscussion: (models: string[]) => Promise<any>;
  existingAnalysis?: any;
}

const LLMPanelDiscussion: React.FC<LLMPanelDiscussionProps> = ({
  articleId,
  articleTitle,
  tickers,
  onGenerateDiscussion,
  existingAnalysis
}) => {
  const { t } = useTranslation();
  const [discussion, setDiscussion] = useState<LLMOpinion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [consensusReached, setConsensusReached] = useState(false);
  const [finalSynthesis, setFinalSynthesis] = useState<any>(null);

  const llmExperts = [
    {
      id: 'openai',
      name: 'GPT-4',
      icon: '🤖',
      color: 'bg-green-500',
      role: 'Analista Principal',
      expertise: 'Análisis técnico y fundamental profundo'
    },
    {
      id: 'claude',
      name: 'Claude',
      icon: '🧠',
      color: 'bg-purple-500',
      role: 'Revisor Crítico',
      expertise: 'Evaluación de riesgos y perspectivas alternativas'
    },
    {
      id: 'gemini',
      name: 'Gemini',
      icon: '✨',
      color: 'bg-blue-500',
      role: 'Analista de Datos',
      expertise: 'Datos en tiempo real y patrones de mercado'
    },
    {
      id: 'grok',
      name: 'Grok',
      icon: '⚡',
      color: 'bg-orange-500',
      role: 'Sintetizador',
      expertise: 'Síntesis y consenso final'
    }
  ];

  const startPanelDiscussion = async (regenerate: boolean = false) => {
    setIsGenerating(true);
    setDiscussion([]);
    setConsensusReached(false);
    setCurrentSpeaker('loading');

    try {
      // Llamar al servicio real
      const response = await panelDiscussionService.generatePanelDiscussion(articleId, regenerate);
      
      // Si está cacheado, mostrar todo de una vez
      if (response.cached) {
        setDiscussion(response.discussion.map(d => ({
          ...d,
          timestamp: new Date(d.timestamp)
        })));
        if (response.consensus) {
          setFinalSynthesis(response.consensus);
          setConsensusReached(true);
        }
        setCurrentSpeaker(null);
      } else {
        // Animar la aparición de cada opinión
        for (let i = 0; i < response.discussion.length; i++) {
          const opinion = response.discussion[i];
          const expertInfo = llmExperts.find(e => 
            e.name === opinion.model || e.id === opinion.model.toLowerCase()
          );
          
          if (expertInfo) {
            setCurrentSpeaker(expertInfo.id);
          }
          
          // Esperar un poco para la animación
          await new Promise(resolve => setTimeout(resolve, 800));
          
          setDiscussion(prev => [...prev, {
            ...opinion,
            timestamp: new Date(opinion.timestamp)
          } as LLMOpinion]);
        }
        
        if (response.consensus) {
          setFinalSynthesis(response.consensus);
          setConsensusReached(true);
        }
      }
      
      toast.success(`✨ ${t('analysis.panel.panelCompleted')}`);
    } catch (error: any) {
      console.error('Error en panel de discusión:', error);
      toast.error(error.message || t('errors.panelDiscussion'));
    } finally {
      setIsGenerating(false);
      setCurrentSpeaker(null);
    }
  };

  const generateExpertOpinion = async (expert: any, previousDiscussion: LLMOpinion[]): Promise<string> => {
    // Aquí llamarías a tu API real
    // Por ahora, retorno contenido de ejemplo basado en el rol

    if (expert.id === 'openai') {
      return `## Análisis Inicial de ${tickers?.[0] || 'el activo'}

Basándome en el artículo "${articleTitle}", identifico los siguientes puntos clave:

### 📈 Análisis Técnico
- **Tendencia principal**: Alcista con corrección saludable
- **Soporte clave**: $125 con volumen significativo
- **Resistencia**: $140-145 zona de toma de beneficios

### 💡 Catalizadores Identificados
1. Expansión en mercados emergentes (+15% YoY)
2. Nuevos productos con márgenes superiores
3. Reducción de costos operativos del 8%

### ⚠️ Riesgos a Considerar
- Presión competitiva en el segmento principal
- Exposición a volatilidad cambiaria
- Dependencia de grandes clientes (top 10 = 40% ingresos)`;
    }

    if (expert.id === 'claude') {
      return `## Revisión Crítica y Perspectivas Adicionales

Coincido con GPT-4 en el análisis técnico, pero añadiría consideraciones importantes:

### 🔍 Puntos de Acuerdo
- ✅ El soporte en $125 es efectivamente robusto
- ✅ Los catalizadores de crecimiento son reales

### ⚡ Puntos de Atención
- ❗ El análisis subestima el riesgo regulatorio
- ❗ La resistencia podría estar más cerca en $138
- ❗ El ratio P/E actual (28x) sugiere sobrevaloración

### 🎯 Perspectiva Alternativa
Sugiero un enfoque más conservador:
- **Entrada escalonada**: 40% en $125, 60% en $122
- **Stop loss más ajustado**: $118 (-5.6%)
- **Take profit parcial**: 50% en $135, resto en $145`;
    }

    if (expert.id === 'gemini') {
      return `## Análisis de Datos en Tiempo Real

Aporto datos actualizados del mercado:

### 📊 Métricas Clave (Últimas 24h)
- **Volumen**: 2.3M acciones (140% del promedio)
- **RSI(14)**: 58.4 (zona neutral-alcista)
- **Correlación S&P500**: 0.76 (alta beta)

### 🔄 Flujo de Órdenes
- **Buy/Sell Ratio**: 1.34 (presión compradora)
- **Grandes bloques**: 3 compras >100k acciones
- **Dark Pool**: 42% del volumen (institucionales acumulando)

### 📈 Comparación Sectorial
- Outperformance vs sector: +4.2% últimos 30 días
- Ranking en industria: Top 3 de 15 competidores
- Momentum score: 8.2/10`;
    }

    if (expert.id === 'grok') {
      return `## Síntesis y Consenso Final

Tras analizar todas las perspectivas, propongo el siguiente plan unificado:

### 🎯 Estrategia Consensuada
**Entry Strategy** (Ponderado por riesgo):
- 30% @ $125.00 (soporte confirmado)
- 40% @ $123.50 (retroceso Fibonacci 38.2%)
- 30% @ $121.00 (soporte secundario)

**Risk Management**:
- Stop Loss: $118 (consenso entre modelos)
- Trailing Stop: Activar en $135 (3% trailing)

### 📊 Targets Escalonados
1. **TP1**: $132 (25% posición) - Resistencia menor
2. **TP2**: $138 (35% posición) - Punto de Claude
3. **TP3**: $145 (40% posición) - Target optimista

### ⚖️ Probabilidades Ponderadas
- **Bull Case** (35%): $150+ en 3 meses
- **Base Case** (50%): $138-142 en 3 meses  
- **Bear Case** (15%): Retorno a $120

**Recomendación Final**: COMPRA MODERADA con gestión activa`;
    }

    return "Análisis en proceso...";
  };

  const generateAgreements = (expert: any): string[] => {
    const agreements = [
      "Soporte técnico en $125 bien fundamentado",
      "Catalizadores de crecimiento válidos",
      "Momento de mercado favorable"
    ];
    return agreements.slice(0, Math.floor(Math.random() * 2) + 1);
  };

  const generateDisagreements = (expert: any): string[] => {
    const disagreements = [
      "Valoración actual podría ser excesiva",
      "Riesgos regulatorios subestimados",
      "Volatilidad implícita sugiere cautela"
    ];
    return disagreements.slice(0, Math.floor(Math.random() * 2) + 1);
  };

  const generateNewInsights = (expert: any): string[] => {
    const insights = [
      "Pattern de acumulación institucional detectado",
      "Divergencia positiva en indicadores de momentum",
      "Correlación inversa con USD favorable"
    ];
    return insights.slice(0, Math.floor(Math.random() * 2) + 1);
  };

  const generateFinalConsensus = () => {
    setFinalSynthesis({
      recommendation: 'COMPRA MODERADA',
      confidence: 72,
      timeframe: '3-6 meses',
      keyPoints: [
        'Consenso en soporte técnico fuerte',
        'Divergencias en valoración requieren cautela',
        'Datos de flujo sugieren acumulación institucional'
      ],
      riskScore: 'Medio-Bajo',
      expectedReturn: '12-18%'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Panel de Expertos IA
            </h2>
          </div>
          {!isGenerating && discussion.length === 0 && (
            <button
              onClick={() => startPanelDiscussion(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              Iniciar Discusión
            </button>
          )}
          {!isGenerating && discussion.length > 0 && (
            <button
              onClick={() => startPanelDiscussion(true)}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm"
            >
              <RefreshCw className="w-3 h-3" />
              Regenerar
            </button>
          )}
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300">
          4 modelos de IA analizarán y debatirán para darte la perspectiva más completa
        </p>

        {/* Experts Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {llmExperts.map((expert) => (
            <div
              key={expert.id}
              className={`p-3 rounded-lg border transition-all ${
                currentSpeaker === expert.id
                  ? 'border-blue-500 bg-white dark:bg-gray-800 shadow-lg scale-105'
                  : 'border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{expert.icon}</span>
                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                  {expert.name}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {expert.role}
              </p>
              {currentSpeaker === expert.id && (
                <div className="mt-2 flex items-center gap-1">
                  <Loader className="w-3 h-3 animate-spin text-blue-600" />
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    Analizando...
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Discussion Thread */}
      {discussion.length > 0 && (
        <div className="space-y-4">
          {discussion.map((opinion, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full ${opinion.color} flex items-center justify-center text-2xl`}>
                    {opinion.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {opinion.model}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {opinion.role}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {opinion.timestamp.toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Agreements/Disagreements */}
                  {(opinion.agreesWithPoints || opinion.disagreesWithPoints) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {opinion.agreesWithPoints?.map((point, i) => (
                        <span
                          key={`agree-${i}`}
                          className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs"
                        >
                          ✓ {point}
                        </span>
                      ))}
                      {opinion.disagreesWithPoints?.map((point, i) => (
                        <span
                          key={`disagree-${i}`}
                          className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-xs"
                        >
                          ✗ {point}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{opinion.message}</ReactMarkdown>
                  </div>

                  {/* New Insights */}
                  {opinion.newInsights && opinion.newInsights.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                        💡 Nuevos insights:
                      </p>
                      <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                        {opinion.newInsights.map((insight, i) => (
                          <li key={i}>• {insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Final Consensus */}
      {consensusReached && finalSynthesis && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border-2 border-green-500 dark:border-green-700">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Consenso Final del Panel
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Recomendación:
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {finalSynthesis.recommendation}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ({finalSynthesis.confidence}% confianza)
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Métricas Clave:
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Retorno esperado:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {finalSynthesis.expectedReturn}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Horizonte:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {finalSynthesis.timeframe}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Riesgo:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {finalSynthesis.riskScore}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Puntos Clave del Consenso:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {finalSynthesis.keyPoints.map((point: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 mt-0.5 text-blue-600 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default LLMPanelDiscussion;