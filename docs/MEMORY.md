# Project memory — NexFinance Tenant (SaaS)

Living record of state, decisions and open items. Newest entries first. Update at the end of every session.

## Current status (2026-10-17)
- `dev` @ `ef0b6f4` pushed to `NexoraTechTeam/NEXFINANCE-TENANT`; CI job **Test & contracts** green
  (backend 89 tests on Postgres, frontend 71 tests, lint, typecheck, isolation contract, compose config).
- **Deploy staging: waiting** (job queued on `self-hosted`). Blocked on operator actions:
  1. `sh deploy/setup-github.sh staging <ops-email>` (environment, secrets, vars incl. `ONBOARD_TENANTS=al-musabbihin`)
  2. `RUNNER_TOKEN=… sh deploy/register-runner.sh` on the VPS (no runner is registered for org `NexoraTechTeam`)
  3. DNS A records: `console-staging.nexfinance.nexoratech.co`, `al-musabbihin.staging.nexfinance.nexoratech.co`
- `main` not pushed yet — only after staging is green (then `setup-github.sh production …`, push `dev:main`).
- Production hosts planned: `console.nexfinance.nexoratech.co`, `al-musabbihin.nexfinance.nexoratech.co`;
  custom domain `al-musabbihin.sch.id` later (Console → Domain + DNS + `SAAS_HOSTS`).

## Decisions (agreed with the user)
| Date | Decision |
| --- | --- |
| 2026-10-16 | 1 deployment for all clients, **Postgres schema per tenant**, tenant from host. |
| 2026-10-16 | Start with Nexora subdomain `<slug>.nexfinance.nexoratech.co`; custom domains later. |
| 2026-10-16 | New tenants start clean + default ISAK 35 chart of accounts + default roles + super_admin. |
| 2026-10-16 | Palette generated from the uploaded logo by default (editable in Console). |
| 2026-10-16 | The original NEXFINANCE product stays the sales/demo product; SaaS work never touches its stacks. |
| 2026-10-17 | Repo is `NexoraTechTeam/NEXFINANCE-TENANT` (not `Nexora-Tech-Team/NEXFINANCE-SAAS`). Local working copy was named `NEXFINANCE-SAAS`. |
| 2026-10-17 | Tenants listed in env var `ONBOARD_TENANTS` are created idempotently by each deploy from `docs/tenants/<slug>/tenant.json`; temp passwords never printed in CI. |

## Al-Musabbihin facts
- Name "Sekolah Islam Terpadu Al Musabbihin", short "SIT Al Musabbihin", slug `al-musabbihin`, schema `t_al_musabbihin`.
- Logo `docs/tenants/al-musabbihin/logo.png` → palette primary `#196fb0` (blue), secondary `#5ebd69` (green).
- Admin `admin-almusabbihin`, role `super_admin`, must change password at first login.
- Website (future custom domain): `al-musabbihin.sch.id`.

## Verified end-to-end (local, Playwright)
Console login → wizard → tenant created with logo palette → tenant login by username → forced password
change → opening balance → SPP invoice/payment → dashboard Kas & Bank updated → PDF with school letterhead
(`al-musabbihin_Laporan_Keuangan_<year>.pdf`).

## Lessons / gotchas
- Local clones made with `--depth` cannot be pushed to a new remote: `git fetch --unshallow <source>` first.
- `knex.withSchema()` + joins double-prefix: use `from('platform.tenant_domains as d')`.
- Jest must run in band (shared DB). Vitest `vi.mock` factories need `vi.hoisted`.
- jsdom lacks `URL.createObjectURL` and the `background` shorthand.
- In POSIX sh, `exit` inside a `| while` pipeline only exits the subshell — use `for` loops.
- `grep --exclude` after `--` is treated as a pattern; isolation script uses an allow-marker instead.
- Cloud sessions cannot manage GitHub environments/secrets/runners (proxy 403) — provide operator scripts.

## Open items / ideas (need user approval)
- Wildcard DNS + DNS-01 wildcard certificate in shared Traefik → new tenants online without redeploy.
- Custom domain for Al-Musabbihin once the school sets the A record.
