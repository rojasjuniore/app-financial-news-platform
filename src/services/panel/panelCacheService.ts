interface CachedPanel {
  articleId: string;
  discussion: any[];
  consensus: any;
  marketData: any;
  timestamp: number;
  language: string;
}

class PanelCacheService {
  private readonly CACHE_KEY = 'ai_expert_panels';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

  /**
   * Obtiene un panel del caché
   */
  getPanel(articleId: string): CachedPanel | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const panels: Record<string, CachedPanel> = JSON.parse(cached);
      const panel = panels[articleId];

      if (!panel) return null;

      // Verificar si el caché ha expirado
      const now = Date.now();
      if (now - panel.timestamp > this.CACHE_DURATION) {
        // Eliminar panel expirado
        delete panels[articleId];
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(panels));
        return null;
      }

      // Verificar si el idioma ha cambiado
      const currentLanguage = localStorage.getItem('i18nextLng') || 'en';
      if (panel.language !== currentLanguage) {
        // El panel está en otro idioma, no lo usamos
        return null;
      }

      return panel;
    } catch (error) {
      console.error('Error reading panel cache:', error);
      return null;
    }
  }

  /**
   * Guarda un panel en el caché
   */
  savePanel(
    articleId: string, 
    discussion: any[], 
    consensus: any,
    marketData: any
  ): void {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      const panels: Record<string, CachedPanel> = cached ? JSON.parse(cached) : {};
      
      const currentLanguage = localStorage.getItem('i18nextLng') || 'en';
      
      panels[articleId] = {
        articleId,
        discussion,
        consensus,
        marketData,
        timestamp: Date.now(),
        language: currentLanguage
      };

      // Limpiar paneles antiguos (mantener máximo 20)
      const sortedPanels = Object.entries(panels)
        .sort(([, a], [, b]) => b.timestamp - a.timestamp)
        .slice(0, 20);

      const cleanedPanels = Object.fromEntries(sortedPanels);
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cleanedPanels));
    } catch (error) {
      console.error('Error saving panel cache:', error);
    }
  }

  /**
   * Verifica si existe un panel en caché para un artículo
   */
  hasPanel(articleId: string): boolean {
    return this.getPanel(articleId) !== null;
  }

  /**
   * Elimina un panel específico del caché
   */
  removePanel(articleId: string): void {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return;

      const panels: Record<string, CachedPanel> = JSON.parse(cached);
      delete panels[articleId];
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(panels));
    } catch (error) {
      console.error('Error removing panel from cache:', error);
    }
  }

  /**
   * Limpia todo el caché
   */
  clearCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.error('Error clearing panel cache:', error);
    }
  }
}

export const panelCacheService = new PanelCacheService();