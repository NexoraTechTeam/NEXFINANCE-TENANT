# Project memory — NexFinance Tenant (SaaS)

Living record of state, decisions and open items. Newest entries first. Update at the end of every session.

## E2E guide & fixes (2026-10-17, later session)
- **User guide:** `docs/guide/PANDUAN_E2E_AL_MUSABBIHIN.md` (full, internal) + `.pdf` (49 pages, tenant-shareable: no technical info, chapters 12 go-live & 14 QA only in MD) + 51 framed screenshots in
  `docs/guide/img/`, every POV (operator → super admin → bendahara → staf → kabag → auditor), production URLs.
  Regenerate with `docs/guide/tools/run-all.sh` after UI changes. Summary deck (14 slides) is a claude.ai
  Slides artifact: https://claude.ai/artifact/PVH2eiaPNo3GFGK5qmi3p1 (private until shared by Imam).
- **Fixed while running the E2E (all with tests; backend 95, frontend 82):**
  dual control (same person could approve an expense twice → approvers distinct by user id);
  procurement UI unusable (list read `prs/pos` vs API `purchaseRequests/purchaseOrders`; PR form `item` vs
  `description`; PO form `totalCost` vs `totalAmount`; receive button waited for `ordered` but API issues
  `issued`); admin-created users now `must_change_password`; Console reset matches username **or** email;
  expense `title` kept and used in journals; hydration mismatch on Role & Akses (`useStoredUser`);
  approval toast "Persetujuan 1 dari 2" + server error messages.
- **Backlog (not done):** pick student from master when creating an SPP invoice; PR approval flow;
  wildcard DNS/TLS.

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

## Sibling repo sync (2026-10-17)
- `Nexora-Tech-Team/NEXFINANCE@dev` now runs the same backend core as this repo (single organisation,
  schema `t_nexfinance`). Port backend-core and `lib/financials.ts` fixes both ways.
- `shortMoney()` (negative amounts as "-Rp 36.8Jt") ported here from NEXFINANCE.

## Documentation standard (2026-10-17, decided by Imam)
Whenever Imam asks for user manual / guideline docs, the expected result is the NEXFINANCE-TENANT
`docs/guide/` style: real end-to-end run per role, screenshots framed with a browser bar showing the real URL,
**Markdown = full internal detail (incl. technical, go-live checklist, QA notes in internal blocks)**,
**PDF = tenant-shareable (cover, TOC, page numbers, no technical info; build fails on leaks)**, optional
summary deck. Full rule: CLAUDE.md → Working agreement #9.

## Working agreement
Imam's standing rules for every repo/session are in `CLAUDE.md` → "Working agreement".
Team documentation lives in Outline (docs.nexoratech.co) — never write to Notion.

## Lessons / gotchas
- Local clones made with `--depth` cannot be pushed to a new remote: `git fetch --unshallow <source>` first.
- `knex.withSchema()` + joins double-prefix: use `from('platform.tenant_domains as d')`.
- Jest must run in band (shared DB). Vitest `vi.mock` factories need `vi.hoisted`.
- jsdom lacks `URL.createObjectURL` and the `background` shorthand.
- In POSIX sh, `exit` inside a `| while` pipeline only exits the subshell — use `for` loops.
- `grep --exclude` after `--` is treated as a pattern; isolation script uses an allow-marker instead.
- Local docs stack: never run the backend on port 5060/5061 — Node fetch rejects SIP "bad ports" and SSR tenant theming silently falls back to defaults.
- Never `pkill -f <pattern>` in agent shells — it can kill the agent's own shell; filter PIDs.
- Cloud sessions cannot manage GitHub environments/secrets/runners (proxy 403) — provide operator scripts.

## Open items / ideas (need user approval)
- Wildcard DNS + DNS-01 wildcard certificate in shared Traefik → new tenants online without redeploy.
- Custom domain for Al-Musabbihin once the school sets the A record.
