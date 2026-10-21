# Final review — full E2E, every role (2026-10-21)

Scope: everything live for SIT Al Musabbihin (14 tenant pages, 56 API endpoints, 6 roles), FE + BE + DB.
Method (OODA + TDD): observe with three sweeps on a production-identical local stack (commit `67297a0`, clean DB),
find the root cause of every finding, write a failing test, fix, re-run every sweep.

## How it was tested
| Sweep | What | Before | After |
| --- | --- | --- | --- |
| API sweep (`api-sweep.mjs`) | every endpoint × 6 roles, valid + invalid payloads, RBAC matrix, ledger integrity | 227/238, 11 findings | **238/238, 0 findings** |
| Validation/hierarchy probes | amounts, dates, admin vs super admin, pagination | 9 accepted bad inputs | **all refused (400/403)** |
| UI sweep (`ui-sweep.js`) | 6 roles × 12 pages + mobile: menus, tabs, dialogs, console/page errors, failed requests | 4 roles with 403s/console errors on 6–10 pages | **78 page visits, 0 issues** |
| Functional UI flow (guide scripts) | console → admin → bendahara → staf → kabag → auditor, every module end-to-end, PDF | blocked at PO (see F12) | **passes, no page errors** |
| DB / ledger | debit = credit, accounts exist, position balanced, cash flow = cash, changes in net assets reconcile | unbalanced by Rp 90, cash off by Rp 10 | **balanced, reconciled** |

## Findings, root causes and fixes
| # | Finding (evidence) | Root cause | Fix (tests) |
| --- | --- | --- | --- |
| F1 | Manual journal accepted unbalanced, zero, unknown-account, same-account and non-date entries → balance sheet off by Rp 90, cash flow off by Rp 10 | `POST /accounting/journals` only checked that fields were present | RC1 shared validator `lib/validate.js`; journals must be dated, positive, balanced, on two different COA accounts |
| F2 | Negative/non-numeric amounts accepted (SPP invoice, expense, salary, PR, PO) | Same — truthiness checks (`!amount`) instead of number validation | RC1 `positiveAmount`/`nonNegativeAmount` on every money field |
| F3 | Invalid dates stored (opening balance `x`, restricted receipt `2026-13-45`) | No date validation; reports compare dates as strings | RC1 `isoDate` (calendar-valid YYYY-MM-DD) |
| F4 | Payroll could be processed twice for the same employee and month (double salary + bank payment) | No uniqueness check in `/payroll/calculate` | RC2 409 when a run exists for employee + month |
| F5 | PO accepted for a non-existent PR, and several POs per PR | `/procurement/po` did not look up the PR | RC2 404 unknown PR, 409 second PO |
| F6 | An approved (already journalled) expense could still be rejected | `/expenses/:id/reject` had no status check | RC2 only pending expenses can be rejected |
| F7 | Staff could approve/reject expenses — including their own — breaking dual control (UI showed the buttons) | RBAC is per module; approval authority was never modelled | RC3 approver roles (kabag, bendahara, admin, super admin), never own submission (`submittedById`); UI hides the buttons (`canDecideExpense`) |
| F8 | A session with a temporary password could use every API | `must_change_password` was enforced only by the UI dialog | RC4 auth middleware reads the user row: 403 `PASSWORD_CHANGE_REQUIRED` outside `/auth/*` |
| F9 | A deactivated user's token kept working (24 h); role changes applied only after re-login | Auth middleware trusted JWT claims only | RC4 inactive/missing user → 401; role taken from the database on every request |
| F10 | An admin could rename or deactivate the super admin; `status` accepted any string | No role hierarchy in user management | RC5 only a super admin may change a super admin; status ∈ {active, inactive} |
| F11 | Every role saw all 11 menus; opening a forbidden page fired 403s (console errors) and showed misleading empty pages with action buttons | Sidebar menu was static; pages mounted regardless of permissions | RC6 `lib/permissions.ts` (tenant matrix from `/auth/permissions`, cached per session), filtered sidebar, `AccessGate` ("Akses tidak tersedia", page not mounted); pages stay unmounted until a temporary password is changed |
| F12 | PO form required typing the PR ID by hand (the E2E typed "PR1" from a card label; the old API silently accepted it) | Free-text field for a reference to an existing record | PR picker with only PRs that have no PO yet, estimated cost pre-filled (`openPRsForPO`) |
| F13 | Reports page needs `accounting` even for a role granted only `reports` | Report endpoints were guarded by `accounting` only | RC6 report GETs accept `accounting` **or** `reports` |
| F14 | Expected 4xx errors were logged with stack traces | Error handler logged every error | Only 5xx reach the log |
| F15 | `activity?limit=-5&offset=-3` echoed negative paging | No clamping | limit 1–200, offset ≥ 0 |

Not a defect: receiving a PO twice returns 200 and posts the inventory journal once (idempotent).

## Evidence
- Backend 154 tests (new `final-review.test.js`: 24), frontend 123 tests (new `access-control.test.tsx`), lint, typecheck, build,
  isolation contract, deploy-script tests — all green.
- Existing tests that relied on the broken behaviour were corrected (sessions now change the temporary password first; the
  accounting flow no longer lets the submitter approve its own expense).
- Production is the source of truth for school data: this review never wrote to it; production checks are read-only.
