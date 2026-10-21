# Final-review sweeps

Re-run after larger changes (local stack as in `docs/guide/tools/README.md`: backend on 5080 with a clean database and
the al-musabbihin tenant onboarded with `--no-password`, frontend on 3060, console password `Console-Docs-2026`):

```bash
node docs/qa/tools/api-sweep.mjs          # every endpoint × 6 roles + ledger integrity → JSON with "findings"
node docs/qa/tools/validation-probe.mjs   # bad amounts/dates, admin vs super admin (run after api-sweep)
sh docs/qa/tools/setup-ui-users.sh        # kabag2 with a temporary password (forced-change path)
(cd docs/guide/tools && NODE_PATH=$PWD/node_modules node ../../qa/tools/ui-sweep.js <out-dir>)  # 6 roles × pages
```
Expected: `findings: []`, every probe 400/403, UI report with 0 pages with issues. Never point these at production.
