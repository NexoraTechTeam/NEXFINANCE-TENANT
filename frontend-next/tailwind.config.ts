import type { Config } from "tailwindcss";
import { BRAND_SCALE, NEXORA } from "./lib/theme";

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
        brand: { ...BRAND_SCALE },
        nexora: {
          navy: NEXORA.navy,
          'navy-deep': NEXORA.navyDeep,
          ink: NEXORA.ink,
          blue: NEXORA.blue,
          purple: NEXORA.purple,
          gold: NEXORA.gold,
        },
        sidebar: {
          DEFAULT: NEXORA.navy,
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
          '0%, 100%': { boxShadow: '0 10px 22px rgba(67,115,184,0.26)' },
          '50%':       { boxShadow: '0 10px 30px rgba(107,79,160,0.45)' },
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
