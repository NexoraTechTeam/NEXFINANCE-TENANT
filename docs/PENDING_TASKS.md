# Pending tasks — NexFinance & NexFinance Tenant

Checklist of everything still open (updated 19 Oktober 2026). Covers both repos. Tick items here (and in
`docs/MEMORY.md`) when done. A short version for Telegram lives in `docs/PENDING_TELEGRAM.txt`
(send it with `scripts/notify-telegram.sh`).## A. Go-live NexFinance Tenant (SIT Al Musabbihin) — tim Nexora
Production hosts (decided 2026-10-19): **`console-nexfinance.nexoratech.co`** (Console) and
**`almusabbihin-nexfinance.nexoratech.co`** (school). Deploys are now zero-touch (hosts + secrets automatic).
- [x] **1.** ~~setup-github.sh~~ — no longer needed (optional, see `docs/OPERATIONS.md`).
- [ ] **2.** **The only manual step:** on the VPS, as `github-runner`: `RUNNER_TOKEN=<token> sh deploy/register-runner.sh`
      (token: repo Settings → Actions → Runners → New self-hosted runner). No runner serves org `NexoraTechTeam` yet,
      so every deploy job waits and is cancelled.
- [x] **3.** DNS A records for both production hosts → `72.61.209.201` (verified 2026-10-19).
      Staging hosts (`console-nexfinance-staging…`, `almusabbihin-nexfinance-staging…`) optional.
- [ ] **4.** After the runner is online: re-run the latest "Deploy NexFinance SaaS (staging)" run → green.
- [ ] **5.** Ask Claude to push `dev` → `main` → production deploy creates the Al Musabbihin tenant and TLS certs.
- [ ] **6.** Console login `ops@nexoratech.co` + password in `/home/github-runner/apps/nexfin-saas.secrets/console_admin_password`
      → Al Musabbihin → **Reset password** `admin-almusabbihin` → send it to the school over a secure channel.
- [ ] **7.** Later: custom domain `al-musabbihin.sch.id` (school A record + Console → Domain + `SAAS_HOSTS`).



## B. NexFinance (demo product)
- [ ] **8.** Decide/approve merging `dev` → `master` (production gets its own database; all users log in again once).

## C. Documents
- [ ] **9.** Share the summary slide deck from its Share menu (https://claude.ai/artifact/PVH2eiaPNo3GFGK5qmi3p1),
      or ask for a school-facing version without the 2 internal slides.
- [ ] **10.** Copy the user guide to Outline (docs.nexoratech.co): `docs/guide/PANDUAN_E2E_AL_MUSABBIHIN.md`
      (internal) and the `.pdf` (shareable with the school).

## D. Ideas waiting for Imam's decision
- [ ] **11.** SPP invoice: pick the student from master data instead of typing ID/name.
- [ ] **12.** Approval flow for purchase requests (PR).
- [ ] **13.** Wildcard DNS + TLS so new schools go online without a redeploy (touches shared Traefik — needs approval).
- [ ] **14.** Richer demo data for NexFinance sales demos (current demo YTD surplus is negative).
- [ ] **15.** Remove the legacy CRA `frontend/` and old root Docker files in NEXFINANCE after confirming nobody uses them.

## E. Telegram reminder (this list)
- [x] **16.** Sent to Imam's Telegram via @AgentNexoraBot on 2026-10-17 (`scripts/notify-telegram.sh`).
      Re-send after changes: `TELEGRAM_BOT_TOKEN` (env/secret, never in git) + `TELEGRAM_CHAT_ID=6687943152`,
      then `sh scripts/notify-telegram.sh docs/PENDING_TELEGRAM.txt`.
