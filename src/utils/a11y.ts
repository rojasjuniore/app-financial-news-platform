/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 */

// ARIA live region types
export type LiveRegionPoliteness = 'polite' | 'assertive' | 'off';

// Focus management utilities
export const focusUtils = {
  /**
   * Set focus on an element by id with optional delay
   */
  setFocus: (elementId: string, delay = 0) => {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.focus();
      }
    }, delay);
  },

  /**
   * Get the first focusable element within a container
   */
  getFirstFocusable: (container: Element): HTMLElement | null => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];

    const focusables = container.querySelectorAll(focusableSelectors.join(', '));
    return focusables[0] as HTMLElement || null;
  },

  /**
   * Get all focusable elements within a container
   */
  getAllFocusable: (container: Element): HTMLElement[] => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];

    const focusables = container.querySelectorAll(focusableSelectors.join(', '));
    return Array.from(focusables) as HTMLElement[];
  },

  /**
   * Trap focus within a container
   */
  trapFocus: (container: Element, event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusables = focusUtils.getAllFocusable(container);
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      // Tab
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }
};

// Screen reader announcements
export const announceToScreenReader = (
  message: string, 
  politeness: LiveRegionPoliteness = 'polite',
  delay = 100
) => {
  setTimeout(() => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', politeness);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Clean up after announcement
    setTimeout(() => {
      if (announcement.parentNode) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }, delay);
};

// Keyboard navigation helpers
export const keyboardUtils = {
  isEnterOrSpace: (event: KeyboardEvent): boolean => {
    return event.key === 'Enter' || event.key === ' ';
  },

  isEscape: (event: KeyboardEvent): boolean => {
    return event.key === 'Escape';
  },

  isArrowKey: (event: KeyboardEvent): boolean => {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
  },

  handleMenuNavigation: (event: KeyboardEvent, items: HTMLElement[], currentIndex: number) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[nextIndex].focus();
        return nextIndex;
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prevIndex].focus();
        return prevIndex;
      case 'Home':
        event.preventDefault();
        items[0].focus();
        return 0;
      case 'End':
        event.preventDefault();
        items[items.length - 1].focus();
        return items.length - 1;
      default:
        return currentIndex;
    }
  }
};

