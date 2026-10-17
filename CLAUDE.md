# CLAUDE.md

@AGENTS.md
@docs/MEMORY.md

## Working agreement (Imam — applies to EVERY repository, every session)
Standing instruction from Imam (2026-10-17), so it never has to be repeated:
"do its all with more focus, sharp, smartly and smoothly".

1. **Language:** reply in Bahasa Indonesia; code, comments and commits in English.
2. **Autonomy:** finish the whole task before reporting; ask only when truly blocked or the decision is
   genuinely Imam's. Do not stop at a plan when execution was requested.
3. **OODA + TDD always:** observe the real state first → orient → decide the smallest sound change →
   failing test first → implement → lint + typecheck + tests + build (+ E2E for UI/API) green before any push.
4. **Delivery:** small conventional commits; push to the branch Imam names (usually `dev`); production
   (`main`/`master`) only after the dev/staging deploy is verified live.
5. **Never disrupt running apps:** other stacks on the shared VPS, other repos and branches stay untouched;
   enforce with isolation checks in CI.
6. **Project memory files — mandatory in every repo:** `CLAUDE.md` (imports `AGENTS.md` + `docs/MEMORY.md`
   and contains this agreement), `AGENTS.md` (architecture, commands, method, guardrails) and
   `docs/MEMORY.md` (status, decisions, lessons, open items). Create them at the start if missing; update
   `docs/MEMORY.md` and commit it at the end of every session.
7. **Reporting:** concise, with evidence (test counts, CI run, live check) and a plain list of what is
   blocked and what Imam must do.
8. **Docs location:** team documentation lives in Outline (`docs.nexoratech.co`); never write to Notion.
9. **User manual / guideline documentation — standard deliverable whenever Imam asks for docs** (reference
   implementation: NEXFINANCE-TENANT `docs/guide/` + `docs/guide/tools/`):
   - Drive the real app end-to-end per role/POV on a clean database with an example tenant; every screenshot
     framed with a browser bar showing the real production URL; secrets/temporary passwords blurred; figures
     come from that run. Fix every defect the run reveals (TDD) before publishing.
   - **Markdown = full internal version**: everything incl. technical details, go-live checklist and QA
     findings; technical parts sit in `<!-- internal -->…<!-- /internal -->` blocks / internal-only chapters.
   - **PDF = shareable with the tenant/customer**: cover with logos, TOC, header/footer with page numbers,
     framed screenshots, per-POV steps, URL table, access matrix, FAQ — and **no technical information**
     (database/schema/table names, env variables, secrets, SSH/servers/VPS, deploy/CI, API paths, repo).
     Internal blocks are stripped, chapters renumbered, and the build fails on any leaked term.
   - A sharp summary slide deck (≤15 slides, Slides artifact) when a deck is requested.
   - Keep the generator scripts in the repo so the docs are regenerated after UI changes.

## Claude Code specifics
- The user communicates in Bahasa Indonesia; answer in Indonesian, keep code/commits in English.
- Use OODA + TDD for every change (see AGENTS.md → Working method) and report verification evidence.
- Before ending a session: update `docs/MEMORY.md` (status, decisions, open items) and commit it.
- GitHub access from cloud sessions is limited to repository-scoped MCP tools: environments, secrets,
  runners and DNS cannot be changed from a session — use `deploy/setup-github.sh` and
  `deploy/register-runner.sh` instructions for the operator instead.
