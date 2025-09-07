/**
 * Accessibility testing utilities for development and QA
 * These utilities help validate WCAG 2.1 AA compliance
 */

import { a11yValidation, contrastUtils } from './a11y';

export interface A11yViolation {
  type: 'error' | 'warning';
  rule: string;
  description: string;
  element?: HTMLElement;
  severity: 'critical' | 'moderate' | 'minor';
}

export interface A11yTestResult {
  passed: boolean;
  violations: A11yViolation[];
  score: number; // 0-100
  recommendations: string[];
}

/**
 * Comprehensive accessibility audit for a page or component
 */
export class AccessibilityAuditor {
  private violations: A11yViolation[] = [];
  private recommendations: string[] = [];

  /**
   * Run full accessibility audit
   */
  async audit(container: HTMLElement = document.body): Promise<A11yTestResult> {
    this.violations = [];
    this.recommendations = [];

    // Run all audits
    this.auditHeadingHierarchy(container);
    this.auditImages(container);
    this.auditForms(container);
    this.auditButtons(container);
    this.auditLinks(container);
    this.auditLandmarks(container);
    this.auditColors(container);
    this.auditKeyboardAccessibility(container);
    this.auditAriaLabels(container);
    this.auditFocusManagement(container);

    // Calculate score
    const score = this.calculateScore();

    return {
      passed: this.violations.filter(v => v.type === 'error').length === 0,
      violations: this.violations,
      score,
      recommendations: this.recommendations
    };
  }

  private auditHeadingHierarchy(container: HTMLElement) {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) {
      this.addViolation('warning', 'heading-structure', 'No headings found in content', undefined, 'moderate');
      return;
    }

    let previousLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (index === 0 && level !== 1) {
        this.addViolation('error', 'heading-order', 'Page should start with h1', heading as HTMLElement, 'critical');
      }
      
      if (level > previousLevel + 1) {
        this.addViolation('error', 'heading-skip', `Heading level skipped: ${heading.tagName} after h${previousLevel}`, heading as HTMLElement, 'moderate');
      }
      
      if (!a11yValidation.hasAccessibleText(heading as HTMLElement)) {
        this.addViolation('error', 'heading-empty', 'Heading has no accessible text', heading as HTMLElement, 'critical');
      }
      
