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
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dde6ff',
          200: '#c3d0ff',
          300: '#9db0ff',
          400: '#7488ff',
          500: '#4f62f5',
          600: '#3d47ea',
          700: '#3337cf',
          800: '#2b2ea7',
          900: '#272c84',
          950: '#191b4e',
        },
        neutral: {
          50: '#f8f8f8',
          100: '#f0f0f0',
          200: '#e4e4e4',
          300: '#d1d1d1',
          400: '#a0a0a0',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        trust: {
          green: '#16a34a',
          amber: '#d97706',
          red: '#dc2626',
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.5s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'slide-up': 'slide-up 0.35s ease-out forwards',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
