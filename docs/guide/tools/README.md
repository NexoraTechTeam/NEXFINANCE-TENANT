# Regenerating the E2E guide

`run-all.sh` rebuilds `docs/guide` (screenshots, framed images, PDF) from a clean database by driving the real
app through every role (operator → super admin → bendahara → staf → kabag → auditor). Run it after UI changes
so the guide never drifts from the product.

Prerequisites (local): Postgres on `127.0.0.1:55432` (see AGENTS.md), `npm ci` in `backend/` and `frontend-next/`,
the frontend dev server on port 3060 (`BACKEND_URL=http://127.0.0.1:5080 CONSOLE_HOSTS=console-nexfinance.nexoratech.co npx next dev -p 3060`),
`npm i playwright-core` in this folder, Python 3 with `pillow` + `markdown`, and `pdftoppm`/`pdfunite` (poppler).

```bash
SP=/tmp/nexfin-docs sh docs/guide/tools/run-all.sh
```

Notes
- Browser hostnames are the production ones (`*.nexoratech.co`) mapped to localhost, so every screenshot shows the real URL.
- Do not use port 5060/5061 for the backend: Node's `fetch` rejects them (SIP "bad ports"), which silently disables SSR tenant theming.
- Temporary passwords are blurred in screenshots and never written to the repo.
- The guide text (`PANDUAN_E2E_AL_MUSABBIHIN.md`) is hand-written: update figures there when the scenario changes.

## Two audiences from one source
- `PANDUAN_E2E_AL_MUSABBIHIN.md` is the **full internal** guide (Nexora): it keeps technical notes, the go-live
  checklist and the QA findings. Anything Nexora-only goes between `<!-- internal -->` and `<!-- /internal -->`
  (a whole chapter can be wrapped, heading included).
- `PANDUAN_E2E_AL_MUSABBIHIN.pdf` is the **tenant-shareable** guide. `build-pdf.py` strips internal blocks,
  renumbers chapters, and **fails** if the cover/TOC/body still contains a technical term (PostgreSQL, schema,
  `t_<slug>`, env variables, secrets, deploy, server/VPS/SSH, API paths, repo, staging, …). Fix the wording or
  move it into an internal block — never weaken the list.
- Double-check the final file: `pdftotext docs/guide/PANDUAN_E2E_AL_MUSABBIHIN.pdf - | grep -iE 'postgre|schema|deploy|server'`
  must print nothing.
