/** @type {import('tailwindcss').Config} */
// Design tokens for the Apple / glassmorphism light theme.
// Centralized so the whole look reskins by swapping these values.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // surface / background
        canvas: '#F5F5F7', // Apple off-white
        ink: {
          DEFAULT: '#1D1D1F', // primary text
          soft: '#6E6E73', // secondary text
          faint: '#8E8E93',
        },
        accent: {
          DEFAULT: '#0A84FF', // single restrained system blue
          soft: '#3D9BFF',
          ghost: 'rgba(10,132,255,0.10)',
        },
        glass: {
          // white panels at ~65% opacity over the canvas
          DEFAULT: 'rgba(255,255,255,0.65)',
          strong: 'rgba(255,255,255,0.80)',
          hairline: 'rgba(255,255,255,0.40)',
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
        glass: '0 8px 40px rgba(17,17,26,0.06), 0 2px 8px rgba(17,17,26,0.04)',
        'glass-lg': '0 24px 80px rgba(17,17,26,0.10), 0 6px 18px rgba(17,17,26,0.05)',
        hairline: 'inset 0 0 0 1px rgba(255,255,255,0.40)',
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
