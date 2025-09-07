import { useCallback, useEffect, useRef, useState } from 'react';
import { keyboardUtils } from '../../utils/a11y';

/**
 * Hook for handling keyboard navigation in lists
 */
export const useListNavigation = <T extends HTMLElement>(
  items: T[],
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical';
    onSelect?: (item: T, index: number) => void;
  } = {}
) => {
  const { loop = true, orientation = 'vertical', onSelect } = options;
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!items.length) return;

    let nextIndex = focusedIndex;
    const isVertical = orientation === 'vertical';
    const forward = isVertical ? 'ArrowDown' : 'ArrowRight';
    const backward = isVertical ? 'ArrowUp' : 'ArrowLeft';

    switch (event.key) {
      case forward:
        event.preventDefault();
        nextIndex = focusedIndex + 1;
        if (nextIndex >= items.length) {
          nextIndex = loop ? 0 : items.length - 1;
        }
        break;
      
      case backward:
        event.preventDefault();
        nextIndex = focusedIndex - 1;
        if (nextIndex < 0) {
          nextIndex = loop ? items.length - 1 : 0;
        }
        break;
      
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      
      case 'End':
        event.preventDefault();
        nextIndex = items.length - 1;
        break;
      
      case 'Enter':
      case ' ':
        if (focusedIndex >= 0 && onSelect) {
          event.preventDefault();
          onSelect(items[focusedIndex], focusedIndex);
        }
        break;
    }

    if (nextIndex !== focusedIndex && nextIndex >= 0 && nextIndex < items.length) {
      setFocusedIndex(nextIndex);
      items[nextIndex].focus();
    }
  }, [items, focusedIndex, loop, orientation, onSelect]);

  const focusItem = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      setFocusedIndex(index);
      items[index].focus();
    }
  }, [items]);

  const reset = useCallback(() => {
    setFocusedIndex(-1);
  }, []);

  return {
    focusedIndex,
    handleKeyDown,
    focusItem,
    reset
  };
};

/**
 * Hook for handling tab panel navigation
 */
export const useTabNavigation = () => {
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const tabsRef = useRef<HTMLElement[]>([]);
  const panelsRef = useRef<HTMLElement[]>([]);

  const registerTab = useCallback((tab: HTMLElement, index: number) => {
    tabsRef.current[index] = tab;
    return () => {
      delete tabsRef.current[index];
    };
  }, []);

  const registerPanel = useCallback((panel: HTMLElement, index: number) => {
    panelsRef.current[index] = panel;
    return () => {
      delete panelsRef.current[index];
    };
  }, []);

  const selectTab = useCallback((index: number) => {
    if (index >= 0 && index < tabsRef.current.length) {
      setSelectedTab(index);
      
      // Update ARIA attributes
      tabsRef.current.forEach((tab, i) => {
        if (tab) {
          tab.setAttribute('aria-selected', (i === index).toString());
          tab.setAttribute('tabindex', i === index ? '0' : '-1');
        }
      });

      panelsRef.current.forEach((panel, i) => {
        if (panel) {
          panel.hidden = i !== index;
        }
      });

      // Focus the selected tab
      if (tabsRef.current[index]) {
        tabsRef.current[index].focus();
      }
    }
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent, currentIndex: number) => {
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = currentIndex + 1;
        if (nextIndex >= tabsRef.current.length) {
          nextIndex = 0;
        }
        break;
      
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) {
          nextIndex = tabsRef.current.length - 1;
        }
        break;
      
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      
      case 'End':
        event.preventDefault();
        nextIndex = tabsRef.current.length - 1;
        break;
    }

    if (nextIndex !== currentIndex) {
      selectTab(nextIndex);
    }
  }, [selectTab]);

  return {
    selectedTab,
    registerTab,
    registerPanel,
    selectTab,
    handleKeyDown
  };
};

/**
 * Hook for handling dropdown/combobox keyboard navigation
 */
export const useComboboxNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number>(-1);
  const [filteredOptions, setFilteredOptions] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLElement>(null);

  const openDropdown = useCallback(() => {
    setIsOpen(true);
    setSelectedOption(-1);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSelectedOption(-1);
  }, []);

  const handleInputKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          const nextIndex = selectedOption + 1;
          if (nextIndex < filteredOptions.length) {
            setSelectedOption(nextIndex);
          }
        }
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          const prevIndex = selectedOption - 1;
          if (prevIndex >= 0) {
            setSelectedOption(prevIndex);
          }
        }
        break;
      
      case 'Home':
        if (isOpen) {
          event.preventDefault();
          setSelectedOption(0);
        }
        break;
      
      case 'End':
        if (isOpen) {
          event.preventDefault();
          setSelectedOption(filteredOptions.length - 1);
        }
        break;
      
      case 'Enter':
        if (isOpen && selectedOption >= 0) {
          event.preventDefault();
          // Select the option
          closeDropdown();
        }
        break;
      
      case 'Escape':
        if (isOpen) {
          event.preventDefault();
          closeDropdown();
        }
        break;
    }
  }, [isOpen, selectedOption, filteredOptions, openDropdown, closeDropdown]);

  return {
    isOpen,
    selectedOption,
    filteredOptions,
    inputRef,
    listboxRef,
    openDropdown,
    closeDropdown,
    setFilteredOptions,
    handleInputKeyDown
  };
};

/**
 * Hook for handling modal keyboard interactions
 */
export const useModalKeyboard = (
  isOpen: boolean,
  onClose: () => void
) => {
  const modalRef = useRef<HTMLElement>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }

    // Trap focus within modal
    if (event.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  return modalRef;
};

/**
 * Hook for handling button group keyboard navigation
 */
export const useButtonGroup = () => {
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const buttonsRef = useRef<HTMLButtonElement[]>([]);

  const registerButton = useCallback((button: HTMLButtonElement, index: number) => {
    buttonsRef.current[index] = button;
    
    // Set initial tabindex
    button.setAttribute('tabindex', index === focusedIndex ? '0' : '-1');
    
    return () => {
      delete buttonsRef.current[index];
    };
  }, [focusedIndex]);

  const handleKeyDown = useCallback((event: KeyboardEvent, currentIndex: number) => {
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = currentIndex + 1;
        if (nextIndex >= buttonsRef.current.length) {
          nextIndex = 0;
        }
        break;
      
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) {
          nextIndex = buttonsRef.current.length - 1;
        }
        break;
      
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      
      case 'End':
        event.preventDefault();
        nextIndex = buttonsRef.current.length - 1;
        break;
    }

    if (nextIndex !== currentIndex) {
      setFocusedIndex(nextIndex);
      
      // Update tabindex for all buttons
      buttonsRef.current.forEach((button, i) => {
        if (button) {
          button.setAttribute('tabindex', i === nextIndex ? '0' : '-1');
          if (i === nextIndex) {
            button.focus();
          }
        }
      });
    }
  }, []);

  return {
    focusedIndex,
    registerButton,
    handleKeyDown
  };
};