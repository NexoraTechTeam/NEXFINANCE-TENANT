# Project memory — NexFinance Tenant (SaaS)

Living record of state, decisions and open items. Newest entries first. Update at the end of every session.

## Current state (snapshot — refresh every session)
_Last updated 2026-10-22._ Read this first; dated sections below are the history (newest first).

| Area | State |
| --- | --- |
| Production | LIVE: https://console-nexfinance.nexoratech.co/console · https://almusabbihin-nexfinance.nexoratech.co (200, Let's Encrypt). Stack `nexfin-saas`, VPS 72.61.209.201. |
| Staging | Stack `nexfin-saas-staging`, internal checks only (no DNS). |
| Branches | `dev` = 3ebfc53 is what runs in production (ops bridge run 39786938731 green: staging + production; all four hosts 200 afterwards); `main` still at fd23250 — `git push origin dev:main` waits for Imam's go (the session's permission guard refused a push to `main`). Deploy path: ops bridge `ops/tenant-deploy` in NEXFINANCE (last run 39716256253 green: staging + production, NexFinance stacks untouched). |
| Quality | Backend 190 tests (16 suites), frontend 139 (27 files), lint/tsc/build clean (2026-10-22); local API sweep 244/244, UI sweep 0 issues; earlier production QA 183 checks 0 findings. |
| Al-Musabbihin data | Empty production tenant (1 user; 18 accounts → 21 after the fixed-asset migration runs on the next deploy) — school has not started entering data. Admin `admin-almusabbihin` must change password at first login. |
| Features | Multi-tenant Console (logo palette, login photo/text, sidebar colour, rich-text attribution), SPP, payroll, expenses (dual control, approver roles), procurement (PR → PO → receive), ISAK 335 package (2 net-asset classes, changes in net assets, direct cash flow, CALK, restricted funds), **fixed assets + monthly straight-line depreciation** (Akuntansi → Aset Tetap, CALK note G), role-filtered menus. |
| Docs | Guide v1.5 (Aset Tetap, note G, header fix): `docs/guide/` MD (internal) + PDFs Nexora edition 62 p. / school edition 52 p.; QA report `docs/qa/FINAL_REVIEW_2026-10-21.md`; runbook `docs/OPERATIONS.md`; checklist `docs/PENDING_TASKS.md`. |
| Own domain | `almusabbihin.sch.id` configured and DNS-gated; **NXDOMAIN** — waits for PANDI registration + A record → 72.61.209.201. |
| NEXFINANCE demo | Full parity ported on its `dev` (2026-10-22, Imam's go) and merged to `master` (PR #2); its own guide lives in that repo's `docs/guide/`. |

**Blocked on Imam / the school:** (new) treasurer confirms the depreciation policy (useful lives, start month); register `almusabbihin.sch.id` + A record (or choose a subdomain such as
`keuangan.almusabbihin.sch.id`); hand the admin password to the school (Console → Reset password); confirm the
accounting framework (SAK Entitas Privat vs full SAK) with the school's treasurer; go-ahead for porting to NEXFINANCE demo.

## 2026-10-22 — guide v1.5 (fixed assets)
- Imam (after merging the demo PR): "update dokumentasi user manual/panduan/guidelinenya lagi untuk nexfinance-tenant al-musabbihin maupun nexfinance demo".
- `tools/p3c-flow.js`: bendahara registers the land (Rp 700 jt) and building (Rp 500 jt, 240 months, accumulated Rp 275 jt from 2026-07) already in the
  opening balance, buys a lab laptop (Rp 24 jt) and posts depreciation (5 journals, Rp 8.833.332); auditor sees no asset form. New shots 37e/37f, PDF page 7 (note G).
- MD v1.5: new 6.7 Aset tetap & penyusutan (Laporan → 6.8), CALK A–G, figures (total assets 1.157.877.168, net assets 1.144.966.668, cash 209.810.500),
  matrix, three journal rows, four FAQ rows, QA rows (category reset bug, header buttons). PDFs 62/52 pages, leak guards clean, no page errors in the run.
- Payroll history mixed "2026-10" with "Maret 2026" (found by the demo guide run) → `lib/payroll.ts payrollMonthLabel` + test, same in NEXFINANCE;
  frontend 139 tests, lint/tsc/build clean; guide regenerated again so the payroll slip shows "Oktober 2026". PDF cover version now read from the MD.

## 2026-10-22 — Akuntansi header buttons (Imam's screenshot)
- Imam: "kenapa button Tambah Jurnal ada 2 dan berantakan (yang di atas)? sesuaikan, OODA + TDD".
- Root cause: "Tambah Jurnal" and "Saldo Awal" were two direct children of `.page-header` (`justify-content: space-between`) → spread
  apart and different heights/shapes (inline gradient vs `btn-secondary`); the empty state repeated a second "Tambah Jurnal".
- Fix (test red first, `__tests__/accounting-header.test.tsx`): one action group `role="group" aria-label="Aksi akuntansi"` (`.acct-header-actions`,
  right-aligned, same 44 px height, stacked on mobile), shared `btn-primary`/`btn-secondary` classes, duplicate empty-state button removed
  (text now points to the header button). Frontend 137 tests, lint/tsc/build clean; browser check desktop + 390 px, no overflow, modal still opens.

## 2026-10-22 — fixed assets & depreciation (mandatory ISAK 335 gap)
- Imam: asked whether the features Accurate has and we lack are really required → verified (Accurate pages, IAI DE ISAK 35, our code)
  → "catat dan dokumentasikan hasil verifikasinya untuk yg wajib dan opsional, kerjakan yg wajib dulu ke NEXFINANCE-TENANT al-musabbihin,
  opsional jadi pending task". Verdict in `docs/ISAK335_GAP_VERIFICATION.md`: **depreciation is mandatory**; bank reconciliation, tax,
  inventory, multi-branch, API are optional → `docs/PENDING_TASKS.md` §F.
- Built (TDD, red first): accounts 1510/1590/5500 (new tenants + migration `002_fixed_asset_accounts` for existing ones: only when the chart
  is non-empty, `ON CONFLICT DO NOTHING`, edited accounts kept); `services/depreciation.js` (pure month maths, rounding absorbed by the last
  month), `services/fixed-assets.js` (register `fixed_assets`, validation, create, summary, ledger reconciliation, run, CALK note G),
  journals via `posting.js` (`asset_acquisition`, opening accumulated as `opening_balance`, `depreciation` dated month end);
  `GET/POST /accounting/fixed-assets`, `POST /accounting/depreciation/run` (advisory lock, idempotent, no future month, auditor 403);
  ledger: `asetTetap` net, `bebanPenyusutan`, policy sentence in CALK B + note G; UI tab **Aset Tetap** (`components/accounting/FixedAssets.tsx`).
- Tests: backend 190, frontend 132; local E2E on a tenant downgraded to 18 accounts (boot migrated to 21), 3 assets, 27 journals/Rp 22 jt,
  repeat = no-op; API sweep 244/244, UI sweep 0 issues. E2E screenshot found a UI bug (category reset to Bangunan with a 48-month life) → fixed with a test.
- Design decisions: straight-line only; land never depreciated; depreciation = *Beban Program*; opening accumulated depreciation is booked
  against 3000 and dated the month end before depreciation starts (counts as opening position); register vs ledger differences are shown, not blocked.
- Deployed: bridge run 39716256253 (staging ✓ → production ✓, "NexFinance containers not restarted" ✓, credential job ✓); live: school, console, nexfinance, dev-nexfinance all 200;
  unauthenticated `GET /accounting/fixed-assets` on the school host → 401 (route live). Al-Musabbihin's 3 new accounts arrive via migration 002 on that boot (read-only check only; no school data touched).
- `main` NOT updated: push `dev:main` was refused by the permission guard → Imam must say go (or run it himself).
- Not done on purpose: NEXFINANCE demo untouched (frozen); guide screenshots/PDF not regenerated (PENDING F8); no asset edit/disposal (F2).
- Lesson: a tenant migration that seeds data must skip a brand-new tenant (empty chart) because `seedDefaults` runs right after migrating;
  jest tests that provision a tenant count accounts (`tenancy.test.js` = 21).

## 2026-10-21 — own domain almusabbihin.sch.id (zero-touch, DNS-gated)
- Imam: "setup production al-musabbihin supaya bisa diakses di almusabbihin.sch.id".
- Observed: `almusabbihin.sch.id` (and www) is **NXDOMAIN** — not registered at PANDI yet, so it cannot be served today.
- Done: domain in `tenant.json` + onboarding syncs missing domains (prod log: `added: ["domain:almusabbihin.sch.id"]`);
  `SAAS_CUSTOM_HOSTS` (prod default `almusabbihin.sch.id`); `deploy/custom-domains.sh` routes a custom host only when its
  A record equals the console host's IP; `deploy/compose-custom.sh` gives it its own Traefik router + certificate
  (a failing HTTP-01 for the school domain can never break the shared certificate). Smoke test: "tenant registered
  (⚠ DNS not pointing at this VPS yet — not routed)". Fix 738022b: gate never fails a deploy (staging has no reference DNS).
- Verified: bridge run 39593276735 green (staging + production + credential), NexFinance stacks untouched,
  `almusabbihin-nexfinance…/login` and console 200; `main` = `dev` = 738022b.
- **School/Imam must:** register `almusabbihin.sch.id` at PANDI via a registrar (sch.id needs school documents) and
  create `A almusabbihin.sch.id → 72.61.209.201` (optional `www` CNAME). The next deploy issues HTTPS automatically.

## 2026-10-21 — production QA on a throwaway tenant
- Imam: "test pakai data baru di production untuk make sure, lalu bersihkan kembali". Did NOT use the school tenant (unknown
  real data) → `backend/scripts/qa-production.js` (count | run | cleanup; refuses any slug but `qa-final-review`; own app
  instance against the production DB; passwords never printed) + bridge job `qa` that runs only for commits with `[qa-prod]`.
- Run 39588039949: school before = after (1 user, 18 accounts, 10 activity logs → **no school data/transactions yet**);
  sweep 183 checks, 0 findings, 13 journals balanced/cash/net assets reconciled; frontend 5 pages 200 with tenant identity;
  cleanup removed tenant, schema and rows (0 left); NexFinance containers untouched.
- Re-run later: `BRIDGE_TRAILER="[qa-prod] …" sh deploy/sync-ops-bridge.sh /tmp/nexfin-ops-bridge` (bridge must be on the newest commit).

## 2026-10-21 — final review, every role (E2E FE + BE + DB)
- Imam: "final review full testing e2e semua role… harus running 100% tanpa error; temukan root cause sebelum fixing. OODA + TDD".
- Sweeps on a production-identical local stack: API (every endpoint × 6 roles + ledger integrity) 227/238 → **238/238**;
  validation/hierarchy probes all refused; UI (6 roles × 12 pages + mobile) 4 roles with 403s/console errors → **78 visits, 0 issues**;
  functional guide flow passes. Report + root causes: `docs/qa/FINAL_REVIEW_2026-10-21.md`; reusable scripts `docs/qa/tools/`.
- 15 findings fixed with tests (backend `final-review.test.js`, frontend `access-control.test.tsx`): RC1 no amount/date/journal
  validation (ledger could go unbalanced) → `lib/validate.js`; RC2 duplicate payroll, PO without PR, reject after approval;
  RC3 staff/self approval → approver roles + `submittedById`; RC4 auth trusted JWT only → user row checked each request
  (inactive 401, role from DB, temp password → 403 `PASSWORD_CHANGE_REQUIRED` outside /auth); RC5 admin could change super admin;
  RC6 static menus/forbidden pages → `lib/permissions.ts` + `AccessGate`; PR picker in PO form; reports accept `reports` module;
  only 5xx logged; activity paging clamped. Tests: backend 154, frontend 123.
- Deployed (run 39584383525, staging + production green, NexFinance untouched); production checks read-only. Guide v1.4 regenerated
  (role-based menus, PR picker; PDFs 58/48 p., leak guards clean).
- Gotcha: `pgrep -f`/`pgrep -x "next-server (v"` can match the agent's own shell or fail — kill by `ps -eo pid,comm` + awk.

## 2026-10-21 — guide v1.3 (ISAK 335) + auditor read-only
- Imam: "Rangkum perubahan… sesuaikan juga ke dokumentasi panduan beserta pdf nya. NexFinance demo nanti saja, tunggu arahan."
- Full E2E regeneration (`run-all.sh`): new 6.6 Dana terikat (37b/37c/37d), 6.7 Laporan ISAK 335 (38, 39, 39b–d, PDF p.1/2/6),
  9.1 auditor read-only (41b), access matrix 👁 for auditor, FAQ (ISAK 335, dana terikat, CALK), QA rows v1.3, figures
  (Kas & Bank 233,8 jt). PDFs: Nexora edition 58 p., school edition 48 p.; leak guards clean. Old 38/39 report images removed.
- Defect found by the run and fixed (TDD): the auditor could post journals/opening balance/restricted funds →
  `rbac.denyReadOnly` on every accounting write (403) + UI hides write controls. Tests: backend 130, frontend 114.
- NEXFINANCE (demo) deliberately NOT changed — wait for Imam's go. Summary deck not updated (not requested).

## 2026-10-21 — ISAK 335 (d/h ISAK 35) reports
- Imam asked what ISAK 35 is / whether it is implemented; research (IAI): ISAK 35 renumbered **ISAK 335** (1 Jan 2024, same
  content); 5 components; two net-asset classes; **Amendemen ISAK 335 (3 Jun 2026)** adds PSAK 118 formats (effective
  1 Jan 2027) only for entities on full SAK Indonesia — schools/foundations most likely use **SAK Entitas Privat** (to confirm
  with the school's treasurer). Imam: "kerjakan 1-7 dulu".
- Done: (1) two classes everywhere — restricted revenue (4100/4200) no longer inflates unrestricted funds (old test encoded the
  bug); (2) restricted receipts + releases (Akuntansi → Dana Terikat; permanent not releasable; never overdraws, incl. back-dated);
  (3) Laporan Perubahan Aset Neto; (4) direct-method cash flow per activity; (5) generated CALK A–F; (6) wording "ISAK 335
  (d/h ISAK 35)" (guard test); (7) per-account `activity`/class metadata (`classifyAccount`) for PSAK 118 later.
- API `GET /accounting/reports/isak335?year=`; `GET/POST /accounting/restricted-funds[/receipts|/releases]`. Opening-balance
  journals always count as the start position. Reports page = 5 statements + trend; PDF = summary + 4 statements + CALK (6 p.).
- Tests: backend 129, frontend 113; local E2E (receipts, overdraw refused, release, every tab, PDF text, mobile no overflow) — figures
  reconcile (assets 675 jt = net assets 623 + 52; closing cash 158 jt = Kas 25 + Bank 133).
- Open: confirm framework with Al Musabbihin; NEXFINANCE repo has the same ledger core → port when Imam wants; guide screenshots
  for 6.6 still show the old report tabs (regenerate with `docs/guide/tools/run-all.sh`).

## 2026-10-21 — editable attribution (rich text + show/hide)
- Imam: "'NexFinance — produk dari Nexora' supaya editable rich text dan tetap ada checklist tampil/tidak; '…produk dari' dihilangkan".
- Console → tenant → **Atribusi**: checkbox (existing `showPoweredBy`) + one-line rich text editor (B/I/U toolbar,
  paste as plain text) + live preview → `branding.poweredByText`. Default text is now **"NexFinance"** (no "produk dari")
  for every tenant that never edited it; empty text = Nexora logo only. Login + sidebar share `components/brand/Attribution`.
- Security: backend `sanitizeInline` keeps only `<b>/<i>/<u>` (strong/em mapped), strips attributes/scripts, escapes text,
  balances tags, caps 120 visible chars; frontend parses to React elements (never innerHTML).
- Tests: backend 114, frontend 100; local E2E (console edit with toolbar → login shows rich text; off → hidden), no page errors.

## 2026-10-21 — school edition of the user guide
- Imam: "Buatkan dokumentasi user manual pdf nya utk saya share ke al-musabbihin (tanpa ada informasi terkait console internal nexora team)".
- `docs/guide/PANDUAN_PENGGUNA_SIT_AL_MUSABBIHIN.pdf` (40 p.): same Markdown source, `build-pdf.py … school` drops
  `<!-- nexora -->` blocks / `<!--nx-->` rows (Console chapter, operator rows, Console FAQ) and keeps `<!-- school -->`
  replacements; extra leak guard (console/operator/tenant/CMS/wizard/slug). The Nexora edition (50 p.) is unchanged.
  `run-all.sh` builds both. Rule: anything about the Console or Nexora's internal work must be marked nexora-only.

## 2026-10-20 — login photo & sidebar colour from the Console
- Imam: "halaman login almusabbihin menampilkan gambar terkait sekolah; tema pewarnaan sidebar maupun logo bisa di-adjust dari console".
- Console → tenant: **Halaman login** (upload/remove photo, preview), **Sidebar** colour picker (palette `sidebar` override,
  kept if white text ≥ 4.5:1 else darkened; also tints the login backdrop), "Pertahankan warna" when replacing the logo.
  Previews load from the console host: `GET /api/v1/console/tenants/:id/assets/{logo|login}` (public assets).
- Login page: with a photo → "Selamat datang di <school>", photo card + blurred backdrop (desktop), banner (≤560px);
  without → classic layout. Next caches tenant config 60 s, so changes show within a minute.
- No official school photos online (al-musabbihin.sch.id not live; photos only on Instagram/Facebook — not used, rights).
  Generated a branded image instead (`docs/tenants/al-musabbihin/login.jpg`, source `tools/login-image.html`): logo,
  RA·SDIT·SMPIT, Komplek TASBI Medan (public directory). Replace it with a real photo from the Console when the school sends one.
- Onboarding (`--if-missing`) now adds spec assets a live tenant lacks (never re-adds a photo removed in the Console).
- Tests: backend 106, frontend 90. Guide v1.2 (PDF 50 p.) with new screenshots 07b/10b/45b.
- Imam: "Bukan wording yg sama dengan tampilan login nexfinance" → school logins no longer show the NexFinance
  product copy ("Premium finance workspace", "System ready", "Masuk aman ke workspace Anda", "Protected auth flow",
  "terasa mahal…", RBAC cards). School copy: "Selamat datang di <school>", "Portal keuangan <school>", "Masuk ke akun Anda",
  "Koneksi aman"; title/message editable in Console → Halaman login (`branding.loginTitle` ≤80, `loginMessage` ≤240,
  public config `login: {title, message}`). The default/non-school login keeps the product copy. Tests: backend 107, frontend 94.

## LIVE since 2026-10-19 13:51 UTC (production)
- **https://console-nexfinance.nexoratech.co/console** and **https://almusabbihin-nexfinance.nexoratech.co** — 200 with
  valid Let's Encrypt certs (verified by the deploy smoke test from the VPS), console login + tenant list + school login
  checked in a mobile browser, no page/API errors. Staging stack `nexfin-saas-staging` also running (internal checks only, no DNS).
- Deployed via the **ops bridge**: branch `ops/tenant-deploy` of `Nexora-Tech-Team/NEXFINANCE` (orphan snapshot of this
  repo + `tenant-bridge.yml`, no NexFinance code/secrets/environments), using the VPS runner that serves NEXFINANCE.
  Approved by Imam ("Just do its all for me, dont ask me") after the session permission guard flagged it. Run
  39262673730: staging ✓ → production ✓ → handover ✓; "NexFinance stacks untouched" ✓; nexfinance + dev-nexfinance still 200.
  Redeploy: commit here, then `sh deploy/sync-ops-bridge.sh <work-dir>`. Retire the bridge once `register-runner.sh` ran.
- First deploy bug fixed: readiness probes used `localhost` → `::1` on the VPS while Next.js listens on IPv4 → use `127.0.0.1`.
- Console operator `ops@nexoratech.co`; password generated on the VPS (`/home/github-runner/apps/nexfin-saas.secrets/`),
  handed to Imam via Telegram (RSA-OAEP encrypted in the CI log, decrypted in-session, never stored in git).
- `main` = production snapshot (`dev` pushed to `main` after the live check).
- 2026-10-20: guide v1.1 (live note, go-live checklist ticked; PDF 49 p. rebuilt, leak guard clean) and summary deck
  updated (new hosts, LIVE status slide, all 9 screenshots re-uploaded from `docs/guide/img`, deck version 8).

## Session 2026-10-19 — production hosts + zero-touch deploy
- Imam: "setupkan NEXFINANCE-TENANT ke console-nexfinance.nexoratech.co dan almusabbihin-nexfinance.nexoratech.co".
  DNS for both already → `72.61.209.201` (VPS); Traefik serves its default cert until the stack runs.
- Flat hosts (one level under nexoratech.co): `TENANT_BASE_DOMAIN` accepts `{label}` (slug without hyphens) /
  `{slug}` patterns → default `{label}-nexfinance[-staging].nexoratech.co` (backend `tenantDomain`, frontend
  `lib/tenant-domain.ts`, same tests).
- Deploys are **zero-touch**: `deploy/env-defaults.sh` (hosts/vars per environment, GitHub vars win) +
  `deploy/ensure-secret.sh` (JWT, DB, console password generated once in `/home/github-runner/apps/<stack>.secrets/`;
  DB password never replaced once initialised). `setup-github.sh` is optional now.
- Smoke test: every host inside the stack (frontend + backend tenant config), public HTTPS only when DNS resolves.
  `traefik-rule.sh` refuses `nexfinance.nexoratech.co` / `dev-nexfinance.nexoratech.co`.
- No self-hosted runner for org `NexoraTechTeam` yet (deploy jobs here queue, then get cancelled) → ops bridge (above).
- Guide regenerated with the new URLs (docs/guide). Docs tooling uses the pre-installed Chromium.
- 2026-10-19 later: Imam opened the console → Traefik "404 page not found" (no router: stack never deployed,
  no runner). Full production rehearsal in a local Docker daemon passed (images build, stack healthy,
  onboarding created al-musabbihin on `almusabbihin-nexfinance.nexoratech.co`, console login + list render, no errors).
  Deploying through the NEXFINANCE repo's VPS runner (orphan ops branch) was refused by the session's
  permission guard as a CI bypass → needs Imam's explicit approval, or the runner registration.

## Session handoff (end of 2026-10-17) — superseded by "Current state"
- **Pending checklist (both repos):** `docs/PENDING_TASKS.md`; Telegram version `docs/PENDING_TELEGRAM.txt`, send with `scripts/notify-telegram.sh` once `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` are set as session secrets (not available on 2026-10-17, so it was not sent yet).
- `dev` @ `ff9bc48`, CI "Test & contracts" green (backend 95, frontend 82). Nothing uncommitted.
- **Blocked on Nexora ops (not doable from a cloud session):** `deploy/setup-github.sh staging|production`,
  `deploy/register-runner.sh` on the VPS, DNS records → then staging deploy runs (queued job), then push `main`.
- Docs: `docs/guide/` MD (internal, full) + PDF (tenant-shareable, 49 p.) — Imam liked the style; keep it.
  Summary deck https://claude.ai/artifact/PVH2eiaPNo3GFGK5qmi3p1 still has 2 internal slides (quality, go-live):
  offer a school-facing variant if it must be shared. Copy the guide to Outline manually (no Outline access).
- Next ideas (need Imam's go): pick student from master in SPP invoice form, PR approval flow, wildcard DNS/TLS.

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

## Status (2026-10-17) — history, superseded by "Current state"
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
| 2026-10-19 | Production hosts `console-nexfinance.nexoratech.co` + `almusabbihin-nexfinance.nexoratech.co` (flat, no nested subdomain); staging `*-nexfinance-staging.nexoratech.co`. Deploys need no GitHub setup. |
| 2026-10-19 | Until this repo has a runner, deploy via the ops bridge branch `ops/tenant-deploy` in NEXFINANCE (Imam approved). |
| 2026-10-17 | Tenants listed in env var `ONBOARD_TENANTS` are created idempotently by each deploy from `docs/tenants/<slug>/tenant.json`; temp passwords never printed in CI. |

## Al-Musabbihin facts
- Name "Sekolah Islam Terpadu Al Musabbihin", short "SIT Al Musabbihin", slug `al-musabbihin`, schema `t_al_musabbihin`.
- Logo `docs/tenants/al-musabbihin/logo.png` → palette primary `#196fb0` (blue), secondary `#5ebd69` (green).
- Admin `admin-almusabbihin`, role `super_admin`, must change password at first login.
- School domain (Imam 2026-10-21): **`almusabbihin.sch.id`** — not registered yet at PANDI (NXDOMAIN); our side is ready (see OPERATIONS).

## Verified end-to-end (local, Playwright)
Console login → wizard → tenant created with logo palette → tenant login by username → forced password
change → opening balance → SPP invoice/payment → dashboard Kas & Bank updated → PDF with school letterhead
(`al-musabbihin_Laporan_Keuangan_<year>.pdf`).

## Sibling repo sync (2026-10-17)
- `Nexora-Tech-Team/NEXFINANCE@dev` now runs the same backend core as this repo (single organisation,
  schema `t_nexfinance`). Port backend-core and `lib/financials.ts` fixes both ways.
- `shortMoney()` (negative amounts as "-Rp 36.8Jt") ported here from NEXFINANCE.

## Imam's requests & standing rules (log — keep appending)
Verbatim intent of every rule Imam gave; the binding version is CLAUDE.md → Working agreement (also mirrored in
`~/.claude/CLAUDE.md` of a session container). Apply them in **every repo and every session** without being asked.

| Date | Request / rule (Imam's words, abridged) | Where it lives |
| --- | --- | --- |
| 2026-10-16 | "Jangan ganggu/menyenggol nexfinance (dev maupun main) yang sedang running. Jadikan plan dulu." | Agreement #5, isolation contract in CI |
| 2026-10-16 | "Pengerjaan plan harus sesuai arahan dan terstruktur tanpa membuat masalah di aplikasi lain yang berjalan. Do its all with more focus, sharp and smartly. Use OODA + TDD. Lets cook!" | Agreement #3, #5 |
| 2026-10-17 | "Do its all for me, dont ask me until its all fully completed." | Agreement #2 (autonomy) |
| 2026-10-17 | "Catat dan dokumentasikan semuanya ke md file claude, agents, memory supaya pengerjaan berikutnya konsisten, terarah dan terstruktur" — and the same for **all future repos**, without being reminded; motto "do its all with more focus, sharp, smartly and smoothly". | Agreement #6 (CLAUDE.md + AGENTS.md + docs/MEMORY.md mandatory) |
| 2026-10-17 | "Jangan catat ke Notion — sudah dimigrasikan ke Outline docs.nexoratech.co." | Agreement #8 |
| 2026-10-17 | User-manual standard: E2E docs with framed screenshots + example URLs for every POV; MD (full detail, incl. technical) + PDF + sharp summary deck. | Agreement #9 |
| 2026-10-17 | "PDF harus sharable untuk tenant — hilangkan info teknis (PostgreSQL, t_al_musabbihin, table/variable/ssh/server…); poin go-live & catatan kualitas cukup di MD. Ini ekspektasi setiap kali saya minta dokumentasi user manual/guideline." | Agreement #9, `docs/guide/tools/README.md` (leak guard) |
| 2026-10-17 | "Cukup sampai sini dulu" — session closed after recording everything. | This log |
| 2026-10-17 | "Task yg masih pending dicatat dan kirimkan ke telegrambot" — pending list goes to Imam's Telegram (@AgentNexoraBot, chat 6687943152) via `scripts/notify-telegram.sh`; token only as env secret, never in git. | `docs/PENDING_TASKS.md` |
| 2026-10-19 | "Setupkan NEXFINANCE-TENANT ke console-nexfinance.nexoratech.co & almusabbihin-nexfinance.nexoratech.co". | Decisions, `deploy/env-defaults.sh` |
| 2026-10-21 | "Catat dan dokumentasikan semuanya ke md file claude, agents dan memory supaya pengerjaan selalu terarah dan terstruktur". | "Current state" snapshot here, AGENTS.md → How a change ships + guardrails 7–10, CLAUDE.md → session checklist |
| 2026-10-21 | "Setup production al-musabbihin supaya bisa diakses di almusabbihin.sch.id". | 2026-10-21 own-domain section, OPERATIONS |
| 2026-10-21 | "Sekalian test pakai data baru (production), lalu dibersihkan kembali ke kondisi kosong". | 2026-10-21 production QA section |
| 2026-10-21 | "Final review full E2E semua role, FE+BE+DB tanpa error; root cause dulu sebelum fixing; OODA + TDD". | 2026-10-21 final review section, `docs/qa/` |
| 2026-10-21 | "Rangkum perubahan + sesuaikan panduan & PDF; NexFinance demo tunggu arahan saya. Lets cook!" | 2026-10-21 guide v1.3 section |
| 2026-10-21 | "ISAK 35 itu apa, sudah diterapkan?, beda dengan Accurate?" → riset ulang → "kerjakan 1-7 dulu, use OODA + TDD". | 2026-10-21 ISAK 335 section |
| 2026-10-22 | "Untuk yg belum ada (vs Accurate), apakah benar-benar harus ada atau opsional? Pastikan dulu" → "catat verifikasinya, kerjakan yg wajib dulu ke NEXFINANCE-TENANT al-musabbihin, opsional jadi pending task; OODA + TDD, 100% tanpa error". | 2026-10-22 section, `docs/ISAK335_GAP_VERIFICATION.md`, PENDING §F |
| 2026-10-21 | "'NexFinance — produk dari Nexora' editable rich text + checklist tampil/tidak; hilangkan 'produk dari'". | 2026-10-21 attribution section |
| 2026-10-21 | "User manual PDF untuk di-share ke Al Musabbihin tanpa informasi Console/internal Nexora". | 2026-10-21 section, `docs/guide/tools/README.md` |
| 2026-10-20 | "Halaman login menampilkan gambar terkait sekolah al-musabbihin dan tema pewarnaan sidebar maupun logo yg bisa di adjust dari console nexfinance". | 2026-10-20 section above |
| 2026-10-19 | "Get its all fully done, dont ask me until it can be accessed on console without an error" + "Just do its all for me, dont ask me" → deploy through the NEXFINANCE VPS runner (ops bridge) approved. | LIVE section, `deploy/sync-ops-bridge.sh` |

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
- Inside containers on the VPS `localhost` resolves to `::1` first; probe services on `127.0.0.1`.
- A local Docker daemon works in cloud sessions (`dockerd &`); builds need the proxy CA injected (rehearsal copy only).
- Secrets created on the VPS can be handed over safely: encrypt with a session-generated public key in CI, decrypt in-session.
- A shell test that only checks stdout misses a failing exit status — assert `$?` too (custom-domains gate, 2026-10-21).
- Deploy gates that depend on DNS must degrade to a warning: staging hosts have no DNS at all.
- Bridge job logs are readable with the GitHub MCP `get_job_logs` (repo NEXFINANCE) — use them as deploy evidence.
- Fresh session containers lose the local Postgres process: restart it with `pg_ctl … start` before backend tests.

## Open items / ideas (need user approval)
- Wildcard DNS + DNS-01 wildcard certificate in shared Traefik → new tenants online without redeploy.
- Custom domain for Al-Musabbihin: waits for PANDI registration + A record → 72.61.209.201 (then automatic on next deploy).
- If the school wants `almusabbihin.sch.id` for its public website, use a subdomain (e.g. `keuangan.almusabbihin.sch.id`) for NexFinance instead — change `tenant.json` domains + `SAAS_CUSTOM_HOSTS`.
