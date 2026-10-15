import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { NEXORA } from '@/lib/theme';
import tailwindConfig from '@/tailwind.config';

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIRS = ['app', 'components', 'lib'];

function listSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(full);
    return /\.(tsx?|css)$/.test(entry.name) ? [full] : [];
  });
}

// Legacy teal identity that was replaced by the Nexora palette.
const LEGACY_PATTERNS: RegExp[] = [
  /#319ea9/i, /#278a94/i, /#1e6e77/i, /#45b5c2/i, /#1d3744/i, /#8fe5ec/i,
  /#f0fafb/i, /#d5f0f3/i, /#aee2e8/i, /#78cfd8/i, /#175660/i, /#124550/i,
  /rgba\(\s*49\s*,\s*158\s*,\s*169/i, /rgba\(\s*91\s*,\s*200\s*,\s*211/i,
  /rgba\(\s*39\s*,\s*138\s*,\s*148/i, /\[\s*49\s*,\s*158\s*,\s*169\s*\]/,
  /var\(--teal-\d+\)/,
];

describe('Nexora theme tokens', () => {
  it('exposes the official Nexora brand palette', () => {
    expect(NEXORA.navy).toBe('#152D4F');
    expect(NEXORA.blue).toBe('#4373B8');
    expect(NEXORA.purple).toBe('#6B4FA0');
    expect(NEXORA.gold).toBe('#F5B70A');
    expect(NEXORA.gradient).toContain(NEXORA.blue);
    expect(NEXORA.gradient).toContain(NEXORA.purple);
  });

  it('declares Nexora CSS variables in globals.css', () => {
    const css = fs.readFileSync(path.join(ROOT, 'app/globals.css'), 'utf8').toLowerCase().replace(/:\s+/g, ': ');
    expect(css).toContain('--nx-navy: #152d4f');
    expect(css).toContain('--brand-500: #4373b8');
    expect(css).toContain('--nx-purple: #6b4fa0');
    expect(css).toContain('--nx-gold: #f5b70a');
    expect(css).toContain('--sidebar-bg:');
  });

  it('registers a nexora color scale in tailwind', () => {
    const colors = (tailwindConfig.theme?.extend?.colors ?? {}) as Record<string, Record<string, string>>;
    expect(colors.brand?.['500']).toBe(NEXORA.blue);
    expect(colors.nexora?.navy).toBe(NEXORA.navy);
    expect(colors.teal).toBeUndefined();
  });

  it('contains no leftover legacy teal colors in app source', () => {
    const offenders: string[] = [];
    for (const dir of SOURCE_DIRS) {
      for (const file of listSourceFiles(path.join(ROOT, dir))) {
        const text = fs.readFileSync(file, 'utf8');
        for (const pattern of LEGACY_PATTERNS) {
          if (pattern.test(text)) offenders.push(`${path.relative(ROOT, file)} → ${pattern}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
