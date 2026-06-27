/** @type {import('tailwindcss').Config} */
// Design tokens for the Apple / glassmorphism light theme.
// Centralized so the whole look reskins by swapping these values.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // surface / background — Sup brand warm canvas
        canvas: '#f8f6f0',
        ink: {
          DEFAULT: '#150B26', // deep purple-black primary text
          soft: '#6B6378',    // secondary text
          faint: '#A69FB3',   // tertiary / labels
        },
        accent: {
          DEFAULT: '#A855F7', // Sup purple (editorial-accent)
          soft: '#C084FC',    // lighter purple (editorial-accent-bright)
          ghost: 'rgba(168,85,247,0.10)',
        },
        violet: {
          surface: '#EADCFB', // light violet card tint
          subtle: '#F4EAFF',  // very light violet bg tint
        },
        glass: {
          DEFAULT: 'rgba(255,255,255,0.65)',
          strong: 'rgba(255,255,255,0.82)',
          hairline: 'rgba(168,85,247,0.12)', // subtle purple hairline
        },
        ok: '#34C759',
        warn: '#FF9F0A',
        danger: '#FF3B30',
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
        '3xl': '26px',
      },
      boxShadow: {
        glass: '0 8px 40px rgba(80,20,120,0.07), 0 2px 8px rgba(80,20,120,0.04)',
        'glass-lg': '0 24px 80px rgba(80,20,120,0.11), 0 6px 18px rgba(80,20,120,0.06)',
        hairline: 'inset 0 0 0 1px rgba(168,85,247,0.15)',
      },
      backdropBlur: {
        glass: '20px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'SF Pro Display',
          'Inter',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
        mono: ['SF Mono', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        label: '0.06em',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
