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
        ner: {
          midnight: '#050c1a',     // Deep Midnight Navy background
          canvas: '#040914',       // Darkest navy
          surface: '#081328',      // Card surface navy
          surfaceHover: '#0b1c3a', // Card hover
          border: '#14294a',       // Slate-blue border
          borderLight: '#1d3b6a',  // Active border
          teal: '#38bdf8',         // Electric Sky Blue
          emerald: '#10b981',      // Operational Green
          mint: '#34d399',         // Vibrant Mint
          amber: '#f59e0b',        // Warning Amber
          crimson: '#ef4444',      // Incident Red
          cyan: '#06b6d4',         // Waterway Cyan
          slate: '#162e4c',        // Divider / Container
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-teal': '0 0 20px -3px rgba(56, 189, 248, 0.25)',
        'glow-emerald': '0 0 20px -3px rgba(52, 211, 153, 0.3)',
        'glow-crimson': '0 0 20px -3px rgba(239, 68, 68, 0.3)',
        'card': '0 10px 30px -10px rgba(0, 0, 0, 0.6), 0 0 15px -5px rgba(56, 189, 248, 0.08)',
      }
    },
  },
  plugins: [],
}
