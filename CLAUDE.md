# CLAUDE.md

@AGENTS.md
@docs/MEMORY.md

## Claude Code specifics
- The user communicates in Bahasa Indonesia; answer in Indonesian, keep code/commits in English.
- Use OODA + TDD for every change (see AGENTS.md → Working method) and report verification evidence.
- Before ending a session: update `docs/MEMORY.md` (status, decisions, open items) and commit it.
- GitHub access from cloud sessions is limited to repository-scoped MCP tools: environments, secrets,
  runners and DNS cannot be changed from a session — use `deploy/setup-github.sh` and
  `deploy/register-runner.sh` instructions for the operator instead.
