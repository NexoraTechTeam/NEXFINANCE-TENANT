import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif'],
      },
      colors: {
        teal: {
          50:  '#f0fafb',
          100: '#d5f0f3',
          200: '#aee2e8',
          300: '#78cfd8',
          400: '#45b5c2',
          500: '#319ea9',
          600: '#278a94',
          700: '#1e6e77',
          800: '#175660',
          900: '#124550',
        },
        sidebar: {
          DEFAULT: '#1d3744',
        },
      },
      screens: {
        'xs':     '475px',
        'mobile': { 'max': '768px' },
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.45' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        nfPulse: {
          '0%, 100%': { boxShadow: '0 10px 22px rgba(49,158,169,0.26)' },
          '50%':       { boxShadow: '0 10px 30px rgba(49,158,169,0.52)' },
        },
      },
      animation: {
        shimmer:  'shimmer 1.4s ease-in-out infinite',
        fadeUp:   'fadeUp 0.32s ease both',
        scaleIn:  'scaleIn 0.18s ease both',
        fadeIn:   'fadeIn 160ms ease',
        nfPulse:  'nfPulse 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
