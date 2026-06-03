# NEXFINANCE — Deployment Setup

## Overview

Dokumentasi setup CI/CD NEXFINANCE dari clone repo hingga auto-deploy ke VPS production.

---

## 1. Clone Repository

```bash
git clone git@github.com:Nexora-Tech-Team/NEXFINANCE.git
```

Repo di-clone ke: `/Users/cbqaglobal/Documents/New project/NEXONE-FINANCE`

---

## 2. SSH Key untuk Deploy

Generate SSH key khusus untuk deployment:

```bash
ssh-keygen -t ed25519 -C "nexfinance-deploy" -f ~/.ssh/nexfinance_deploy -N ""
```

| File | Keterangan |
|---|---|
| `~/.ssh/nexfinance_deploy` | Private key → disimpan di GitHub Secret |
| `~/.ssh/nexfinance_deploy.pub` | Public key → dipasang di VPS |

### Pasang Public Key di VPS

```bash
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGpmBk86YIKaD/zKEaLcE6UclQsej4+EfsXYwj0bR3kY nexfinance-deploy" >> /root/.ssh/authorized_keys
```

---

## 3. GitHub Repository Secrets

Buka: `https://github.com/Nexora-Tech-Team/NEXFINANCE/settings/secrets/actions`

| Secret | Value |
|---|---|
| `VPS_HOST` | IP atau domain VPS |
| `VPS_USER` | `root` |
| `VPS_PORT` | `22` (atau port SSH kustom) |
| `VPS_SSH_KEY` | Isi file `~/.ssh/nexfinance_deploy` (private key) |

---

## 4. GitHub Actions Workflow

File: `.github/workflows/deploy.yml`

Trigger: setiap push ke branch `master`

### Stage 1 — Run Tests
- Install dependencies backend (Node.js 20)
- Run backend tests
- Install dependencies frontend
- Lint frontend (Next.js)

### Stage 2 — Build & Deploy to VPS
1. Setup SSH key dari secret
2. Rsync semua file ke VPS (replace semua, kecuali `.git`, `node_modules`, `.next`)
3. Build Docker images
4. Restart containers via `docker compose -f docker-compose.prod.yml up -d`
5. Health check backend (`/health`) dan frontend
6. Smoke test live URL

### App Path di VPS
```
/root/nexora-node/apps/nexfinance
```

### URL Production
```
https://nexfinance.nexoratech.co
```

---

## 5. Stack Production

| Komponen | Teknologi |
|---|---|
| Backend | Node.js (Express) — port 5000 |
| Frontend | Next.js — port 3000 |
| Reverse Proxy | Traefik (network: `web`) |
| SSL | Let's Encrypt via Traefik certresolver |
| Container | Docker Compose |

---

## 6. Remote Git (lokal)

Remote diset ke SSH agar tidak butuh username/password:

```bash
git remote set-url origin git@github.com:Nexora-Tech-Team/NEXFINANCE.git
```

---

## 7. Claude Code CLI

Terinstall di Mac untuk keperluan development:

```bash
npm install -g @anthropic-ai/claude-code
# versi: 2.1.161
```

Jalankan dengan: `claude`
