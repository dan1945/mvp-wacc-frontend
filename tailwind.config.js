module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/**/*.html',
  ],  
  theme: {
    extend: {
      colors: {
        'office-blue': '#0078d4',
        'office-gray': '#323130',
        'office-light-gray': '#f3f2f1',
        'office-dark-blue': '#005a9e',
      },
      fontFamily: {
        'office': ['Segoe UI', 'system-ui', 'sans-serif'],
        'whitney': ['Whitney', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'office-s': '8px',
        'office-m': '16px', 
        'office-l': '24px',
        'office-xl': '32px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
  corePlugins: {
    preflight: false, // Disable to avoid conflicts with Fluent UI
  },
};