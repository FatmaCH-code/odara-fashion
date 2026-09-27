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
        },
        // These flat hex-named keys exist so that classes already used throughout
        // this codebase — e.g. `bg-C9A876`, `text-2C2C2C`, `border-E8D9C4` — actually
        // generate real Tailwind utilities instead of silently doing nothing.
        // (Without this, e.g. a selected white-on-"gold" button rendered invisible:
        // white text on a transparent background, because `bg-C9A876` had no CSS.)
        'C9A876': '#C9A876',
        '2C2C2C': '#2C2C2C',
        'F5EFE0': '#F5EFE0',
        'FEFDF9': '#FEFDF9',
        'E8D9C4': '#E8D9C4',
        'D4C4B0': '#D4C4B0',
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        outfit: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
