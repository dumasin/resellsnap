/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1E293B',
          accent: '#2563EB',
          bg: '#F8FAFC',
          fg: '#0F172A',
          muted: '#F1F2F3',
          border: '#E4E5E7',
          secondary: '#334155',
          subtle: '#64748B',
        },
      },
      keyframes: {
        scan: {
          '0%, 100%': { top: '15%' },
          '50%': { top: '80%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        scan: 'scan 2s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite linear',
        'fade-up': 'fade-up 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
}
