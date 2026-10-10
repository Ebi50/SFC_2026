/** @type {import('tailwindcss').Config} */
// Vorher per CDN (cdn.tailwindcss.com) im Browser erzeugt – jetzt beim Build gebündelt.
export default {
  content: [
    './index.html',
    './*.tsx',
    './components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#DC2626',
        'primary-dark': '#B91C1C',
        'primary-light': '#FF4D4F',
        'dark-bg': '#1B1B1F',
        'secondary': '#212121',
        'light': '#F5F5F5',
        'accent': '#FFB347',
      },
      fontFamily: {
        'display': ['Oswald', 'sans-serif'],
        'sans': ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'hover': '0 12px 32px rgba(0, 0, 0, 0.18)',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};
