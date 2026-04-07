/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#1E88F5',
        'primary-blue-dark': '#1565C0',
        'primary-blue-light': '#42A5F5',
        'secondary-blue': '#64B5F6',
        'accent-cyan': '#00BCD4',
        'accent-orange': '#FF6F3C',
        'accent-purple': '#9C27B0',
        'vibrant-pink': '#E91E63',
        'modern-bg': '#F8FAFF',
        'card-bg': '#FFFFFF',
        'dark-text': '#1A237E',
        'text-secondary': '#424242',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'md': '0 4px 12px rgba(30, 136, 245, 0.15)',
        'lg': '0 8px 24px rgba(30, 136, 245, 0.2)',
        'xl': '0 12px 32px rgba(30, 136, 245, 0.25)',
        'neon': '0 0 20px rgba(30, 136, 245, 0.4)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #1E88F5 0%, #1565C0 100%)',
        'gradient-vibrant': 'linear-gradient(135deg, #1E88F5 0%, #00BCD4 100%)',
        'gradient-warm': 'linear-gradient(135deg, #FF6F3C 0%, #FF9800 100%)',
      },
    },
  },
  plugins: [],
}
