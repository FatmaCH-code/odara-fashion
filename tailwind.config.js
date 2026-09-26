/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        odara: {
          cream: '#F5F1ED',
          beige: '#E8DCC8',
          sand: '#D4C4B0',
          gold: '#C9A876',
          dark: '#1A1A1A',
        }
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        outfit: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
