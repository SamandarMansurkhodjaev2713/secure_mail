module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22'
        },
        dark: {
          50: '#f8faf9',
          100: '#eef2f1',
          200: '#e3e7e5',
          300: '#c7d1cd',
          400: '#94a3a1',
          500: '#64706e',
          600: '#3f4745',
          700: '#2b3130',
          800: '#1b1f1e',
          900: '#131615',
          950: '#0f1211'
        }
      },
      boxShadow: {
        soft: '0 8px 30px rgba(16, 185, 129, 0.15)'
      }
    }
  },
  plugins: []
}
