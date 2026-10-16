# NexFinance SaaS — operations runbook

## Environments

| | Staging | Production |
| --- | --- | --- |
| Branch | `dev` | `main` |
| Workflow | `deploy-saas-staging.yml` | `deploy-saas.yml` |
| Compose project / containers | `nexfin-saas-staging-*` | `nexfin-saas-*` |
| App dir on VPS | `/home/github-runner/apps/nexfin-saas-staging` | `/home/github-runner/apps/nexfin-saas` |
| GitHub environment | `staging` | `production` |

### One-time setup (per GitHub environment)
- **Secrets:** `SAAS_JWT_SECRET`, `SAAS_DB_PASSWORD`, `SAAS_CONSOLE_ADMIN_EMAIL`, `SAAS_CONSOLE_ADMIN_PASSWORD`.
- **Variables:**
  - `CONSOLE_HOSTS` — e.g. `console.nexfinance.nexoratech.co` (staging: `console-staging.nexfinance.nexoratech.co`)
  - `TENANT_BASE_DOMAIN` — e.g. `nexfinance.nexoratech.co` (staging: `staging.nexfinance.nexoratech.co`)
  - `SAAS_HOSTS` — every host Traefik should route: console + each school, comma-separated
  - `DEMO_TENANT_HOSTS` — optional sales demo tenant host(s)
- **Runner:** the self-hosted VPS runner must be available to this repository (org-level runner, or register it for the repo).
- **DNS:** A records (or a wildcard `*.nexfinance.nexoratech.co`) pointing to the VPS.

## Onboarding a school (example: SIT Al Musabbihin)

1. DNS: `al-musabbihin.nexfinance.nexoratech.co` → VPS.
2. Add the host to the environment variable `SAAS_HOSTS` and re-run the deploy workflow
   (registers the Traefik route + TLS certificate; the app itself needs no change).
3. Console → **Tenant baru**:
   - Identitas: name `Sekolah Islam Terpadu Al Musabbihin`, slug `al-musabbihin`, short name `SIT Al Musabbihin`.
   - Logo & warna: upload `docs/tenants/al-musabbihin/logo.png` → palette is generated (primary `#196fb0`, secondary `#5ebd69`), adjust if needed.
   - Admin: username `admin-almusabbihin` (role `super_admin`).
4. Copy the one-time temporary password and send it to the school through a secure channel.
   The admin must set a new password at first login.
5. The school records its **saldo awal** (opening balance) in Akuntansi, then adds students/employees.

Scripted alternative (same service as the console):
```bash
docker exec -it nexfin-saas-backend node scripts/onboard-tenant.js /app/tenant.json
```

### Custom domain later (e.g. `al-musabbihin.sch.id`)
1. School sets an A record to the VPS.
2. Console → tenant → **Domain** → add `al-musabbihin.sch.id`.
3. Add it to `SAAS_HOSTS` and re-run the deploy workflow.

### Common operator tasks (Console)
- Edit identity / school info (used on PDF letterhead), logo, theme colors, Nexora attribution.
- Suspend / re-activate a school (takes effect immediately).
- Reset an admin password (new temporary password, forced change).
- Audit trail of every console action: `GET /api/v1/console/audit`.

## Backups & restore

The `nexfin-saas-backup` container dumps **each schema separately** every 24h into the
`backups` volume (retention `BACKUP_RETENTION_DAYS`, default 14).

Restore a single school (example):
```bash
docker exec -i nexfin-saas-db pg_restore -U nexfinance -d nexfinance --clean --if-exists \
  --schema=t_al_musabbihin < /path/to/t_al_musabbihin.dump
```

## Isolation from NexFinance

This stack shares the VPS, Traefik and runner with the running NexFinance stacks
(`nexfinance-*`, `nexfinance-dev-*`) but never touches them:
- unique compose project (`-p nexfin-saas[-staging]`), container, network, volume and Traefik router names;
- its own app directories; frontend proxies only to `nexfin-saas-*-backend`;
- `deploy/check-isolation.sh` runs in CI and fails on any reference to NexFinance names, hosts or paths;
- every deploy records the NexFinance containers' start times before and after and fails if they changed.
