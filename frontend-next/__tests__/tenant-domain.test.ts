import { describe, expect, it } from 'vitest';
import { tenantDomain } from '@/lib/tenant-domain';

describe('tenantDomain', () => {
  it('appends the slug to a parent domain', () => {
    expect(tenantDomain('al-musabbihin', 'nexfinance.nexoratech.co')).toBe('al-musabbihin.nexfinance.nexoratech.co');
  });
  it('supports {label} (slug without hyphens) and {slug} patterns', () => {
    expect(tenantDomain('al-musabbihin', '{label}-nexfinance.nexoratech.co')).toBe('almusabbihin-nexfinance.nexoratech.co');
    expect(tenantDomain('al-musabbihin', '{slug}-nexfinance.nexoratech.co')).toBe('al-musabbihin-nexfinance.nexoratech.co');
  });
  it('returns null without slug or base', () => {
    expect(tenantDomain('', 'x.test')).toBeNull();
    expect(tenantDomain('a', null)).toBeNull();
  });
});
