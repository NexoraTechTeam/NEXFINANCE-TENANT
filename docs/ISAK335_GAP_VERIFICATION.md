# ISAK 335 — what is mandatory vs optional (verification, 2026-10-22)

Question from Imam (2026-10-22): *of the features NexFinance Tenant does not have compared with Accurate, which ones are
really required, and which are optional?* This page records the verification, the decision and what was built.
Nothing here is guessed: each row names its source or the code that proves it.

## Sources
| Source | Used for |
| --- | --- |
| IAI exposure draft **DE ISAK 35** (`iaiglobal.or.id/v03/files/file_berita/DE ISAK 35.pdf`, 34 p.) | Sample statements and notes: *Depresiasi* appears in the expense breakdown and the fixed-asset disclosures; net assets in two classes; changes in net assets |
| accurate.id — "Akuntansi Nonprofit" and the official reseller pages (`softwareakuntansi.id/fitur-accurate-online`, `akuntansiusaha.id/…yayasan…`) | What Accurate Online offers (tax, bank reconciliation, fixed assets, inventory, multi-branch, Open API, approvals, 200+ reports) and what it says about nonprofits |
| NexFinance Tenant code (`backend/src`, `frontend-next`) | What exists today (grep: no depreciation, no bank reconciliation, no tax filing; PPh 21 only inside payroll) |

Limits: the final ISAK 335 text was not available — the exposure draft was used. The duty to depreciate comes from the
fixed-asset standard (PSAK 16 / the SAK Entitas Privat equivalent), which applies to every entity, not from ISAK 335 itself.
Accurate's public material shows no ready-made ISAK 335 (net assets with/without restrictions, changes in net assets,
release of restrictions) template — absence in public material, not proof; a 30-day trial would settle it.

## Verdict per missing feature
| Feature | Verdict | Why | Status |
| --- | --- | --- | --- |
| **Fixed-asset depreciation** | **MANDATORY** | Buildings, vehicles and equipment must be carried at cost less accumulated depreciation; the sample ISAK statements disclose it. Without it assets and surplus are overstated. The tenant had one account (1500 *Tanah & Bangunan*) and no depreciation. | **Built 2026-10-22** |
| Bank reconciliation | Optional (strongly useful) | No standard requires it; it is an internal-control practice auditors ask for. | Pending (priority 2) |
| Tax (e-Faktur, SPT, PPh 23/4(2)) | Optional | Education services are normally VAT-exempt; PPh 21 is already computed in payroll. Only needed if the school pays rent/services subject to withholding. | Pending, on demand |
| Full inventory (FIFO, batch, multi-warehouse) | Optional | Schools hold small stock (stationery); account 1300 exists. | Not planned |
| Multi-currency | Not needed | Irrelevant for a school. | Not planned |
| Multi-branch | Optional | One tenant = one school. Needed only for a foundation consolidating several schools. | Pending, on demand |
| Open API / integrations | Optional | Sales nice-to-have, not a standard. | Pending |
| Asset disposal / edit / void, expense by function | Follow-ups of the mandatory feature | See `docs/PENDING_TASKS.md` §F. | Pending |

## What was built (mandatory item)
- **Accounts** (added to every new tenant and, by migration `002_fixed_asset_accounts`, to existing tenants without touching edited
  accounts): `1510 Peralatan & Kendaraan`, `1590 Akumulasi Penyusutan` (contra asset), `5500 Beban Penyusutan`.
  Al-Musabbihin's live tenant goes from 18 to 21 accounts on the next boot (additive; verified locally by simulating an 18-account tenant).
- **Register** `fixed_assets` (`AST000001…`): categories Tanah (never depreciated), Bangunan, Peralatan, Kendaraan; straight-line only;
  `mode: acquisition` posts the cost against bank/cash, `mode: existing` is an asset already in the opening balance (optional
  opening accumulated depreciation, booked against unrestricted net assets).
- **Monthly depreciation** `POST /accounting/depreciation/run {period}` posts every missing month up to the period, dated on the last day
  of the month; idempotent per asset and month; serialised with an advisory lock (two simultaneous runs cannot duplicate);
  refuses a future month; the last month absorbs rounding so an asset never exceeds cost − residual.
- **Reports**: accumulated depreciation shown under non-current assets, *Beban Penyusutan* in the unrestricted expenses, no effect on
  cash flow, balance sheet stays balanced; CALK note B states the policy, new note **G** lists cost / accumulated / book value per category
  (as of the report year end). Legacy balance sheet `asetTetap` is now net; income statement has `bebanPenyusutan`.
- **UI**: Akuntansi → tab **Aset Tetap** (register, totals, "N bulan belum disusutkan" + one button, add-asset form with suggested lives,
  reconciliation of the register against the ledger accounts so a missing/double opening balance is visible). Auditor: read-only.

## Verification evidence
| Check | Result |
| --- | --- |
| Backend unit + API tests (TDD, red first) | 190 pass (31 new: maths, migration, validation, concurrency, RBAC, reports, year-end note) |
| Frontend tests | 132 pass (9 new) |
| Lint, `tsc`, `next build` | clean |
| Local browser E2E on a production-identical stack, 18-account tenant upgraded on boot | 3 assets registered, 27 journals (Rp 22.000.000) posted in one click, repeat = no-op, CALK note G + policy + position statement show it, reconciliation flags the unrecorded opening balance |
| API sweep (every endpoint × 6 roles + ledger integrity) | 244/244, 0 findings |
| UI sweep (6 roles × 12 pages + mobile) | 0 page errors, 0 HTTP errors, 0 overflow |

## Policy questions for the school's treasurer (do not guess)
1. Useful lives. The form suggests Bangunan 240 months, Peralatan 48, Kendaraan 96 — these are suggestions, the school decides.
2. Depreciation starts in the month of acquisition (default); an existing asset starts from the month the school enters.
3. Land and buildings sit in one cost account (1500); the register separates them (land is never depreciated).
4. Which framework applies (SAK Entitas Privat vs full SAK / PSAK 118 from 2027) — still open (`PENDING_TASKS.md` 7d).
5. Depreciation is classed as *Beban Program*; allocation per function (program / support) is a later option.