// Color contrast utilities
export const contrastUtils = {
  /**
   * Calculate relative luminance of a color
   */
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio: (color1: [number, number, number], color2: [number, number, number]): number => {
    const lum1 = contrastUtils.getLuminance(...color1);
    const lum2 = contrastUtils.getLuminance(...color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  /**
   * Check if color combination meets WCAG AA standards
   */
  meetsWCAGAA: (foreground: [number, number, number], background: [number, number, number]): boolean => {
    const ratio = contrastUtils.getContrastRatio(foreground, background);
    return ratio >= 4.5; // WCAG AA requirement for normal text
  },

  /**
   * Check if color combination meets WCAG AAA standards
   */
  meetsWCAGAAA: (foreground: [number, number, number], background: [number, number, number]): boolean => {
    const ratio = contrastUtils.getContrastRatio(foreground, background);
    return ratio >= 7; // WCAG AAA requirement for normal text
  }
};

// Accessibility validation
export const a11yValidation = {
  /**
   * Check if an element has accessible text
   */
  hasAccessibleText: (element: HTMLElement): boolean => {
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    const title = element.getAttribute('title');
    const textContent = element.textContent?.trim();

    return !!(ariaLabel || ariaLabelledBy || title || textContent);
  },

  /**
   * Check if interactive element is keyboard accessible
   */
  isKeyboardAccessible: (element: HTMLElement): boolean => {
    const tabIndex = element.getAttribute('tabindex');
    const isNativelyFocusable = ['a', 'button', 'input', 'select', 'textarea'].includes(
      element.tagName.toLowerCase()
    );
    const isCustomFocusable = tabIndex !== null && tabIndex !== '-1';

    return isNativelyFocusable || isCustomFocusable;
  },

  /**
   * Validate heading hierarchy
   */
  validateHeadingHierarchy: (container: Element): { isValid: boolean; issues: string[] } => {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const issues: string[] = [];
    let previousLevel = 0;

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (index === 0 && level !== 1) {
        issues.push(`First heading should be h1, found ${heading.tagName.toLowerCase()}`);
      }
      
      if (level > previousLevel + 1) {
        issues.push(`Heading level skipped: ${heading.tagName.toLowerCase()} follows h${previousLevel}`);
      }
      
      previousLevel = level;
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }
};

// High contrast mode detection and support
export const highContrastUtils = {
  /**
   * Detect if high contrast mode is enabled
   */
  isHighContrastMode: (): boolean => {
    // Check for Windows high contrast mode
    if (window.matchMedia) {
      return window.matchMedia('(prefers-contrast: high)').matches ||
             window.matchMedia('(-ms-high-contrast: active)').matches ||
             window.matchMedia('(-ms-high-contrast: black-on-white)').matches ||
             window.matchMedia('(-ms-high-contrast: white-on-black)').matches;
    }
    return false;
  },

  /**
   * Add high contrast mode styles
   */
  applyHighContrastStyles: () => {
    if (typeof document === 'undefined') return;

    const existingStyles = document.getElementById('high-contrast-styles');
    if (existingStyles) return;

    const styles = document.createElement('style');
    styles.id = 'high-contrast-styles';
    styles.textContent = `
      @media (prefers-contrast: high) {
        * {
          border-color: ButtonText !important;
        }
        
        button, input, select, textarea {
          background: ButtonFace !important;
          color: ButtonText !important;
          border: 2px solid ButtonText !important;
        }
        
        a {
          color: LinkText !important;
        }
        
        a:visited {
          color: VisitedText !important;
        }
        
        .focus-visible, :focus-visible {
          outline: 3px solid Highlight !important;
          outline-offset: 2px !important;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
};

// Text scaling utilities
export const textScalingUtils = {
  /**
   * Check if text can scale properly
   */
  supportsTextScaling: (element: HTMLElement): boolean => {
    const computedStyle = window.getComputedStyle(element);
    const fontSize = computedStyle.fontSize;
    
    // Check if font-size is set in relative units (em, rem, %)
    return fontSize.includes('em') || fontSize.includes('rem') || fontSize.includes('%');
  },

  /**
   * Apply zoom-friendly styles
   */
  applyZoomFriendlyStyles: () => {
    if (typeof document === 'undefined') return;

    const existingStyles = document.getElementById('zoom-friendly-styles');
    if (existingStyles) return;

    const styles = document.createElement('style');
    styles.id = 'zoom-friendly-styles';
    styles.textContent = `
      /* Ensure content remains readable when zoomed to 200% */
      @media (min-resolution: 2dppx) {
        body {
          font-size: 1rem;
          line-height: 1.5;
        }
        
        .text-sm { font-size: 0.875rem !important; }
        .text-xs { font-size: 0.75rem !important; }
        
        /* Ensure touch targets are at least 44px */
        button, a, input, select, textarea {
          min-height: 44px;
          min-width: 44px;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
};

// ARIA utilities
export const ariaUtils = {
  /**
   * Generate unique ID for ARIA relationships
   */
  generateId: (prefix = 'a11y'): string => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Set up ARIA describedby relationship
   */
  setupAriaDescribedBy: (element: HTMLElement, descriptionId: string) => {
    const existingIds = element.getAttribute('aria-describedby');
    const newIds = existingIds ? `${existingIds} ${descriptionId}` : descriptionId;
    element.setAttribute('aria-describedby', newIds);
  },

  /**
   * Set up ARIA labelledby relationship
   */
  setupAriaLabelledBy: (element: HTMLElement, labelId: string) => {
    const existingIds = element.getAttribute('aria-labelledby');
    const newIds = existingIds ? `${existingIds} ${labelId}` : labelId;
    element.setAttribute('aria-labelledby', newIds);
  }
};

export default {
  focusUtils,
  announceToScreenReader,
  keyboardUtils,
  contrastUtils,
  a11yValidation,
  highContrastUtils,
  textScalingUtils,
  ariaUtils
};