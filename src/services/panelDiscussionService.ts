import apiClient from './api';

export interface LLMOpinion {
  model: string;
  role: string;
  icon: string;
  color: string;
  message: string;
  timestamp: string;
  type: 'analysis' | 'response' | 'synthesis';
  agreesWithPoints?: string[];
  disagreesWithPoints?: string[];
  newInsights?: string[];
  consensus?: ConsensusData;
}

export interface ConsensusData {
  recommendation: string;
  confidence: number;
  timeframe: string;
  riskLevel: string;
  keyPoints: string[];
}

export interface PanelDiscussionResponse {
  discussion: LLMOpinion[];
  consensus?: ConsensusData;
  cached: boolean;
}

class PanelDiscussionService {
  /**
   * Genera o recupera un panel de discusión para un artículo
   */
  async generatePanelDiscussion(
    articleId: string, 
    regenerate: boolean = false
  ): Promise<PanelDiscussionResponse> {
    try {
      console.log(`🎭 Solicitando panel de discusión para artículo: ${articleId}`);
      
      const response = await apiClient.post<PanelDiscussionResponse>(
        `/api/panel-discussion/${articleId}`,
        { regenerate }
      );
      
      console.log(`✅ Panel de discusión recibido:`, response.data);
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Error generando panel de discusión:', error);
      throw new Error(
        error.response?.data?.error || 
        'Error al generar el panel de discusión'
      );
    }
  }
  
  /**
   * Formatea la fecha de una opinión
   */
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  
  /**
   * Obtiene el color de fondo para un modelo
   */
  getModelBackgroundColor(color: string): string {
    const colorMap: Record<string, string> = {
      'green': 'bg-green-500',
      'purple': 'bg-purple-500',
      'blue': 'bg-blue-500',
      'orange': 'bg-orange-500'
    };
    return colorMap[color] || 'bg-gray-500';
  }
  
  /**
   * Determina el ícono de recomendación
   */
  getRecommendationIcon(recommendation: string): string {
    const upperRec = recommendation.toUpperCase();
    if (upperRec.includes('COMPRA') || upperRec.includes('BUY')) {
      return '📈';
    } else if (upperRec.includes('VENTA') || upperRec.includes('SELL')) {
      return '📉';
    } else {
      return '⚖️';
    }
  }
  
  /**
   * Calcula el nivel de consenso entre las opiniones
   */
  calculateConsensusLevel(discussion: LLMOpinion[]): number {
    if (discussion.length < 2) return 100;
    
    let agreements = 0;
    let totalPoints = 0;
    
    discussion.forEach(opinion => {
      if (opinion.agreesWithPoints) {
        agreements += opinion.agreesWithPoints.length;
        totalPoints += opinion.agreesWithPoints.length;
      }
      if (opinion.disagreesWithPoints) {
        totalPoints += opinion.disagreesWithPoints.length;
      }
    });
    
    if (totalPoints === 0) return 50;
    return Math.round((agreements / totalPoints) * 100);
  }
}

export const panelDiscussionService = new PanelDiscussionService();