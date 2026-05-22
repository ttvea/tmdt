/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6B5CE7',
          pressed: '#5A4BD4',
          deep: '#4A3DBF'
        },
        navy: {
          DEFAULT: '#0F111A',
          deep: '#08090E',
          mid: '#1A1D2E'
        },
        ink: '#1A1A1A',
        charcoal: '#37352F',
        slate: '#6B6B6B',
        steel: '#9B9B9B',
        hairline: '#E5E5E5',
        surface: '#F7F6F3',
        'surface-soft': '#F1F0ED',
        mint: '#E8F5EE',
        lavender: '#F1EEFC'
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        card: '0 4px 12px rgba(15, 15, 15, 0.08)',
        subtle: '0 1px 2px rgba(15, 15, 15, 0.04)'
      }
    },
  },
  plugins: [],
}
