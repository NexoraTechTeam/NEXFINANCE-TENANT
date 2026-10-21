import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? files(p) : /\.(tsx?|css)$/.test(f) ? [p] : [];
});

describe('ISAK wording', () => {
  it('names the standard ISAK 335; "ISAK 35" only as "d/h ISAK 35"', () => {
    const offenders = ['app', 'components', 'lib'].flatMap((d) => files(join(__dirname, '..', d)))
      .flatMap((f) => readFileSync(f, 'utf8').split('\n').map((line, i) => [f, i + 1, line] as const))
      .filter(([, , line]) => /ISAK\s?35(?!\d)/.test(line.replace(/d\/h ISAK 35/g, '')))
      .map(([f, n, line]) => `${f.split('frontend-next/')[1]}:${n}: ${line.trim().slice(0, 80)}`);
    expect(offenders).toEqual([]);
  });
});
