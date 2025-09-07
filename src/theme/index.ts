/**
 * Financial News App - Design System Theme Configuration
 * Complete theme tokens for consistent design across the application
 */

// Color System - Financial Optimized
export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Primary blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },

  // Secondary - Purple accent
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7', // Primary purple
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764'
  },

  // Financial Colors - Critical for financial data
  financial: {
    // Bullish/Gains - Green spectrum
    bullish: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // Primary green
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d'
    },
    
    // Bearish/Losses - Red spectrum
    bearish: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Primary red
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d'
    },

    // Neutral - For unchanged values
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a'
    },

    // Warning - For alerts and important notices
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Primary amber
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f'
    }
  },

  // Grayscale - Semantic naming for better UX
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712'
  },

  // Semantic colors
  semantic: {
    background: '#ffffff',
    surface: '#f8fafc',
    surfaceHover: '#f1f5f9',
    border: '#e2e8f0',
    borderHover: '#cbd5e1',
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      tertiary: '#64748b',
      disabled: '#94a3b8'
    }
  },

  // Dark mode colors
  dark: {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceHover: '#334155',
    border: '#475569',
    borderHover: '#64748b',
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
      disabled: '#64748b'
    }
  }
} as const;

// Typography System
export const typography = {
  fontFamily: {
    sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['Fira Code', 'source-code-pro', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
    display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif']
  },
  
  fontSize: {
    // Text scales
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    
    // Heading scales
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
    '5xl': ['3rem', { lineHeight: '3rem' }],        // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
    
    // Display scales
    '7xl': ['4.5rem', { lineHeight: '1' }],         // 72px
    '8xl': ['6rem', { lineHeight: '1' }],           // 96px
    '9xl': ['8rem', { lineHeight: '1' }]            // 128px
  },
  
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em'
  },
  
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  }
} as const;

// Spacing System - 8pt grid
export const spacing = {
  px: '1px',
  0: '0px',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  11: '2.75rem',     // 44px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
  36: '9rem',        // 144px
  40: '10rem',       // 160px
  44: '11rem',       // 176px
  48: '12rem',       // 192px
  52: '13rem',       // 208px
  56: '14rem',       // 224px
  60: '15rem',       // 240px
  64: '16rem',       // 256px
  72: '18rem',       // 288px
  80: '20rem',       // 320px
  96: '24rem'        // 384px
} as const;

// Shadow System - Layered elevation
export const shadows = {
  // Subtle shadows for cards
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  
  // Standard card shadows
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  
  // Elevated elements
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  
  // Special shadows
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
  
  // Financial-specific shadows
  financial: {
    card: '0 1px 3px rgba(0, 0, 0, 0.02), 0 4px 8px rgba(0, 0, 0, 0.04), 0 8px 16px rgba(0, 0, 0, 0.06)',
    cardHover: '0 2px 4px rgba(0, 0, 0, 0.02), 0 8px 16px rgba(0, 0, 0, 0.08), 0 16px 32px rgba(0, 0, 0, 0.12)',
    glow: {
      bullish: '0 0 20px rgba(34, 197, 94, 0.3)',
      bearish: '0 0 20px rgba(239, 68, 68, 0.3)',
      primary: '0 0 20px rgba(59, 130, 246, 0.3)'
    }
  }
} as const;

// Border Radius System
export const borderRadius = {
  none: '0px',
  sm: '0.125rem',    // 2px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  full: '9999px'
} as const;

// Breakpoints - Mobile-first responsive design
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const;

// Animation System
export const animation = {
  // Timing functions
  timing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    // Custom bezier curves for financial UI
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    snappy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    gentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  },
  
  // Duration scales
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms'
  },
  
  // Predefined animations
  keyframes: {
    fadeIn: {
      from: { opacity: '0' },
      to: { opacity: '1' }
    },
    slideUp: {
      from: { opacity: '0', transform: 'translateY(20px)' },
      to: { opacity: '1', transform: 'translateY(0)' }
    },
    slideDown: {
      from: { opacity: '0', transform: 'translateY(-20px)' },
      to: { opacity: '1', transform: 'translateY(0)' }
    },
    scaleIn: {
      from: { opacity: '0', transform: 'scale(0.95)' },
      to: { opacity: '1', transform: 'scale(1)' }
    },
    pulseGlow: {
      '0%, 100%': { 
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3)' 
      },
      '50%': { 
        boxShadow: '0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(139, 92, 246, 0.5)' 
      }
    },
    float: {
      '0%, 100%': { transform: 'translateY(0px)' },
      '50%': { transform: 'translateY(-10px)' }
    },
    shimmer: {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' }
    }
  }
} as const;

