/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        college: {
          primary: '#1E3A8A', // Deep Navy Blue
          secondary: '#0F172A',
          accent: '#2563EB',
          gold: '#D97706',
          emerald: '#059669'
        },
        sem: {
          1: '#92D050',
          2: '#B3CEFA',
          3: '#FFA766',
          4: '#00B0F0',
          5: '#FFFF00',
          6: '#F28E85',
          7: '#CC9900',
          8: '#94A3B8'
        }
      }
    },
  },
  plugins: [],
}
