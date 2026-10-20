'use strict';

const fs = require('fs');
const path = require('path');
const {
  generatePaletteFromImage, buildPalette, contrastRatio, hexToHsl, DEFAULT_PALETTE,
} = require('../services/palette');

const fixture = (name) => fs.readFileSync(path.join(__dirname, 'fixtures', name));
const hue = (hex) => hexToHsl(hex).h;
const STOPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

describe('palette from logo', () => {
  let palette;

  beforeAll(async () => {
    palette = await generatePaletteFromImage(fixture('al-musabbihin-logo.png'));
  });

  it('picks the logo blue as primary and the logo green as secondary', () => {
    expect(hue(palette.primary)).toBeGreaterThanOrEqual(195);
    expect(hue(palette.primary)).toBeLessThanOrEqual(225);
    expect(hue(palette.secondary)).toBeGreaterThanOrEqual(90);
    expect(hue(palette.secondary)).toBeLessThanOrEqual(150);
  });

  it('builds a full, monotonically darker brand ramp', () => {
    expect(Object.keys(palette.brand)).toEqual(STOPS);
    const lightness = STOPS.map((s) => hexToHsl(palette.brand[s]).l);
    for (let i = 1; i < lightness.length; i += 1) expect(lightness[i]).toBeLessThan(lightness[i - 1]);
  });

  it('meets WCAG AA for the pairs the UI relies on', () => {
    expect(contrastRatio('#ffffff', palette.brand['500'])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#ffffff', palette.brand['600'])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(palette.brand['700'], palette.brand['50'])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#ffffff', palette.sidebar)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(palette.accent, palette.sidebar)).toBeGreaterThanOrEqual(3);
  });

  it('handles logos with transparency', async () => {
    const p = await generatePaletteFromImage(fixture('nexfinance-mark.png'));
    expect(hue(p.primary)).toBeGreaterThanOrEqual(190);
    expect(hue(p.primary)).toBeLessThanOrEqual(235);
  });

  it('rejects non-images', async () => {
    await expect(generatePaletteFromImage(Buffer.from('not an image'))).rejects.toThrow();
  });
});

describe('palette from explicit colors', () => {
  it('builds a valid palette from manual overrides', () => {
    const p = buildPalette({ primary: '#1E6FC0', secondary: '#3FAA48' });
    expect(p.primary).toBe('#1e6fc0');
    expect(contrastRatio('#ffffff', p.brand['600'])).toBeGreaterThanOrEqual(4.5);
  });

  it('exposes the Nexora default palette', () => {
    expect(DEFAULT_PALETTE.brand['500']).toBe('#4373b8');
    expect(DEFAULT_PALETTE.sidebar).toBe('#152d4f');
  });

  it('rejects malformed colors', () => {
    expect(() => buildPalette({ primary: 'blue' })).toThrow(/color/i);
  });
});

describe('manual sidebar colour', () => {
  it('keeps a dark sidebar colour chosen in the Console', () => {
    const p = buildPalette({ primary: '#196fb0', secondary: '#5ebd69', sidebar: '#0E3B2E' });
    expect(p.sidebar).toBe('#0e3b2e');
    expect(hexToHsl(p.sidebarDeep).l).toBeLessThan(hexToHsl(p.sidebar).l);
    expect(contrastRatio(p.accent, p.sidebar)).toBeGreaterThanOrEqual(3);
  });

  it('darkens a too-light sidebar until white menu text stays readable (WCAG AA)', () => {
    const p = buildPalette({ primary: '#196fb0', sidebar: '#88ccff' });
    expect(contrastRatio('#ffffff', p.sidebar)).toBeGreaterThanOrEqual(4.5);
    expect(Math.abs(hue(p.sidebar) - hue('#88ccff'))).toBeLessThan(15);
  });

  it('derives the sidebar from the primary when none is given', () => {
    expect(buildPalette({ primary: '#196fb0' }).sidebar).toBe(buildPalette({ primary: '#196fb0', sidebar: '' }).sidebar);
  });
});
