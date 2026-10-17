# NexFinance SaaS

Multi-tenant edition of **NexFinance** (school finance: SPP, payroll, expenses,
procurement, ISAK 35 accounting & reports) by **Nexora**. One deployment serves
every school; each school (tenant) gets its own Postgres schema, domain, logo,
color theme and users.

> The original single-tenant NexFinance (`Nexora-Tech-Team/NEXFINANCE`) stays the
> sales/demo product and is **not** affected by this repository — see
> [docs/OPERATIONS.md](docs/OPERATIONS.md#isolation-from-nexfinance).

## Architecture

| Part | Path | Notes |
| --- | --- | --- |
| API | `backend/` | Express + Postgres (knex). Tenant resolved from host. |
| Web | `frontend-next/` | Next.js 14. Theme & identity injected per tenant (SSR). |
| Console | `/console` on `CONSOLE_HOSTS` | Nexora operator CMS: create/edit tenants, logo → palette, domains, admin resets. |
| Deploy | `docker-compose.saas.yml`, `.github/workflows/` | Isolated stack `nexfin-saas[-staging]` behind the shared Traefik. |

Design decisions: [docs/adr/0001-multi-tenant-schema-per-tenant.md](docs/adr/0001-multi-tenant-schema-per-tenant.md).

## Local development

```bash
# 1. Postgres running locally, then:
cd backend && cp .env.example .env && npm ci && npm run dev      # migrates on boot
cd frontend-next && npm ci && BACKEND_URL=http://localhost:5000 CONSOLE_HOSTS=console.localhost npm run dev
# Console: http://console.localhost:3000   Demo school: http://demo.localhost:3000
```

## Tests

```bash
cd backend && TEST_DATABASE_URL=postgres://postgres@127.0.0.1:5432/nexfin_saas_test npm test
cd frontend-next && npm test && npm run lint
sh deploy/check-isolation.sh
```

## User guide

End-to-end guide for every role with screenshots (example tenant SIT Al Musabbihin):
[docs/guide/PANDUAN_E2E_AL_MUSABBIHIN.md](docs/guide/PANDUAN_E2E_AL_MUSABBIHIN.md) · PDF alongside it.

## Operating

Onboarding a school, domains, backups and restores: [docs/OPERATIONS.md](docs/OPERATIONS.md).
