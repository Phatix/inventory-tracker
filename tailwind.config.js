/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0a0f0d',
          surface: '#111815',
          elevated: '#171f1b',
          border: '#1f2a25',
        },
        accent: {
          DEFAULT: '#4ade80',
          hover: '#22c55e',
          dim: '#16331f',
        },
        ink: {
          DEFAULT: '#e2e8f0',
          mute: '#94a3b8',
          dim: '#64748b',
        },
        danger: '#f87171',
        warn: '#fbbf24',
      },
      fontFamily: {
        sans: [
          'Inter',
          'Outfit',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
