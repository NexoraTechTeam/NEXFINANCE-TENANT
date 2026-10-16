import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_PALETTE, paletteToCss, paletteToVars, hexToRgbChannels, type Palette } from '@/lib/theme';

const ROOT = path.resolve(__dirname, '..');

const ALMUSABBIHIN: Palette = {
  source: 'logo',
  primary: '#196fb0',
  secondary: '#5ebd69',
  accent: '#5ebd69',
  sidebar: '#153147',
  sidebarDeep: '#0c2131',
  brand: {
    50: '#eff6fa', 100: '#dfecf6', 200: '#bedaef', 300: '#8abee5', 400: '#4399db',
    500: '#196fb0', 600: '#155e95', 700: '#12507f', 800: '#0e3f64', 900: '#0a2e49',
  },
};

describe('tenant palette → CSS variables', () => {
  it('converts hex to space-separated RGB channels', () => {
    expect(hexToRgbChannels('#196fb0')).toBe('25 111 176');
    expect(() => hexToRgbChannels('blue')).toThrow();
  });

  it('maps every brand stop and Nexora token alias', () => {
    const vars = paletteToVars(ALMUSABBIHIN);
    expect(vars['--brand-500']).toBe('#196fb0');
    expect(vars['--brand-500-rgb']).toBe('25 111 176');
    expect(vars['--nx-navy']).toBe('#153147');
    expect(vars['--nx-navy-deep']).toBe('#0c2131');
    expect(vars['--nx-blue']).toBe('#196fb0');
    expect(vars['--nx-purple']).toBe('#5ebd69');
    expect(vars['--nx-gold']).toBe('#5ebd69');
    expect(vars['--nx-gold-rgb']).toBe('94 189 105');
  });

  it('renders a :root block and refuses unsafe values', () => {
    const css = paletteToCss(ALMUSABBIHIN);
    expect(css.startsWith(':root{')).toBe(true);
    expect(css).toContain('--brand-500:#196fb0;');
    const evil = { ...ALMUSABBIHIN, primary: 'red;}</style><script>alert(1)</script>' } as Palette;
    expect(() => paletteToCss(evil)).toThrow();
  });

  it('keeps the Nexora palette as the default', () => {
    expect(DEFAULT_PALETTE.brand['500']).toBe('#4373b8');
    expect(paletteToVars(DEFAULT_PALETTE)['--nx-navy']).toBe('#152d4f');
  });
});

describe('pages use theme tokens, not hardcoded brand colors', () => {
  const BRAND_HEX = /#(4373b8|3461a8|2a4f8c|6390d0|eef3fb|dce6f6|b9cded|8faee0|6b4fa0|5b4192|f3effa|f5b70a|152d4f|223f70|1b3257)/i;
  const BRAND_RGBA = /rgba\(\s*(67,\s*115,\s*184|107,\s*79,\s*160|143,\s*174,\s*224|21,\s*45,\s*79|245,\s*183,\s*10)/;

  const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return /\.tsx$/.test(e.name) ? [full] : [];
  });

  it('has no brand hex/rgba literals in app or components (theme module excepted)', () => {
    const offenders = [...walk(path.join(ROOT, 'app')), ...walk(path.join(ROOT, 'components'))]
      .filter((file) => {
        const src = fs.readFileSync(file, 'utf8');
        return BRAND_HEX.test(src) || BRAND_RGBA.test(src);
      })
      .map((file) => path.relative(ROOT, file));
    expect(offenders).toEqual([]);
  });

  it('does not hardcode the previous school identity', () => {
    const offenders = [...walk(path.join(ROOT, 'app')), ...walk(path.join(ROOT, 'components'))]
      .filter((file) => /Yayasan ISAk 35|ISAk 35 · SIT|ISAk 35 • SIT/.test(fs.readFileSync(file, 'utf8')))
      .map((file) => path.relative(ROOT, file));
    expect(offenders).toEqual([]);
  });
});
