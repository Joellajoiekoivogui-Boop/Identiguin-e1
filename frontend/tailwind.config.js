/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nuit: {
          DEFAULT: '#08111F',
          2: '#0D1B2E',
          3: '#162440',
          4: '#1E2F47',
        },
        or:   { DEFAULT: '#D4AF37', clair: '#E8C56A', pale: '#F5E090' },
        gn:   { rouge: '#CE1126', jaune: '#FCD116', vert: '#009460' },
        gris: { DEFAULT: '#8A9BB5', f: '#4A6080' },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      borderRadius: { ig: '3px' },
      animation: {
        'fade-up': 'fade-in-up 0.5s ease forwards',
      },
    },
  },
  plugins: [],
};
