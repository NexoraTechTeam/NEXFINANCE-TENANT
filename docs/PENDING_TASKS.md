# Pending tasks — NexFinance & NexFinance Tenant

Checklist of everything still open (updated 21 Oktober 2026). Covers both repos. Tick items here (and in
`docs/MEMORY.md`) when done. A short version for Telegram lives in `docs/PENDING_TELEGRAM.txt`
(send it with `scripts/notify-telegram.sh`).## A. NexFinance Tenant (SIT Al Musabbihin) — LIVE since 19 Oktober 2026
Console https://console-nexfinance.nexoratech.co/console · school https://almusabbihin-nexfinance.nexoratech.co
- [x] **1–5.** Hosts, DNS, staging + production deploy, TLS (deployed via the ops bridge, see `docs/OPERATIONS.md`).
- [ ] **6.** Imam: Console login (credentials sent via Telegram) → Al Musabbihin → **Reset password** `admin-almusabbihin`
      → send it to the school over a secure channel.
- [ ] **7.** Optional: register a runner for this repo (`deploy/register-runner.sh`) and delete the bridge branch
      `ops/tenant-deploy` in NEXFINANCE. Until then, redeploy with `sh deploy/sync-ops-bridge.sh <work-dir>`.
- [ ] **7b.** Own domain `almusabbihin.sch.id`: Nexora side done (DNS-gated, own certificate). School/Imam: register it at
      PANDI via a registrar + `A almusabbihin.sch.id → 72.61.209.201`; next deploy enables HTTPS. Or pick a subdomain
      (e.g. `keuangan.almusabbihin.sch.id`) if the root domain is for the school website.
- [ ] **7d.** Confirm with the school's treasurer which framework applies (SAK Entitas Privat vs full SAK → PSAK 118 from 2027).
- [ ] **7c.** Console has no change-password screen yet (operator password = generated one).

## B. NexFinance (demo product)
- [ ] **8.** Decide/approve merging `dev` → `master` (production gets its own database; all users log in again once).
- [ ] **8b.** Go-ahead to port the tenant work (ISAK 335, RBAC/validation fixes) to the demo — frozen until Imam says so.

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
