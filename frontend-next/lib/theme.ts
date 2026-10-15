/**
 * Nexora brand palette — sourced from the official Nexora logo gradient
 * (navy → royal blue → purple → gold) and nexoratech.co primary navy.
 * Keep in sync with the CSS variables in app/globals.css.
 */
export const NEXORA = {
  navy: '#152D4F',
  navyDeep: '#0E1F38',
  ink: '#020B13',
  blue: '#4373B8',
  purple: '#6B4FA0',
  gold: '#F5B70A',
  gradient: 'linear-gradient(90deg, #26446F 0%, #4373B8 38%, #6B4FA0 70%, #F5B70A 100%)',
} as const;

/** Brand blue ramp (replaces the former teal accent scale). */
export const BRAND_SCALE = {
  50: '#EEF3FB',
  100: '#DCE6F6',
  200: '#B9CDED',
  300: '#8FAEE0',
  400: '#6390D0',
  500: '#4373B8',
  600: '#3461A8',
  700: '#2A4F8C',
  800: '#223F70',
  900: '#1B3257',
} as const;
