/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd3ff',
          300: '#8eb5ff',
          400: '#598cff',
          500: '#3366ff',
          600: '#1f47f5',
          700: '#1a35e1',
          800: '#1c2fb6',
          900: '#1d2f8f',
        },
      },
    },
  },
  plugins: [],
}
