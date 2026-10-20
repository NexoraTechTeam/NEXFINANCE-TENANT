'use strict';

/**
 * Generates an accessible brand palette from a school logo.
 * 1. Decode + downscale the logo (sharp), keep opaque, saturated, mid-tone pixels.
 * 2. Weighted hue histogram → dominant hue = primary, next distinct hue = secondary.
 * 3. Build a 50–900 ramp around the primary and nudge lightness until WCAG AA holds
 *    for white text on 500/600 and brand-700 text on brand-50.
 */

const HEX_RE = /^#?([0-9a-f]{6})$/i;
const STOPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

// ── colour math ─────────────────────────────────────────────────────────────
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

function parseHex(hex) {
  const m = HEX_RE.exec(String(hex || '').trim());
  if (!m) throw new Error(`Invalid color: ${hex}`);
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

const toHex = ({ r, g, b }) => `#${[r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('')}`;

function rgbToHsl({ r, g, b }) {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === R) h = (G - B) / d + (G < B ? 6 : 0);
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  return { h: h * 60, s, l };
}

function hslToRgb({ h, s, l }) {
  const hue2rgb = (p, q, t) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  if (s === 0) return { r: l * 255, g: l * 255, b: l * 255 };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = (((h % 360) + 360) % 360) / 360;
  return {
    r: hue2rgb(p, q, hk + 1 / 3) * 255,
    g: hue2rgb(p, q, hk) * 255,
    b: hue2rgb(p, q, hk - 1 / 3) * 255,
  };
}

const hexToHsl = (hex) => rgbToHsl(parseHex(hex));
const hslToHex = (hsl) => toHex(hslToRgb(hsl));

function luminance(hex) {
  const { r, g, b } = parseHex(hex);
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Darken (or lighten) in HSL until `ok(hex)` holds. */
function adjustUntil(hsl, ok, step = -0.01) {
  let cur = { ...hsl };
  for (let i = 0; i < 100 && !ok(hslToHex(cur)); i += 1) cur = { ...cur, l: clamp(cur.l + step, 0.02, 0.98) };
  return cur;
}

const hueDistance = (a, b) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

// ── palette construction ────────────────────────────────────────────────────
function buildRamp(primaryHex) {
  const base = hexToHsl(primaryHex);
  const s = clamp(base.s, 0.35, 0.85);
  const tone = (l, sat = s) => ({ h: base.h, s: sat, l });

  const c500 = adjustUntil(tone(clamp(base.l, 0.3, 0.55)), (hex) => contrastRatio('#ffffff', hex) >= 4.6);
  const c600 = adjustUntil(tone(c500.l - 0.06), (hex) => contrastRatio('#ffffff', hex) >= 5.5);
  const l700 = Math.min(0.3, c600.l - 0.05);

  const ramp = {
    50: tone(0.96, s * 0.7),
    100: tone(0.92, s * 0.75),
    200: tone(0.84, s * 0.8),
    300: tone(Math.max(0.72, c500.l + 0.2), s * 0.85),
    400: tone(Math.max(c500.l + 0.1, 0.56), s * 0.9),
    500: c500,
    600: c600,
    700: tone(l700),
    800: tone(Math.max(l700 - 0.06, 0.12)),
    900: tone(Math.max(l700 - 0.12, 0.08)),
  };
  const brand = Object.fromEntries(STOPS.map((k) => [k, hslToHex(ramp[k])]));
  // Text on light brand surfaces must stay readable.
  if (contrastRatio(brand['700'], brand['50']) < 4.5) {
    brand['700'] = hslToHex(adjustUntil(ramp[700], (hex) => contrastRatio(hex, brand['50']) >= 4.5));
  }
  return { brand, hue: base.h };
}

/** Sidebar background: a manual choice is kept when white menu text stays AA-readable, else darkened. */
function sidebarColors(hue, manual) {
  if (!manual) {
    return {
      sidebar: hslToHex(adjustUntil({ h: hue, s: 0.55, l: 0.18 }, (hex) => contrastRatio('#ffffff', hex) >= 9)),
      sidebarDeep: hslToHex({ h: hue, s: 0.6, l: 0.12 }),
    };
  }
  const chosen = toHex(parseHex(manual));
  const base = hexToHsl(chosen);
  const readable = contrastRatio('#ffffff', chosen) >= 4.5
    ? chosen : hslToHex(adjustUntil(base, (hex) => contrastRatio('#ffffff', hex) >= 4.5));
  const l = hexToHsl(readable).l;
  return { sidebar: readable, sidebarDeep: hslToHex({ ...hexToHsl(readable), l: clamp(l * 0.7, 0.04, l - 0.02) }) };
}

function buildPalette({ primary, secondary, accent, sidebar: manualSidebar, source = 'manual' } = {}) {
  const primaryHex = toHex(parseHex(primary));
  const { brand, hue } = buildRamp(primaryHex);
  const secondaryHex = secondary
    ? toHex(parseHex(secondary))
    : hslToHex({ h: hue + 150, s: 0.55, l: 0.45 });

  const { sidebar, sidebarDeep } = sidebarColors(hue, manualSidebar);
  const accentBase = hexToHsl(accent ? toHex(parseHex(accent)) : secondaryHex);
  const accentHex = hslToHex(adjustUntil(accentBase, (hex) => contrastRatio(hex, sidebar) >= 3.2, 0.01));

  return {
    source,
    primary: primaryHex,
    secondary: secondaryHex,
    accent: accentHex,
    sidebar,
    sidebarDeep,
    brand,
  };
}

async function generatePaletteFromImage(buffer) {
  const sharp = require('sharp');
  const { data, info } = await sharp(buffer)
    .resize(128, 128, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = Array.from({ length: 36 }, () => ({ weight: 0, r: 0, g: 0, b: 0, n: 0 }));
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 3] < 200) continue;
    const rgb = { r: data[i], g: data[i + 1], b: data[i + 2] };
    const { h, s, l } = rgbToHsl(rgb);
    if (s < 0.3 || l > 0.9 || l < 0.1) continue;
    const bucket = buckets[Math.floor(h / 10) % 36];
    bucket.weight += s;
    bucket.r += rgb.r;
    bucket.g += rgb.g;
    bucket.b += rgb.b;
    bucket.n += 1;
  }

  const ranked = buckets
    .map((b, i) => ({ ...b, hue: i * 10 + 5 }))
    .filter((b) => b.n > 0)
    .sort((a, b) => b.weight - a.weight);
  if (ranked.length === 0) throw new Error('Logo has no usable brand colors');

  const avg = (b) => toHex({ r: b.r / b.n, g: b.g / b.n, b: b.b / b.n });
  const top = ranked[0];
  const second = ranked.find((b) => hueDistance(b.hue, top.hue) >= 40 && b.weight >= top.weight * 0.05);

  return buildPalette({ primary: avg(top), secondary: second ? avg(second) : undefined, source: 'logo' });
}

/** Nexora house palette (NexFinance default). */
const DEFAULT_PALETTE = {
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

module.exports = {
  generatePaletteFromImage, buildPalette, contrastRatio, hexToHsl, hslToHex, parseHex, DEFAULT_PALETTE,
};