      previousLevel = level;
    });
  }

  private auditImages(container: HTMLElement) {
    const images = container.querySelectorAll('img, svg, canvas');
    
    images.forEach(img => {
      const element = img as HTMLElement;
      const alt = element.getAttribute('alt');
      const role = element.getAttribute('role');
      const ariaLabel = element.getAttribute('aria-label');
      const ariaHidden = element.getAttribute('aria-hidden');

      if (ariaHidden === 'true') {
        return; // Decorative images are OK without alt text
      }

      if (!alt && !ariaLabel && role !== 'presentation') {
        this.addViolation('error', 'image-alt', 'Image missing alt text or aria-label', element, 'critical');
      }

      if (alt === '') {
        // Empty alt is OK for decorative images, but should have role="presentation"
        if (role !== 'presentation' && ariaHidden !== 'true') {
          this.addViolation('warning', 'image-decorative', 'Empty alt text should include role="presentation"', element, 'minor');
        }
      }
    });
  }

  private auditForms(container: HTMLElement) {
    const formControls = container.querySelectorAll('input:not([type="hidden"]), select, textarea');
    
    formControls.forEach(control => {
      const element = control as HTMLElement;
      const id = element.getAttribute('id');
      const ariaLabel = element.getAttribute('aria-label');
      const ariaLabelledby = element.getAttribute('aria-labelledby');
      
      // Check for labels
      let hasLabel = false;
      
      if (id) {
        const label = container.querySelector(`label[for="${id}"]`);
        if (label) hasLabel = true;
      }
      
      if (ariaLabel || ariaLabelledby) {
        hasLabel = true;
      }
      
      if (!hasLabel) {
        this.addViolation('error', 'form-label', 'Form control missing label', element, 'critical');
      }

      // Check for required field indicators
      const required = element.hasAttribute('required');
      if (required) {
        const ariaRequired = element.getAttribute('aria-required');
        if (ariaRequired !== 'true') {
          this.addRecommendation('Add aria-required="true" to required form fields');
        }
      }
    });
  }

  private auditButtons(container: HTMLElement) {
    const buttons = container.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');
    
    buttons.forEach(btn => {
      const element = btn as HTMLElement;
      
      if (!a11yValidation.hasAccessibleText(element)) {
        this.addViolation('error', 'button-name', 'Button missing accessible name', element, 'critical');
      }
      
      if (!a11yValidation.isKeyboardAccessible(element)) {
        this.addViolation('error', 'button-keyboard', 'Button not keyboard accessible', element, 'critical');
      }
      
      // Check for toggle buttons
      const ariaPressed = element.getAttribute('aria-pressed');
      if (ariaPressed) {
        if (ariaPressed !== 'true' && ariaPressed !== 'false') {
          this.addViolation('error', 'button-state', 'Toggle button aria-pressed must be "true" or "false"', element, 'moderate');
        }
      }
    });
  }

  private auditLinks(container: HTMLElement) {
    const links = container.querySelectorAll('a[href], [role="link"]');
    
    links.forEach(link => {
      const element = link as HTMLElement;
      
      if (!a11yValidation.hasAccessibleText(element)) {
        this.addViolation('error', 'link-name', 'Link missing accessible name', element, 'critical');
      }
      
      const href = element.getAttribute('href');
      if (href && (href.startsWith('javascript:') || href === '#')) {
        this.addViolation('warning', 'link-purpose', 'Link purpose unclear, consider button instead', element, 'moderate');
      }
    });
  }

  private auditLandmarks(container: HTMLElement) {
    const main = container.querySelectorAll('main, [role="main"]');
    if (main.length === 0) {
      this.addViolation('warning', 'landmark-main', 'Page missing main landmark', undefined, 'moderate');
    } else if (main.length > 1) {
      this.addViolation('warning', 'landmark-multiple', 'Multiple main landmarks found', undefined, 'moderate');
    }

    const nav = container.querySelectorAll('nav, [role="navigation"]');
    nav.forEach((element, index) => {
      const navElement = element as HTMLElement;
      const ariaLabel = navElement.getAttribute('aria-label');
      const ariaLabelledby = navElement.getAttribute('aria-labelledby');
      
      if (nav.length > 1 && !ariaLabel && !ariaLabelledby) {
        this.addViolation('warning', 'landmark-label', 'Multiple navigation landmarks should have unique labels', navElement, 'moderate');
      }
    });
  }

  private auditColors(container: HTMLElement) {
    // Check for common color combinations that might have contrast issues
    const textElements = container.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button');
    
    textElements.forEach(element => {
      const el = element as HTMLElement;
      const style = getComputedStyle(el);
      const color = this.parseColor(style.color);
      const backgroundColor = this.parseColor(style.backgroundColor);
      
      if (color && backgroundColor) {
        const ratio = contrastUtils.getContrastRatio(color, backgroundColor);
        
        if (ratio < 4.5) {
          this.addViolation('error', 'color-contrast', `Color contrast ratio ${ratio.toFixed(2)} is below WCAG AA standard (4.5:1)`, el, 'critical');
        } else if (ratio < 7) {
          this.addRecommendation('Consider improving color contrast for AAA compliance (7:1 ratio)');
        }
      }
    });
  }

  private auditKeyboardAccessibility(container: HTMLElement) {
    const interactive = container.querySelectorAll('a, button, input, select, textarea, [tabindex], [role="button"], [role="link"], [role="tab"], [role="menuitem"]');
    
    interactive.forEach(element => {
      const el = element as HTMLElement;
      const tabIndex = el.getAttribute('tabindex');
      
      if (tabIndex && parseInt(tabIndex) > 0) {
        this.addViolation('warning', 'tabindex-positive', 'Avoid positive tabindex values', el, 'moderate');
      }
      
      if (!a11yValidation.isKeyboardAccessible(el)) {
        this.addViolation('error', 'keyboard-access', 'Interactive element not keyboard accessible', el, 'critical');
      }
    });
  }

  private auditAriaLabels(container: HTMLElement) {
    const elementsWithAria = container.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
    
    elementsWithAria.forEach(element => {
      const el = element as HTMLElement;
      const labelledby = el.getAttribute('aria-labelledby');
      const describedby = el.getAttribute('aria-describedby');
      
      if (labelledby) {
        const ids = labelledby.split(' ');
        ids.forEach(id => {
          const referencedElement = container.querySelector(`#${id}`);
          if (!referencedElement) {
            this.addViolation('error', 'aria-invalid-reference', `aria-labelledby references non-existent element: ${id}`, el, 'moderate');
          }
        });
      }
      
      if (describedby) {
        const ids = describedby.split(' ');
        ids.forEach(id => {
          const referencedElement = container.querySelector(`#${id}`);
          if (!referencedElement) {
            this.addViolation('error', 'aria-invalid-reference', `aria-describedby references non-existent element: ${id}`, el, 'moderate');
          }
        });
      }
    });
  }

  private auditFocusManagement(container: HTMLElement) {
    const modals = container.querySelectorAll('[role="dialog"], [role="alertdialog"]');
    
    modals.forEach(modal => {
      const el = modal as HTMLElement;
      const ariaModal = el.getAttribute('aria-modal');
      
      if (ariaModal !== 'true') {
        this.addViolation('error', 'modal-aria', 'Modal dialogs should have aria-modal="true"', el, 'moderate');
      }
    });
  }

  private parseColor(colorString: string): [number, number, number] | null {
    // Simple RGB color parser - in production, use a more robust solution
    const rgb = colorString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (rgb) {
      return [parseInt(rgb[1]), parseInt(rgb[2]), parseInt(rgb[3])];
    }
    return null;
  }

  private addViolation(type: 'error' | 'warning', rule: string, description: string, element?: HTMLElement, severity: 'critical' | 'moderate' | 'minor' = 'moderate') {
    this.violations.push({
      type,
      rule,
      description,
      element,
      severity
    });
  }

  private addRecommendation(recommendation: string) {
    if (!this.recommendations.includes(recommendation)) {
      this.recommendations.push(recommendation);
    }
  }

  private calculateScore(): number {
    if (this.violations.length === 0) return 100;
    
    const weights = {
      critical: 20,
      moderate: 10,
      minor: 5
    };
    
    const totalDeductions = this.violations.reduce((total, violation) => {
      return total + weights[violation.severity];
    }, 0);
    
    return Math.max(0, 100 - totalDeductions);
  }
}

