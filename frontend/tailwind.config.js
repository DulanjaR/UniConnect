/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-teal': '#1B4D6A',
        'secondary-teal': '#2c5f7f',
        'accent-beige': '#F5E6C8',
        'light-beige': '#FAF6F0',
        'dark-text': '#2d3748',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
