/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        // Меняем display шрифт на новый
        display: ['"Alegreya SC"', 'serif'], 
      },
      colors: {
        skazmor: {
          bg: '#1c1917', // stone-900
          card: '#292524', // stone-800
          accent: '#e11d48', // rose-600
          gold: '#fbbf24', // amber-400
        }
      }
    },
  },
  plugins: [],
}
