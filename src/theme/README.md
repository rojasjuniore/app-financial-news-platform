# Financial News App - Design System Documentation

## Overview

This design system provides a comprehensive set of design tokens, components, and utilities specifically optimized for financial data visualization and news consumption. The system emphasizes accessibility, performance, and consistency while maintaining a modern, professional aesthetic suitable for financial applications.

## 🎨 Design Philosophy

### Core Principles
1. **Financial-First**: Colors and components optimized for market data (bullish/bearish indicators)
2. **Accessibility**: WCAG 2.1 AA compliant with proper contrast ratios
3. **Performance**: Efficient CSS with minimal runtime overhead
4. **Consistency**: Unified spacing, typography, and color systems
5. **Responsive**: Mobile-first approach with fluid layouts

### Visual Hierarchy
- **Primary**: Blue (#3b82f6) for main actions and navigation
- **Bullish**: Green (#22c55e) for positive financial data
- **Bearish**: Red (#ef4444) for negative financial data
- **Neutral**: Gray (#64748b) for unchanged values
- **Warning**: Amber (#f59e0b) for alerts and important notices

## 📁 File Structure

```
src/
├── theme/
│   ├── index.ts          # Main theme configuration
│   └── README.md         # This documentation
├── styles/
│   └── components.css    # Reusable component styles
└── index.css            # Enhanced with financial utilities
```

## 🎯 Quick Start

### 1. Using Theme Tokens (TypeScript)

```typescript
import { theme } from '../theme';

// Colors
const primaryColor = theme.colors.primary[500];
const bullishColor = theme.colors.financial.bullish[500];
const bearishColor = theme.colors.financial.bearish[500];

// Typography
const headingFont = theme.typography.fontFamily.display;
const bodySize = theme.typography.fontSize.base;

// Spacing
const cardPadding = theme.spacing[6]; // 24px
const sectionGap = theme.spacing[8];  // 32px
```

### 2. Using CSS Classes

```jsx
// Financial Cards
<div className="financial-card">
  <div className="financial-badge-bullish">+2.45%</div>
  <div className="price-display price-bullish">$150.25</div>
</div>

// Buttons
<button className="btn-primary">Primary Action</button>
<button className="btn-bullish">Buy</button>
<button className="btn-bearish">Sell</button>

// Market Status
<div className="market-status open">
  <div className="status-dot"></div>
  Market Open
</div>
```

### 3. Using CSS Variables

```css
.custom-component {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-financial-card);
  transition: all var(--duration-normal) var(--easing-smooth);
}

.custom-component:hover {
  box-shadow: var(--shadow-financial-card-hover);
}
```

## 🎨 Color System

### Primary Colors
- **Blue**: Main brand color, navigation, primary actions
- **Purple**: Secondary accent, gradients, highlights

### Financial Colors
```css
/* Bullish (Positive) */
--color-bullish: #22c55e
--color-bullish-light: #dcfce7
--color-bullish-dark: #15803d

/* Bearish (Negative) */
--color-bearish: #ef4444
--color-bearish-light: #fee2e2
--color-bearish-dark: #b91c1c

/* Neutral (Unchanged) */
--color-neutral: #64748b
--color-neutral-light: #f1f5f9
```

### Usage Examples
```jsx
// Price displays
<span className="price-display price-bullish">+$12.45</span>
<span className="price-display price-bearish">-$8.92</span>
<span className="price-display price-neutral">$0.00</span>

// Change indicators
<div className="change-indicator positive">
  <span className="arrow-up"></span>
  +2.45%
</div>
```

## 📝 Typography

### Font Stack
- **Primary**: Plus Jakarta Sans (Headings, UI)
- **Secondary**: Inter (Body text, descriptions)
- **Monospace**: Fira Code (Financial data, code)

### Scale
```css
/* Text Sizes */
text-xs    → 12px
text-sm    → 14px
text-base  → 16px
text-lg    → 18px
text-xl    → 20px

/* Heading Sizes */
text-2xl   → 24px
text-3xl   → 30px
text-4xl   → 36px
```

### Usage Examples
```jsx
<h1 className="text-3xl font-bold gradient-text">
  Financial Headlines
</h1>
<p className="text-sm text-theme-secondary">
  Market analysis and insights
</p>
<span className="price-display text-lg">
  $1,234.56
</span>
```

## 📦 Component Styles

### Cards
```jsx
// Basic card
<div className="card">Content</div>

// Financial card (enhanced shadows)
<div className="financial-card">Financial data</div>

// Glass effect card
<div className="glass-card">Translucent content</div>

// Elevated card
<div className="card-elevated">Important content</div>
```

### Buttons
```jsx
// Primary button
<button className="btn-primary">Get Started</button>

// Financial action buttons
<button className="btn-bullish">Buy Stock</button>
<button className="btn-bearish">Sell Position</button>

// Size variants
<button className="btn-primary btn-sm">Small</button>
<button className="btn-primary btn-lg">Large</button>
```

### Badges
```jsx
// Financial sentiment badges
<span className="financial-badge-bullish">Bullish</span>
<span className="financial-badge-bearish">Bearish</span>
<span className="financial-badge-neutral">Neutral</span>

// Ticker symbols
<span className="ticker-badge">$AAPL</span>
```

### Form Elements
```jsx
// Modern input
<input 
  type="text" 
  className="input-modern focus-ring" 
  placeholder="Search stocks..."
/>

// Input states
<input className="input-modern input-error" />
<input className="input-modern input-success" />
```

## ⚡ Animation System

### CSS Variables
```css
--duration-fast: 150ms
--duration-normal: 200ms
--duration-slow: 300ms
--easing-smooth: cubic-bezier(0.4, 0, 0.2, 1)
--easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

### Animation Classes
```jsx
<div className="animate-slide-up">Slides up on mount</div>
<div className="animate-fade-in-slow">Fades in slowly</div>
<div className="animate-bounce-in">Bounces in</div>

// Hover effects
<div className="hover-lift">Lifts on hover</div>
<div className="hover-glow">Glows on hover</div>
```

## 🔧 Utility Classes

### Layout
```jsx
// Responsive grids
<div className="grid-responsive">Auto-fit 300px+ columns</div>
<div className="grid-responsive-sm">Auto-fit 250px+ columns</div>

// Containers
<div className="container">Max-width with padding</div>
<div className="container-sm">Smaller max-width</div>
```

### Loading States
```jsx
// Skeleton loaders
<div className="skeleton-loader h-4 w-32"></div>
<div className="skeleton-loader h-8 w-8 rounded-full"></div>

// Spinners
<div className="spinner"></div>
<div className="spinner-lg"></div>
```

### Financial-Specific
```jsx
// Market status
<div className="market-status open">
  <div className="status-dot"></div>
  Market Open
</div>

// Change indicators
<div className="change-indicator positive">
  <span className="arrow-up"></span>
  +5.23%
</div>
```

## 🌙 Dark Mode Support

The design system includes comprehensive dark mode support:

```html
<!-- Enable dark mode -->
<html data-theme="dark">
```

```css
/* Dark mode colors automatically applied */
.dark .glass-card {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(71, 85, 105, 0.2);
}
```

## ♿ Accessibility Features

### Focus Management
```jsx
<button className="btn-primary focus-ring">
  Accessible Button
</button>
```

### Screen Reader Support
```jsx
<span className="sr-only">
  Hidden content for screen readers
</span>
```

### Reduced Motion
The system respects `prefers-reduced-motion` settings:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations disabled for users who prefer reduced motion */
}
```

## 📱 Responsive Design

### Breakpoints
```css
sm: 640px   /* Tablets */
md: 768px   /* Small laptops */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### Responsive Utilities
```jsx
<div className="mobile-only">Mobile only</div>
<div className="tablet-up">Tablet and up</div>
<div className="desktop-up">Desktop and up</div>
```

## 🖨️ Print Styles

The system includes print-optimized styles:

```jsx
<div className="no-print">Hidden when printing</div>
```

Print styles automatically:
- Remove shadows and backgrounds
- Convert colored buttons to outlined
- Optimize contrast for black and white printing

## 🔧 Customization

### Extending Colors
```typescript
// In your theme extension
const customTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    brand: {
      primary: '#your-brand-color',
      secondary: '#your-secondary-color'
    }
  }
};
```

### Custom CSS Variables
```css
:root {
  /* Add your custom variables */
  --color-brand-primary: #your-color;
  --shadow-custom: 0 4px 8px rgba(0, 0, 0, 0.1);
}
```

## 🚀 Performance Tips

1. **Use CSS Variables**: They're faster than JavaScript theme switching
2. **Leverage Utility Classes**: Reduce bundle size with atomic CSS
3. **Optimize Images**: Use appropriate formats and sizes
4. **Minimize Animations**: Only animate transform and opacity when possible

## 📋 Component Checklist

When creating new components:

- [ ] Use theme tokens for colors, spacing, and typography
- [ ] Include hover and focus states
- [ ] Support both light and dark themes
- [ ] Test with reduced motion settings
- [ ] Ensure adequate color contrast (4.5:1 minimum)
- [ ] Include proper ARIA labels and roles
- [ ] Test on mobile devices
- [ ] Verify print styles

## 🤝 Contributing

When adding new design tokens or components:

1. Follow existing naming conventions
2. Add TypeScript types for new tokens
3. Include usage examples in this documentation
4. Test across different themes and devices
5. Ensure accessibility compliance

## 📚 Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Framer Motion](https://www.framer.com/motion/) (for advanced animations)

---

**Design System Version**: 2.0.0  
**Last Updated**: January 2025  
**Maintained by**: Financial News App Design Team