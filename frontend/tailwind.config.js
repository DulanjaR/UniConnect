/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 60% Primary - Off-White
        'primary': '#F5F3F0',
        'primary-light': '#FFFFFF',
        'primary-dark': '#E8E4DF',
        'primary-50': '#FEFDFB',
        'primary-100': '#FAFAF8',

        // 30% Secondary - Blue
        'secondary': '#2563EB',
        'secondary-light': '#60A5FA',
        'secondary-lighter': '#93C5FD',
        'secondary-dark': '#1d4ed8',
        'secondary-50': '#EFF6FF',
        'secondary-100': '#DBEAFE',

        // 10% Accent - Orange
        'accent': '#FF8C42',
        'accent-light': '#FFB380',
        'accent-lighter': '#FFD4B3',
        'accent-dark': '#E67E34',
        'accent-50': '#FFF7F0',
        'accent-100': '#FFE5D0',

        // Utilities
        'neutral-text': '#2D3436',
        'neutral-text-light': '#636E72',
        'neutral-border': '#DFE6E9',
        'neutral-bg': '#ECEFF1',

        // Backward compatibility aliases
        'primary-blue': '#2563EB',
        'primary-blue-dark': '#1d4ed8',
        'primary-blue-light': '#60A5FA',
        'secondary-blue': '#60A5FA',
        'accent-cyan': '#60A5FA',
        'accent-orange': '#FF8C42',
        'accent-purple': '#FF8C42',
        'vibrant-pink': '#FF8C42',
        'modern-bg': '#F5F3F0',
        'card-bg': '#FFFFFF',
        'dark-text': '#2D3436',
        'text-secondary': '#636E72',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'md': '0 4px 12px rgba(37, 99, 235, 0.12)',
        'lg': '0 8px 24px rgba(37, 99, 235, 0.15)',
        'xl': '0 12px 32px rgba(37, 99, 235, 0.2)',
        'neon': '0 0 20px rgba(255, 140, 66, 0.3)',
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)',
        'gradient-accent': 'linear-gradient(135deg, #FF8C42 0%, #E67E34 100%)',
        'gradient-mixed': 'linear-gradient(135deg, #2563EB 0%, #FF8C42 100%)',
        'gradient-soft': 'linear-gradient(135deg, #F5F3F0 0%, #EFF6FF 100%)',
        // Backward compatibility
        'gradient-vibrant': 'linear-gradient(135deg, #2563EB 0%, #FF8C42 100%)',
        'gradient-warm': 'linear-gradient(135deg, #FF8C42 0%, #FFB380 100%)',
      },
    },
  },
  plugins: [],
}
