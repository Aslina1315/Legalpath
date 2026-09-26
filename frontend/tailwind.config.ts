import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          primary: '#0a0b14',
          secondary: '#0f1023',
          elevated: '#151730',
          card: '#141630',
        },
        accent: {
          violet: '#8b5cf6',
          purple: '#a78bfa',
          indigo: '#6366f1',
          cyan: '#22d3ee',
        },
        neutral: {
          50: '#e8eaf6',
          100: '#c5cae9',
          200: '#9ca3c4',
          300: '#7c83a8',
          400: '#5c6190',
          500: '#474c78',
          600: '#353961',
          700: '#262a4a',
          800: '#1a1d38',
          900: '#0f1023',
          950: '#0a0b14',
        },
        trust: {
          green: '#34d399',
          amber: '#fbbf24',
          red: '#f87171',
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.5s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'slide-up': 'slide-up 0.4s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.4s ease-out forwards',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.2)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'breathe': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.4' },
          '50%': { transform: 'scale(1.1)', opacity: '0.8' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(99, 102, 241, 0.1)',
        'glow-md': '0 0 30px rgba(99, 102, 241, 0.15)',
        'glow-lg': '0 0 50px rgba(99, 102, 241, 0.2)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.35), 0 0 1px rgba(99, 102, 241, 0.15)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.45), 0 0 2px rgba(99, 102, 241, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
