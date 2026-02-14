/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neuro-black': '#0a0a0a',
        'neuro-white': '#ffffff',
        'neuro-gray': '#f4f4f5',
        'neuro-red': '#dc2626', // Тот самый красный акцент
      },
      fontFamily: {
        mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'], // Хай-тек шрифт
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}