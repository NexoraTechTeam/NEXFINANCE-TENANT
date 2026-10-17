# Pending tasks — NexFinance & NexFinance Tenant

Checklist of everything still open (as of 17 Oktober 2026). Covers both repos. Tick items here (and in
`docs/MEMORY.md`) when done. A short version for Telegram lives in `docs/PENDING_TELEGRAM.txt`
(send it with `scripts/notify-telegram.sh`).

## A. Go-live NexFinance Tenant (SIT Al Musabbihin) — tim Nexora
- [ ] **1.** On a laptop with `gh auth login`: `sh deploy/setup-github.sh staging ops@nexoratech.co`
      (creates the environment, secrets and variables; save the console password it prints once).
- [ ] **2.** On the VPS, as the runner user: `RUNNER_TOKEN=<token> sh deploy/register-runner.sh`
      (token: repo Settings → Actions → Runners → New self-hosted runner).
- [ ] **3.** DNS A records → VPS IP: `console-staging.nexfinance.nexoratech.co`,
      `al-musabbihin.staging.nexfinance.nexoratech.co` (production later: `console.` and `al-musabbihin.`).
- [ ] **4.** Wait for the staging deploy to turn green, then test the flow in the guide (chapter 3).
- [ ] **5.** `sh deploy/setup-github.sh production ops@nexoratech.co` + production DNS → ask Claude to push `dev` → `main`.
- [ ] **6.** Console → Al Musabbihin → **Reset password** `admin-almusabbihin` → send it to the school over a secure channel.
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
