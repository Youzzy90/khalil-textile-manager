/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme (sombre noir/or)
        bg: { base: '#0F1115', panel: '#1A1D24', soft: '#15181E', hover: '#21252E' },
        border: { DEFAULT: '#2A2F3A', soft: '#22262F' },
        text: { primary: '#F5F5F7', secondary: '#A0A4AE', muted: '#6B7280' },
        gold: {
          50: '#FBF6E3', 100: '#F5EBC0', 300: '#E6C75A',
          400: '#D9B94E', 500: '#D4AF37', 600: '#B8932B', 700: '#8B6914',
        },
        success: { 100: '#E6F4EA', 300: '#6FCF97', 500: '#3FB950', 700: '#1A7F37' },
        warning: { 100: '#FFF4E5', 300: '#F0B66A', 500: '#E8A33D', 700: '#9A6700' },
        danger:  { 100: '#FFEDED', 300: '#F87171', 500: '#F85149', 700: '#CF222E' },
        info:    { 100: '#E8F0FE', 300: '#7AA5F0', 500: '#58A6FF', 700: '#0969DA' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { lg: '10px' },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        glow: '0 0 0 1px rgba(212,175,55,0.3), 0 0 20px rgba(212,175,55,0.15)',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { '0%': { opacity: '0', transform: 'translateX(20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        pulseGold: { '0%,100%': { boxShadow: '0 0 0 0 rgba(212,175,55,0.5)' }, '50%': { boxShadow: '0 0 0 6px rgba(212,175,55,0)' } },
      },
      animation: {
        fadeIn: 'fadeIn 200ms ease-out',
        slideUp: 'slideUp 250ms ease-out',
        slideInRight: 'slideInRight 300ms ease-out',
        scaleIn: 'scaleIn 200ms ease-out',
        pulseGold: 'pulseGold 2s infinite',
      },
    },
  },
  plugins: [],
}
