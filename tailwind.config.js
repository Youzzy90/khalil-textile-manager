/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0A0B0F',
          panel: '#13151C',
          soft: '#0F1117',
          hover: '#1B1E27',
          elevated: '#161922',
        },
        border: { DEFAULT: '#23262F', soft: '#1A1D25' },
        text: { primary: '#F5F6FA', secondary: '#A8ACB8', muted: '#626673' },
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
      borderRadius: { lg: '12px', xl: '16px' },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02)',
        'card-hover': '0 8px 24px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.25)',
        glow: '0 0 0 1px rgba(212,175,55,0.35), 0 0 24px rgba(212,175,55,0.18)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.04)',
        float: '0 12px 40px -12px rgba(0,0,0,0.7)',
      },
      backgroundImage: {
        'gold-grad': 'linear-gradient(135deg, #E6C75A 0%, #D4AF37 50%, #B8932B 100%)',
        'panel-grad': 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 60%)',
        'sidebar-grad': 'linear-gradient(180deg, #0B0D11 0%, #090A0E 100%)',
        'topbar-grad': 'linear-gradient(180deg, rgba(19,21,28,0.85) 0%, rgba(10,11,15,0.85) 100%)',
        'stat-grad': 'radial-gradient(circle at top right, rgba(212,175,55,0.12), transparent 60%)',
        'accent-line': 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { '0%': { opacity: '0', transform: 'translateX(20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        pulseGold: { '0%,100%': { boxShadow: '0 0 0 0 rgba(212,175,55,0.5)' }, '50%': { boxShadow: '0 0 0 6px rgba(212,175,55,0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        barGrow: { '0%': { transform: 'scaleY(0)' }, '100%': { transform: 'scaleY(1)' } },
      },
      animation: {
        fadeIn: 'fadeIn 200ms ease-out',
        slideUp: 'slideUp 300ms cubic-bezier(0.16,1,0.3,1)',
        slideInRight: 'slideInRight 300ms ease-out',
        scaleIn: 'scaleIn 220ms cubic-bezier(0.16,1,0.3,1)',
        pulseGold: 'pulseGold 2s infinite',
        shimmer: 'shimmer 2s linear infinite',
        barGrow: 'barGrow 600ms cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
}
