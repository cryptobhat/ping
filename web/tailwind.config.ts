import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D8B7E',
          light: '#2BA89A',
          dark: '#0A6B62',
          50: '#EEF7F5',
          100: '#D9EDE9',
          200: '#B3DBD5',
          300: '#6BC4B8',
          400: '#2BA89A',
          500: '#0D8B7E',
          600: '#0A6B62',
          700: '#085249',
          800: '#063B35',
          900: '#042621',
        },
        // accent: warm saffron — used for premium CTAs, gradient accents on
        // hero text and avatar fallbacks. Pairs with primary teal.
        accent: {
          DEFAULT: '#D4A85A',
          light: '#E8C87A',
          dark: '#A87E2C',
        },
        // coral: reserved for tertiary highlights / promo banners. Currently
        // not referenced anywhere in src — keep until product confirms it's
        // unused, then drop.
        coral: {
          DEFAULT: '#E8704F',
          light: '#F09B82',
          dark: '#C44E2D',
        },
        warm: {
          50: '#FAFAF8',
          100: '#F3F2EF',
          200: '#E8E6E1',
          300: '#D6D3CD',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
          950: '#0C0A09',
        },
        // Reading themes (used by content/[id] reader). One source of truth —
        // the in-page `themes` array references these tokens via `READING_THEME`.
        reading: {
          'light-bg': '#FAFAF8',
          'light-fg': '#1F1B16',
          'sepia-bg': '#F4ECD8',
          'sepia-fg': '#5B4636',
          'dark-bg': '#1A1A2E',
          'dark-fg': '#E8E1D4',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'serif'],
        display: ['Cabinet Grotesk', 'var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      transitionDuration: {
        fast: 'var(--motion-fast)',
        normal: 'var(--motion-normal)',
        slow: 'var(--motion-slow)',
      },
      transitionTimingFunction: {
        motion: 'var(--motion-ease)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
