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
          500: '#319ea9',
          600: '#278a94',
        },
      },
      screens: {
        'mobile': { 'max': '768px' },
      },
    },
  },
  plugins: [],
};
export default config;
