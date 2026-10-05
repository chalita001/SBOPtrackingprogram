/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#F37021', // Official TE Connectivity Orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        te: {
          orange: '#F37021',
          orangeHover: '#DE5F14',
          orangeDark: '#C84E06',
          orangeLight: '#FFF5EE',
          charcoal: '#1E2229',
          dark: '#14171C',
          slate: '#2C323D',
          gray: '#5C6577',
          light: '#F4F5F8',
        },
        safety: {
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
          blue: '#2563eb'
        }
      }
    },
  },
  plugins: [],
}
