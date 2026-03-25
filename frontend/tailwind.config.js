/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary-teal': '#1b4d6a',
        'secondary-teal': '#2c5f7f',
        'accent-beige': '#f5e6c8',
        'light-beige': '#faf6f0',
        'dark-text': '#2d3748'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