// Component Variants - Reusable style combinations
export const components = {
  // Button variants
  button: {
    // Base styles
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.lg,
      fontSize: typography.fontSize.sm[0],
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.fontSize.sm[1].lineHeight,
      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      outline: 'none',
      border: 'none'
    },
    
    // Size variants
    sizes: {
      xs: { padding: '0.375rem 0.75rem', fontSize: typography.fontSize.xs[0] },
      sm: { padding: '0.5rem 1rem', fontSize: typography.fontSize.sm[0] },
      md: { padding: '0.625rem 1.25rem', fontSize: typography.fontSize.base[0] },
      lg: { padding: '0.75rem 1.5rem', fontSize: typography.fontSize.lg[0] },
      xl: { padding: '1rem 2rem', fontSize: typography.fontSize.xl[0] }
    },
    
    // Color variants
    variants: {
      primary: {
        background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.secondary[600]} 100%)`,
        color: colors.semantic.background,
        boxShadow: shadows.sm,
        ':hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 16px rgba(59, 130, 246, 0.4)`
        }
      },
      secondary: {
        background: colors.semantic.surface,
        color: colors.semantic.text.primary,
        border: `1px solid ${colors.semantic.border}`,
        ':hover': {
          background: colors.semantic.surfaceHover,
          borderColor: colors.semantic.borderHover
        }
      },
      ghost: {
        background: 'transparent',
        color: colors.semantic.text.secondary,
        ':hover': {
          background: colors.semantic.surfaceHover,
          color: colors.semantic.text.primary
        }
      },
      danger: {
        background: colors.financial.bearish[500],
        color: colors.semantic.background,
        ':hover': {
          background: colors.financial.bearish[600],
          transform: 'translateY(-1px)'
        }
      },
      success: {
        background: colors.financial.bullish[500],
        color: colors.semantic.background,
        ':hover': {
          background: colors.financial.bullish[600],
          transform: 'translateY(-1px)'
        }
      }
    }
  },
  
  // Card variants
  card: {
    base: {
      background: colors.semantic.background,
      borderRadius: borderRadius.xl,
      border: `1px solid ${colors.semantic.border}`,
      overflow: 'hidden',
      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
    },
    variants: {
      default: {
        boxShadow: shadows.financial.card,
        ':hover': {
          boxShadow: shadows.financial.cardHover,
          transform: 'translateY(-2px)'
        }
      },
      elevated: {
        boxShadow: shadows.lg,
        ':hover': {
          boxShadow: shadows.xl,
          transform: 'translateY(-4px)'
        }
      },
      flat: {
        boxShadow: shadows.none,
        border: `1px solid ${colors.semantic.border}`,
        ':hover': {
          borderColor: colors.semantic.borderHover
        }
      },
      glass: {
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        border: `1px solid rgba(255, 255, 255, 0.5)`
      }
    }
  },
  
  // Input variants
  input: {
    base: {
      width: '100%',
      padding: '0.75rem 1rem',
      fontSize: typography.fontSize.sm[0],
      lineHeight: typography.fontSize.sm[1].lineHeight,
      borderRadius: borderRadius.lg,
      border: `2px solid ${colors.semantic.border}`,
      background: colors.semantic.background,
      color: colors.semantic.text.primary,
      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      outline: 'none',
      '::placeholder': {
        color: colors.semantic.text.tertiary
      }
    },
    states: {
      focus: {
        borderColor: colors.primary[500],
        boxShadow: `0 0 0 3px rgba(59, 130, 246, 0.1)`
      },
      error: {
        borderColor: colors.financial.bearish[500],
        boxShadow: `0 0 0 3px rgba(239, 68, 68, 0.1)`
      },
      success: {
        borderColor: colors.financial.bullish[500],
        boxShadow: `0 0 0 3px rgba(34, 197, 94, 0.1)`
      },
      disabled: {
        background: colors.gray[50],
        color: colors.semantic.text.disabled,
        cursor: 'not-allowed'
      }
    }
  },
  
  // Badge variants for financial data
  badge: {
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.25rem 0.625rem',
      fontSize: typography.fontSize.xs[0],
      fontWeight: typography.fontWeight.medium,
      borderRadius: borderRadius.full,
      border: '1px solid transparent'
    },
    variants: {
      bullish: {
        background: colors.financial.bullish[50],
        color: colors.financial.bullish[700],
        borderColor: colors.financial.bullish[200]
      },
      bearish: {
        background: colors.financial.bearish[50],
        color: colors.financial.bearish[700],
        borderColor: colors.financial.bearish[200]
      },
      neutral: {
        background: colors.financial.neutral[50],
        color: colors.financial.neutral[600],
        borderColor: colors.financial.neutral[200]
      },
      warning: {
        background: colors.financial.warning[50],
        color: colors.financial.warning[700],
        borderColor: colors.financial.warning[200]
      },
      primary: {
        background: colors.primary[50],
        color: colors.primary[700],
        borderColor: colors.primary[200]
      }
    }
  }
} as const;

// Z-index scale
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800
} as const;

// Export complete theme object
export const theme = {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
  breakpoints,
  animation,
  components,
  zIndex
} as const;

export default theme;

// Type exports for TypeScript
export type Theme = typeof theme;
export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type TypographyToken = keyof typeof typography.fontSize;