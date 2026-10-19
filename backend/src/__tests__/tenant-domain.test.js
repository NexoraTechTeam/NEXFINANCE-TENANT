'use strict';

const { tenantDomain } = require('../services/tenants');

describe('tenantDomain (default domain for a new tenant)', () => {
  it('appends the slug as a subdomain when the base has no placeholder', () => {
    expect(tenantDomain('al-musabbihin', 'nexfinance.nexoratech.co')).toBe('al-musabbihin.nexfinance.nexoratech.co');
  });

  it('fills {label} with the slug without hyphens (flat Nexora subdomains)', () => {
    expect(tenantDomain('al-musabbihin', '{label}-nexfinance.nexoratech.co')).toBe('almusabbihin-nexfinance.nexoratech.co');
  });

  it('fills {slug} with the slug as is', () => {
    expect(tenantDomain('al-musabbihin', '{slug}-nexfinance.nexoratech.co')).toBe('al-musabbihin-nexfinance.nexoratech.co');
  });

  it('returns null without a base or slug', () => {
    expect(tenantDomain('x', null)).toBeNull();
    expect(tenantDomain('', '{label}.example.test')).toBeNull();
  });
});
