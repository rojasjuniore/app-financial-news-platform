import { useEffect, useRef, useCallback } from 'react';
import { focusUtils, keyboardUtils } from '../../utils/a11y';

/**
 * Hook for managing focus in modal dialogs and overlays
 */
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the first focusable element in the container
    const firstFocusable = focusUtils.getFirstFocusable(containerRef.current);
    if (firstFocusable) {
      firstFocusable.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && containerRef.current) {
        focusUtils.trapFocus(containerRef.current, event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to the previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
};

/**
 * Hook for managing focus in dropdown menus and lists
 */
export const useMenuFocus = () => {
  const containerRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<HTMLElement[]>([]);
  const currentIndexRef = useRef<number>(-1);

  const registerItem = useCallback((item: HTMLElement) => {
    if (!itemsRef.current.includes(item)) {
      itemsRef.current.push(item);
    }
    return () => {
      itemsRef.current = itemsRef.current.filter(i => i !== item);
    };
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!itemsRef.current.length) return;

    const newIndex = keyboardUtils.handleMenuNavigation(
      event,
      itemsRef.current,
      currentIndexRef.current
    );

    if (newIndex !== currentIndexRef.current) {
      currentIndexRef.current = newIndex;
    }
  }, []);

  const focusFirst = useCallback(() => {
    if (itemsRef.current.length > 0) {
      itemsRef.current[0].focus();
      currentIndexRef.current = 0;
    }
  }, []);

  const focusLast = useCallback(() => {
    if (itemsRef.current.length > 0) {
      const lastIndex = itemsRef.current.length - 1;
      itemsRef.current[lastIndex].focus();
      currentIndexRef.current = lastIndex;
    }
  }, []);

  const clearItems = useCallback(() => {
    itemsRef.current = [];
    currentIndexRef.current = -1;
  }, []);

  return {
    containerRef,
    registerItem,
    handleKeyDown,
    focusFirst,
    focusLast,
    clearItems,
    currentIndex: currentIndexRef.current
  };
};

/**
 * Hook for managing focus on route changes
 */
export const useRouteFocus = (routeName: string) => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Focus the main heading when route changes
    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, [routeName]);

  return headingRef;
};

/**
 * Hook for managing focus visibility
 */
export const useFocusVisible = () => {
  useEffect(() => {
    let hadKeyboardEvent = true;
    let keyboardThrottleTimeout: NodeJS.Timeout | undefined;

    const handlePointerDown = () => {
      hadKeyboardEvent = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.altKey || e.ctrlKey) {
        return;
      }

      hadKeyboardEvent = true;
      if (keyboardThrottleTimeout) {
        clearTimeout(keyboardThrottleTimeout);
      }
    };

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      if (hadKeyboardEvent || target.matches(':focus-visible')) {
        target.classList.add('focus-visible');
      }
    };

    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      target.classList.remove('focus-visible');
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('touchstart', handlePointerDown, true);
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('touchstart', handlePointerDown, true);
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, []);
};

/**
 * Hook for managing focus restoration after dismissible actions
 */
export const useFocusRestore = () => {
  const restoreElementRef = useRef<HTMLElement | null>(null);

  const capture = useCallback(() => {
    restoreElementRef.current = document.activeElement as HTMLElement;
  }, []);

  const restore = useCallback(() => {
    if (restoreElementRef.current && typeof restoreElementRef.current.focus === 'function') {
      restoreElementRef.current.focus();
    }
  }, []);

  return { capture, restore };
};

/**
 * Hook for managing focus announcement for dynamic content
 */
export const useFocusAnnouncement = () => {
  const announce = useCallback((element: HTMLElement, message: string) => {
    // Create temporary aria-live region for announcement
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;

    element.appendChild(liveRegion);

    // Remove after announcement
    setTimeout(() => {
      if (liveRegion.parentNode) {
        element.removeChild(liveRegion);
      }
    }, 1000);
  }, []);

  return { announce };
};