/**
 * Quick accessibility check for development
 */
export const quickA11yCheck = (element?: HTMLElement): void => {
  const auditor = new AccessibilityAuditor();
  const container = element || document.body;
  
  auditor.audit(container).then(result => {
    console.group('🚀 Accessibility Audit Results');
    console.log(`Score: ${result.score}/100`);
    console.log(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (result.violations.length > 0) {
      console.group('Violations:');
      result.violations.forEach(violation => {
        const icon = violation.type === 'error' ? '❌' : '⚠️';
        const severity = violation.severity.toUpperCase();
        console.log(`${icon} [${severity}] ${violation.rule}: ${violation.description}`);
        if (violation.element) {
          console.log('Element:', violation.element);
        }
      });
      console.groupEnd();
    }
    
    if (result.recommendations.length > 0) {
      console.group('Recommendations:');
      result.recommendations.forEach(rec => console.log(`💡 ${rec}`));
      console.groupEnd();
    }
    
    console.groupEnd();
  });
};

/**
 * Development helper - adds keyboard shortcut to run accessibility check
 */
export const initA11yDevTools = (): void => {
  if (process.env.NODE_ENV === 'development') {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+A (or Cmd+Shift+A on Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        quickA11yCheck();
      }
    });
    
    console.log('🔧 A11y Dev Tools enabled! Press Ctrl+Shift+A (Cmd+Shift+A on Mac) to run accessibility check');
  }
};