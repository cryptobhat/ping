/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
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
        gold: {
          DEFAULT: '#D4A85A',
          dark: '#A87E2C',
          soft: '#FFF8E0',
        },
        coral: {
          DEFAULT: '#E8704F',
          dark: '#C44E2D',
          soft: '#FCE5DD',
        },
      },
    },
  },
  plugins: [],
};
