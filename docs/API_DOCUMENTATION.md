# NexFinance API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication
All endpoints require JWT Bearer token:
```
Authorization: Bearer {token}
```

## Endpoints

### Authentication
- `POST /auth/login` - Login with email/password
- `POST /auth/register` - Register new user
- `GET /auth/verify` - Verify token validity

### Accounting (ISAK35 Compliant)
- `GET /accounting/chart-of-accounts` - Get all accounts
- `POST /accounting/journals` - Create journal entry
- `GET /accounting/reports/balance-sheet` - Balance sheet report
- `GET /accounting/reports/income-statement` - Income statement
- `GET /accounting/reports/isak335?year=` - ISAK 335 package (financial position, comprehensive income, changes in net assets, cash flows, notes A–G)
- `GET /accounting/fixed-assets` - Fixed-asset register: cost, accumulated depreciation, book value, `reconciliation` against the ledger accounts, `categories`
- `POST /accounting/fixed-assets` - Register an asset (`mode: acquisition` posts the cost; `mode: existing` is already in the opening balance and may carry `accumulatedDepreciation` + `depreciationFrom`)
- `POST /accounting/depreciation/run` - `{ "period": "YYYY-MM" }` posts every missing monthly straight-line charge up to that month (idempotent, never a future month)

### SPP (Fee Collection)
- `GET /spp/invoices` - List all invoices
- `POST /spp/invoices` - Create invoice
- `POST /spp/payment` - Record payment
- `GET /spp/reports` - Collection reports

### Payroll
- `GET /payroll/employees` - List employees
- `POST /payroll/calculate` - Calculate salary with tax/benefits
- `GET /payroll/reports` - Payroll reports

### Expenses
- `POST /expenses/submit` - Submit expense claim
- `GET /expenses` - List all expenses
- `POST /expenses/:id/approve` - Approve expense
- `POST /expenses/:id/reject` - Reject expense

### Procurement
- `POST /procurement/pr` - Create purchase request
- `POST /procurement/po` - Create purchase order
- `POST /procurement/po/:id/receive` - Mark PO as received
- `GET /procurement/reports` - Procurement reports

### Dashboard
- `GET /dashboard/kpi` - Real-time KPIs
- `GET /dashboard/monthly-report` - Monthly financial report
- `GET /dashboard/export/pdf` - Export PDF
- `GET /dashboard/export/excel` - Export Excel

## Response Format
```json
{
  "status": "success|error",
  "data": {...},
  "message": "Human readable message"
}
```

## Error Handling
```json
{
  "error": "Error message",
  "requestId": "unique-request-id",
  "status": "error_code"
}
```

## Rate Limiting
- 100 requests per minute
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## ISAK35 Features
✅ Chart of Accounts (Terikat/Tidak Terikat)
✅ Auto Journal Posting
✅ ISAK35 Report Format
✅ Fund Tracking
✅ Audit Logging
