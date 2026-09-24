/**
 * Design tokens — single source of truth for brand, color, and spacing.
 * The brand name "LegalPath" is a temporary placeholder.
 * To rebrand: update BRAND.name and BRAND.tagline here only.
 */

export const BRAND = {
  name: 'LegalPath',
  tagline: 'Tell us what happened. Understand what matters. Know what to do next.',
  shortDescription: 'AI-assisted legal access for everyone.',
} as const;

export const COLORS = {
  brand: {
    primary: '#4f62f5',
    primaryDark: '#3337cf',
    primaryLight: '#9db0ff',
    surface: '#f0f4ff',
  },
  neutral: {
    background: '#ffffff',
    surface: '#f8f8f8',
    border: '#e4e4e4',
    text: {
      primary: '#171717',
      secondary: '#525252',
      muted: '#a0a0a0',
    },
  },
  trust: {
    green: '#16a34a',
    amber: '#d97706',
    red: '#dc2626',
  },
} as const;

export const SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const;

export const TYPOGRAPHY = {
  fontSizeBase: '1rem',
  fontSizeSm: '0.875rem',
  fontSizeLg: '1.125rem',
  fontSizeXl: '1.25rem',
  fontSizeDisplay: 'clamp(1.75rem, 4vw, 3rem)',
  lineHeightBody: '1.6',
  lineHeightHeading: '1.2',
  fontWeightNormal: '400',
  fontWeightMedium: '500',
  fontWeightSemibold: '600',
  fontWeightBold: '700',
} as const;

export const ANIMATION = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;
