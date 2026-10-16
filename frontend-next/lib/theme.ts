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

// ── Tenant palettes (white-label) ────────────────────────────────────────────

export type BrandStop = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

export interface Palette {
  source?: 'default' | 'logo' | 'manual';
  primary: string;
  secondary: string;
  accent: string;
  sidebar: string;
  sidebarDeep: string;
  brand: Record<BrandStop, string>;
}

/** Nexora house palette — used by the NexFinance demo, the console and as fallback. */
export const DEFAULT_PALETTE: Palette = {
  source: 'default',
  primary: '#4373b8',
  secondary: '#6b4fa0',
  accent: '#f5b70a',
  sidebar: '#152d4f',
  sidebarDeep: '#0e1f38',
  brand: {
    50: '#eef3fb', 100: '#dce6f6', 200: '#b9cded', 300: '#8faee0', 400: '#6390d0',
    500: '#4373b8', 600: '#3461a8', 700: '#2a4f8c', 800: '#223f70', 900: '#1b3257',
  },
};

const HEX = /^#[0-9a-f]{6}$/i;
const STOPS: BrandStop[] = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

const safeHex = (value: string) => {
  if (!HEX.test(value)) throw new Error(`Invalid palette color: ${value}`);
  return value.toLowerCase();
};

export function hexToRgbChannels(hex: string): string {
  const n = parseInt(safeHex(hex).slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** CSS custom properties for a palette (validated — values are injected into a <style> tag). */
export function paletteToVars(palette: Palette): Record<string, string> {
  const vars: Record<string, string> = {};
  const set = (name: string, hex: string) => {
    vars[name] = safeHex(hex);
    vars[`${name}-rgb`] = hexToRgbChannels(hex);
  };
  for (const stop of STOPS) set(`--brand-${stop}`, palette.brand[stop]);
  set('--nx-navy', palette.sidebar);
  set('--nx-navy-deep', palette.sidebarDeep);
  set('--nx-blue', palette.brand['500']);
  set('--nx-purple', palette.secondary);
  set('--nx-gold', palette.accent);
  safeHex(palette.primary);
  return vars;
}

export function paletteToCss(palette: Palette): string {
  const body = Object.entries(paletteToVars(palette)).map(([k, v]) => `${k}:${v};`).join('');
  return `:root{${body}}`;
}
