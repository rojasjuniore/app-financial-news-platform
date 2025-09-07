import React, { useEffect, useRef, useState } from 'react';

export type LiveRegionPoliteness = 'polite' | 'assertive' | 'off';

interface LiveRegionProps {
  /** The politeness level for screen reader announcements */
  politeness?: LiveRegionPoliteness;
  /** Whether the entire live region should be announced when changed */
  atomic?: boolean;
  /** Whether the live region is relevant to the user */
  relevant?: 'all' | 'additions' | 'removals' | 'text';
  /** Custom className for the live region container */
  className?: string;
  /** Child content to announce */
  children?: React.ReactNode;
}

/**
 * LiveRegion component for screen reader announcements
 * Provides a way to announce dynamic content changes to screen readers
 */
export const LiveRegion: React.FC<LiveRegionProps> = ({
  politeness = 'polite',
  atomic = true,
  relevant = 'all',
  className = '',
  children
}) => {
  const regionRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={regionRef}
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={`sr-only ${className}`}
      role="status"
    >
      {children}
    </div>
  );
};

/**
 * Hook for managing announcements to screen readers
 */
export const useAnnounce = (defaultPoliteness: LiveRegionPoliteness = 'polite') => {
  const [announcement, setAnnouncement] = useState<string>('');
  const [politeness, setPoliteness] = useState<LiveRegionPoliteness>(defaultPoliteness);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const announce = (
    message: string, 
    level: LiveRegionPoliteness = defaultPoliteness,
    delay = 100
  ) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set the politeness level
    setPoliteness(level);

    // Announce the message after a brief delay to ensure it's heard
    timeoutRef.current = setTimeout(() => {
      setAnnouncement(message);
      
      // Clear the announcement after it's been read
      setTimeout(() => {
        setAnnouncement('');
      }, 1000);
    }, delay);
  };

  const clear = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setAnnouncement('');
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    announce,
    clear,
    LiveRegionComponent: () => (
      <LiveRegion politeness={politeness}>
        {announcement}
      </LiveRegion>
    )
  };
};

/**
 * Hook for form validation announcements
 */
export const useFormAnnounce = () => {
  const { announce, LiveRegionComponent } = useAnnounce('assertive');

  const announceValidation = (fieldName: string, error?: string) => {
    if (error) {
      announce(`Error en ${fieldName}: ${error}`, 'assertive');
    } else {
      announce(`${fieldName} válido`, 'polite');
    }
  };

  const announceFormSubmission = (isSubmitting: boolean, success?: boolean, error?: string) => {
    if (isSubmitting) {
      announce('Enviando formulario...', 'polite');
    } else if (success) {
      announce('Formulario enviado exitosamente', 'assertive');
    } else if (error) {
      announce(`Error al enviar formulario: ${error}`, 'assertive');
    }
  };

  return {
    announceValidation,
    announceFormSubmission,
    LiveRegionComponent
  };
};

/**
 * Hook for navigation announcements
 */
export const useNavigationAnnounce = () => {
  const { announce, LiveRegionComponent } = useAnnounce('polite');

  const announceNavigation = (pageName: string, isLoading = false) => {
    if (isLoading) {
      announce(`Cargando ${pageName}...`, 'polite');
    } else {
      announce(`Navegado a ${pageName}`, 'polite');
    }
  };

  const announceMenuState = (menuName: string, isOpen: boolean) => {
    announce(
      `Menú ${menuName} ${isOpen ? 'abierto' : 'cerrado'}`, 
      'polite'
    );
  };

  return {
    announceNavigation,
    announceMenuState,
    LiveRegionComponent
  };
};

/**
 * Hook for content update announcements
 */
export const useContentAnnounce = () => {
  const { announce, LiveRegionComponent } = useAnnounce('polite');

  const announceContentUpdate = (type: string, count?: number) => {
    if (count !== undefined) {
      announce(
        `Se ${count === 1 ? 'ha' : 'han'} cargado ${count} ${type}${count === 1 ? '' : 's'} ${count === 1 ? 'nuevo' : 'nuevos'}`, 
        'polite'
      );
    } else {
      announce(`Contenido de ${type} actualizado`, 'polite');
    }
  };

  const announcePagination = (currentPage: number, totalPages: number) => {
    announce(`Página ${currentPage} de ${totalPages}`, 'polite');
  };

  const announceFilter = (filterName: string, isActive: boolean) => {
    announce(
      `Filtro ${filterName} ${isActive ? 'aplicado' : 'removido'}`, 
      'polite'
    );
  };

  return {
    announceContentUpdate,
    announcePagination,
    announceFilter,
    LiveRegionComponent
  };
};

/**
 * Global live region provider for app-wide announcements
 */
interface GlobalLiveRegionContextType {
  announce: (message: string, level?: LiveRegionPoliteness) => void;
  clear: () => void;
}

const GlobalLiveRegionContext = React.createContext<GlobalLiveRegionContextType | null>(null);

export const GlobalLiveRegionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { announce, clear, LiveRegionComponent } = useAnnounce('polite');

  return (
    <GlobalLiveRegionContext.Provider value={{ announce, clear }}>
      {children}
      <LiveRegionComponent />
    </GlobalLiveRegionContext.Provider>
  );
};

export const useGlobalAnnounce = () => {
  const context = React.useContext(GlobalLiveRegionContext);
  if (!context) {
    throw new Error('useGlobalAnnounce must be used within GlobalLiveRegionProvider');
  }
  return context;
};

export default LiveRegion;