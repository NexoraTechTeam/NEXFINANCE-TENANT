# ADR 0001 — Multi-tenant: one deployment, Postgres schema per tenant

**Status:** accepted · 2026-10-16

## Context
NexFinance was single-tenant with an in-memory store (data lost on restart).
The SaaS must serve many schools from one deployment, with strong data isolation
and per-school backup/export, without changing the API contracts the frontend relies on.

## Decision
- Tenant is resolved from the request host (`x-forwarded-host` from the Next.js proxy,
  else `Host`) via `platform.tenant_domains`.
- `platform` schema holds the tenant registry, domains, console users, audit and assets.
- Every tenant gets its own schema `t_<slug>` created from `TENANT_MIGRATIONS`
  (`backend/src/db/migrate.js`), provisioned atomically by `provisionTenant`.
- Inside a tenant schema:
  - relational tables where constraints matter: `users` (unique username/email,
    bcrypt hash, forced password change), `role_permissions`, `settings`, `id_counters`;
  - a `records` table (collection, id, jsonb) for module documents
    (students, invoices, expenses, journals, …). It preserves the exact record shapes
    and list ordering of the former in-memory arrays, so every API response is unchanged
    (guarded by the original contract suite in `src/__tests__/app.test.js`).
- Queries are scoped with `knex.withSchema(schema)` — never `SET search_path` on pooled connections.
- JWTs carry `aud: "tenant"` and `tid`; a token is rejected on any other tenant's host.

## Consequences
- Isolation per school; `pg_dump -n t_<slug>` backs up / exports one school.
- New tenants need no deploy (only DNS/router for their host).
- Module data in jsonb is simple to evolve; if a module later needs heavy SQL reporting,
  it can be promoted to dedicated tables with a tenant migration.
