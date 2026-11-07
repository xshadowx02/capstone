/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'ledge-blue': '#1e3a5f',
        'ledge-gold': '#c9a227',
        'ledge-green': '#2d7a3a',
      },
    },
  },
  plugins: [],
}
