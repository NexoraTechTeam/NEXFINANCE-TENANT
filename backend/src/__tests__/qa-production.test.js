'use strict';

/** The production QA script: isolated throwaway tenant, full sweep, read-only counts, complete cleanup. */
const { bootstrap } = require('./helpers/setup');
const { provisionTenant } = require('../services/tenants');
const qa = require('../../scripts/qa-production');

let knex;

beforeAll(async () => {
  ({ knex } = await bootstrap({ demo: false }));
  await provisionTenant(knex, {
    slug: 'al-musabbihin', name: 'Sekolah', domains: ['al.localhost'],
    admin: { username: 'admin-al', name: 'Admin', password: 'Temp-Pass-123' },
  });
});

afterAll(async () => {
  await knex.destroy();
});

describe('qa-production script', () => {
  it('only ever manages its own tenant', async () => {
    await expect(qa.cleanup(knex, 'al-musabbihin')).rejects.toThrow(/refus/i);
    expect(qa.QA_SLUG).toBe('qa-final-review');
  });

  it('counts a tenant without changing it', async () => {
    const counts = await qa.countTenant(knex, 'al-musabbihin');
    expect(counts).toMatchObject({ exists: true, users: 1 });
    expect(counts.records).toEqual(expect.objectContaining({ chart_of_accounts: expect.any(Number) }));
  });

  it('runs the full sweep on a throwaway tenant with zero findings', async () => {
    const report = await qa.run(knex);
    expect(report.findings).toEqual([]);
    expect(report.checks).toBeGreaterThan(150);
    expect(report.ledger).toMatchObject({ balanced: true, cashReconciled: true });
  }, 60_000);

  it('removes every trace of the throwaway tenant and leaves the school untouched', async () => {
    const before = await qa.countTenant(knex, 'al-musabbihin');
    const result = await qa.cleanup(knex);
    expect(result).toMatchObject({ removed: true, schemaLeft: false, rowsLeft: 0 });
    expect(await qa.countTenant(knex, qa.QA_SLUG)).toMatchObject({ exists: false });
    expect(await qa.countTenant(knex, 'al-musabbihin')).toEqual(before);
    expect(await qa.cleanup(knex)).toMatchObject({ removed: false }); // idempotent
  });
});
