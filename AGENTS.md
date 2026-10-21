# AGENTS.md — NexFinance Tenant (SaaS)

Guidance for any coding agent (Claude Code, Codex, Copilot …) working in this repository.
Read this file and [docs/MEMORY.md](docs/MEMORY.md) (project state & decision log) before changing anything.

## What this repository is
- **Repo:** `NexoraTechTeam/NEXFINANCE-TENANT` (branches `dev` → staging, `main` → production).
- Multi-tenant SaaS edition of NexFinance (school finance: SPP, payroll, expenses, procurement,
  ISAK 335 (formerly ISAK 35) accounting & reports) by **Nexora**. Cloned from `Nexora-Tech-Team/NEXFINANCE@dev (5f7458c)`
  with full history, then converted to multi-tenant.
- **Sibling repo:** `Nexora-Tech-Team/NEXFINANCE` = original single-tenant product used for sales/demo
  (`nexfinance.nexoratech.co`, `dev-nexfinance.nexoratech.co`). It is a separate product with its own
  deploys. Never deploy it or touch its containers from this repo. Only exception (approved 2026-10-19): the ops
  bridge branch `ops/tenant-deploy` there, which deploys *this* repo with the shared VPS runner (`deploy/sync-ops-bridge.sh`).
- First client: **SIT Al Musabbihin** (`docs/tenants/al-musabbihin/`), admin `admin-almusabbihin` (super_admin).

## Architecture (see docs/adr/0001)
| Part | Path | Key facts |
| --- | --- | --- |
| API | `backend/` | Express + knex + pg. **Schema per tenant** (`t_<slug>`), registry in schema `platform`. Tenant resolved from `x-forwarded-host`/`Host` (`middleware/tenant.js`). Domain data lives in `records` (JSONB) per collection via `db/store.js`. |
| Auth | `routes/auth.js`, `middleware/auth.js` | JWT `aud=tenant` + `tid` must match the host's tenant. Console JWT `aud=console`. Login by username **or** email, rate-limited. No public register. The user row is re-read on every request (inactive → 401, role from DB, temporary password → 403 `PASSWORD_CHANGE_REQUIRED` outside `/auth`). |
| RBAC | `middleware/rbac.js`, `frontend-next/lib/permissions.ts`, `components/auth/AccessGate.tsx` | Role → modules stored per tenant (`role_permissions`); `rbac(['a','b'])` accepts any of several modules; `denyReadOnly` blocks auditor writes; expenses approved only by approver roles and never by the submitter (`submittedById`). Sidebar menus and pages are filtered by the same permissions (no 403 pages in the UI). |
| Validation | `backend/src/lib/validate.js` | Amounts, dates and journal lines validated before posting (ledger must always balance); duplicate payroll → 409; PO requires an open PR. |
| Ledger | `services/ledger.js`, `services/posting.js` | Accrual journal auto-posted from SPP, payroll, approved expenses, received POs, opening balance, restricted receipts/releases. Reports/dashboard computed from journals — **never hardcode figures**. ISAK 335 package `GET /accounting/reports/isak335?year=` (2 net-asset classes, changes in net assets, direct cash flow, CALK); account metadata `activity`/class via `classifyAccount`. |
| Branding | `services/palette.js`, `services/branding.js`, `routes/tenant.js` | Logo → WCAG-AA palette (sharp). Public `GET /api/v1/tenant/config`. |
| Console (CMS) | `routes/console.js`, `frontend-next/app/console/**` | Only on `CONSOLE_HOSTS`. Create/edit tenants, logo/palette, domains, suspend, reset admin password, audit. |
| Web | `frontend-next/` | Next.js 14 app router. Tenant theme injected SSR in `app/layout.tsx` (CSS vars + `-rgb` channels). Colours only via tokens (`var(--brand-*)`, `rgb(var(--x-rgb)/a)`); a guard test fails on raw brand hex. |
| Deploy | `docker-compose.saas.yml`, `.github/workflows/`, `deploy/` | **Live.** Stack `nexfin-saas` (prod: `console-nexfinance.nexoratech.co`, `almusabbihin-nexfinance.nexoratech.co`) / `nexfin-saas-staging`, shared Traefik (`web`, `myresolver`). Zero-touch: `deploy/env-defaults.sh` + `deploy/ensure-secret.sh`. |
| School domains | `deploy/custom-domains.sh`, `deploy/compose-custom.sh`, `SAAS_CUSTOM_HOSTS` | A school's own domain (e.g. `almusabbihin.sch.id`) is in the tenant's domains (`tenant.json` → onboarding syncs it) and routed **only when its A record equals the console host's IP**, with its own Traefik router + certificate. Never fails a deploy (no DNS → "not routed" warning). |
| Ops bridge | `deploy/sync-ops-bridge.sh` → branch `ops/tenant-deploy` in `Nexora-Tech-Team/NEXFINANCE` | Current deploy path (this repo has no runner): snapshot of HEAD + `tenant-bridge.yml` (staging → production → credential handover; job `qa` only for commits with `[qa-prod]`). |
| QA | `docs/qa/tools/`, `backend/scripts/qa-production.js` | API sweep (every endpoint × role + ledger integrity), UI sweep (role × page + mobile), validation probes; production QA only on the throwaway tenant `qa-final-review` (created, swept, removed). |

