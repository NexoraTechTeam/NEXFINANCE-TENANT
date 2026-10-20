# NexFinance SaaS — operations runbook

## Environments

| | Staging | Production |
| --- | --- | --- |
| Branch | `dev` | `main` |
| Workflow | `deploy-saas-staging.yml` | `deploy-saas.yml` |
| Compose project / containers | `nexfin-saas-staging-*` | `nexfin-saas-*` |
| App dir on VPS | `/home/github-runner/apps/nexfin-saas-staging` | `/home/github-runner/apps/nexfin-saas` |
| GitHub environment | `staging` | `production` |

| Hosts (defaults) | `console-nexfinance-staging.nexoratech.co`, `almusabbihin-nexfinance-staging.nexoratech.co` | `console-nexfinance.nexoratech.co`, `almusabbihin-nexfinance.nexoratech.co` |
| Secrets on VPS | `/home/github-runner/apps/nexfin-saas-staging.secrets/` | `/home/github-runner/apps/nexfin-saas.secrets/` |

### Zero-touch deploys (since 2026-10-19)
Deploys need **no GitHub setup**: `deploy/env-defaults.sh` provides the hosts/variables per environment and
`deploy/ensure-secret.sh` generates `jwt_secret`, `db_password` and `console_admin_password` once on the VPS
(mode 600, outside the rsync'd app dir) and reuses them. GitHub environment variables/secrets, when set, win —
except the DB password, which never changes once Postgres was initialised with it.

**Only one-time operator step — register the runner** (on the VPS, as the user in the docker group, `github-runner`):
```bash
# token: GitHub → NexoraTechTeam/NEXFINANCE-TENANT → Settings → Actions → Runners → New self-hosted runner
curl -fsSL https://raw.githubusercontent.com/NexoraTechTeam/NEXFINANCE-TENANT/dev/deploy/register-runner.sh -o /tmp/register-runner.sh
RUNNER_TOKEN=<token> sh /tmp/register-runner.sh
```
(If the repo is private, copy `deploy/register-runner.sh` to the VPS instead of curl.) Own directory and service;
existing runners (NexFinance) untouched. Then re-run the queued/cancelled deploy (Actions → Re-run) or push.

**First console login:** `ops@nexoratech.co` + the password in `…/nexfin-saas.secrets/console_admin_password`
(`sudo cat` it on the VPS). It only seeds the first operator; the Console has no change-password screen yet,
so treat that file as the operator credential and keep it private.

DNS: production hosts already point to the VPS (2026-10-19). Staging hosts are optional — without DNS the
staging deploy still verifies every host inside the stack and skips the public HTTPS check.

### Interim deploy path — ops bridge (since 2026-10-19)
Until this repo has its own runner, deploys run through the VPS runner of `Nexora-Tech-Team/NEXFINANCE`
on its orphan branch **`ops/tenant-deploy`** (approved by Imam: "Just do its all for me"). The branch holds a
snapshot of this repo plus `.github/workflows/tenant-bridge.yml`: staging → production → encrypted console
credential. It has no NexFinance code/workflows, passes no repository secrets, and every deploy job verifies the
NexFinance containers were not restarted.

Redeploy after changes here (commit first): `sh deploy/sync-ops-bridge.sh /tmp/nexfin-ops-bridge` — replaces the
snapshot with this repo's HEAD, keeps the bridge workflow + handover key, runs the isolation contract and pushes.
Once `deploy/register-runner.sh` has run, delete the branch `ops/tenant-deploy` and use `dev`/`main` here again.

### Optional — manage settings in GitHub
`sh deploy/setup-github.sh staging|production ops@nexoratech.co` (repo admin, `gh auth login`) creates the
environment, JWT secret, console credentials and the variables below.

- **Variables:** `CONSOLE_HOSTS`, `TENANT_BASE_DOMAIN` (parent domain → `<slug>.<base>`, or a pattern with
  `{label}` = slug without hyphens / `{slug}`; default `{label}-nexfinance[-staging].nexoratech.co`), `SAAS_HOSTS`
  (every host Traefik routes, comma-separated), `ONBOARD_TENANTS` (default `al-musabbihin`), `DEMO_TENANT_HOSTS`.
- **Secrets:** `SAAS_JWT_SECRET`, `SAAS_CONSOLE_ADMIN_EMAIL`, `SAAS_CONSOLE_ADMIN_PASSWORD` (`SAAS_DB_PASSWORD` only
  before the first deploy).
- `deploy/traefik-rule.sh` refuses the NexFinance product hosts (`nexfinance.nexoratech.co`, `dev-…`).

With `ONBOARD_TENANTS` set, every deploy creates the listed tenants from `docs/tenants/<slug>/tenant.json`
if they do not exist yet (logo → palette, admin user). The temporary admin password is never printed in CI:
issue it from Console → tenant → **Reset password**.

## Onboarding a school (example: SIT Al Musabbihin)

1. DNS: `almusabbihin-nexfinance.nexoratech.co` → VPS (pattern `<slug without hyphens>-nexfinance.nexoratech.co`).
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
- Edit identity / school info (used on PDF letterhead), logo (optionally keeping the colours), theme colours incl.
  **sidebar** (also tints the login page; darkened automatically until white menu text is AA-readable), Nexora attribution.
- **Login page photo** (Halaman login): JPG/PNG/WEBP ≤ 8 MB → stored as a 1920px JPEG (`tenant_assets.kind = 'login'`),
  served at `/api/v1/tenant/login-image`; remove to get the classic layout back. A `loginImage` in
  `docs/tenants/<slug>/tenant.json` is added by the next deploy only if the tenant has none and it was never removed.
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