## Commands
```bash
# Backend tests need Postgres. Local throwaway cluster (port 55432):
#   su postgres -c "/usr/lib/postgresql/16/bin/initdb -D /var/tmp/pgtest/data -A trust -U postgres"
#   su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /var/tmp/pgtest/data -o '-p 55432 -k /tmp' start"
#   psql -h 127.0.0.1 -p 55432 -U postgres -c 'create database nexfin_saas_test'
cd backend && npm ci && npm run lint && npx eslint scripts && npm test      # jest runInBand
cd frontend-next && npm ci && npm run lint && npx tsc --noEmit && npm test # vitest
sh deploy/check-isolation.sh                                               # isolation contract
for t in deploy/tests/*.test.sh scripts/tests/*.test.sh; do sh $t; done   # deploy script tests
```
`TEST_DATABASE_URL` defaults to `postgres://postgres@127.0.0.1:55432/nexfin_saas_test`.

```bash
sh deploy/sync-ops-bridge.sh /tmp/nexfin-ops-bridge          # deploy HEAD (staging → production) via the ops bridge
BRIDGE_TRAILER="[qa-prod] …" sh deploy/sync-ops-bridge.sh /tmp/nexfin-ops-bridge   # + production QA on a throwaway tenant
sh docs/guide/tools/run-all.sh                                 # regenerate guide screenshots + both PDFs (see its README)
```
Full local QA sweep (API + UI per role): see `docs/qa/tools/README.md`.

## How a change ships (every time)
1. **Observe:** read `docs/MEMORY.md` (top = current state), the code involved and the live state (curl/DNS/CI logs) — never assume.
2. **Orient/decide:** find the root cause; choose the smallest sound change; anything touching other stacks, shared Traefik,
   real school data or the NEXFINANCE demo needs Imam's explicit go.
3. **TDD:** failing test first (prove it is red on the old code), implement, green.
4. **Verify:** backend lint + jest, frontend lint + tsc + vitest (+ build), deploy-script tests, isolation contract,
   local browser E2E for UI/API changes.
5. **Ship:** small conventional commit on `dev` → push → `sync-ops-bridge.sh` → watch the bridge run (staging, production,
   "NexFinance stacks untouched") → live check (curl 200 / browser) → `git push origin dev:main`.
6. **Record:** `docs/MEMORY.md` (state snapshot, dated section, request log, lessons, open items) and `docs/PENDING_TASKS.md`;
   regenerate the guide when the UI changed; commit + push. Report to Imam in Indonesian with evidence and what Imam must do.

## Working method (mandatory)
- Follow the **Working agreement** in CLAUDE.md (applies to every repo).
- **OODA + TDD:** observe (read code/state) → orient → decide (smallest change) → act: failing test first,
  implement, then lint + typecheck + tests green before every commit.
- Small, focused commits on `dev` with conventional prefixes (`feat(...)`, `fix(...)`, `chore`, `docs`).
- Keep API response shapes backward compatible; add fields instead of renaming.
- UI copy is **Bahasa Indonesia**; code, comments and commit messages in English.
- Neutral wording for schools ("sekolah", "entitas nirlaba"), never "pesantren"/"Yayasan ISAk 35" hardcoded —
  tenant identity comes from config.

## Guardrails (never break)
1. Every compose/Traefik/container/volume/app-dir name starts with `nexfin-saas`; every `docker compose`
   call uses `-p "$STACK"`. `deploy/check-isolation.sh` enforces this in CI — extend it, never weaken it.
2. Deploy jobs record the NexFinance containers' start time before/after and fail if they changed.
3. Push to `main` (production) only after staging (`dev`) deployed green.
4. No secrets or one-time passwords in logs, commits or docs. CI onboarding uses `--no-password`;
   passwords are issued from Console → Reset password.
5. Do not modify the shared Traefik configuration; wildcard DNS/TLS needs explicit approval.
6. New tenant = Console wizard (or `docs/tenants/<slug>/tenant.json` + `ONBOARD_TENANTS`), never code changes.
7. **Real school data is never used for testing.** Production checks are read-only; anything that writes uses the throwaway
   tenant `qa-final-review` (`qa-production.js` refuses any other slug) and is removed afterwards with before/after counts.
8. School domains are DNS-gated and get their own router/certificate; a deploy must never fail because a domain has no DNS.
9. `Nexora-Tech-Team/NEXFINANCE` (demo product) is **frozen until Imam says otherwise** — no ports or pushes to its
   `dev`/`master` (a push to its `dev` redeploys the demo). Only the `ops/tenant-deploy` bridge branch is touched.
10. Never ask Imam to paste tokens or passwords in chat; credentials go through Console → Reset password or the encrypted
    CI handover. Customer-facing PDFs carry no technical or Console/internal information (leak guards enforce it).

## Where things are documented
- Operations / onboarding / backups: [docs/OPERATIONS.md](docs/OPERATIONS.md)
- Architecture decision: [docs/adr/0001-multi-tenant-schema-per-tenant.md](docs/adr/0001-multi-tenant-schema-per-tenant.md)
- Current state, decisions, open items: [docs/MEMORY.md](docs/MEMORY.md) — **update it at the end of every work session.**

## Documentation rules
- Team docs go to Outline (`docs.nexoratech.co`), never Notion; repo docs live in `docs/`.
- User manuals / guidelines follow CLAUDE.md → Working agreement #9 (real E2E run per role, framed screenshots
  with real URLs, Markdown = full internal detail, PDF = customer-shareable with no technical info and a leak guard,
  optional summary deck). Reference implementation: NEXFINANCE-TENANT `docs/guide/` + `docs/guide/tools/`.
- Every session ends with `docs/MEMORY.md` updated (status, decisions, Imam's requests log, open items) and committed.
