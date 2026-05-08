# ISAK35 Compliance Implementation

## Overview
NexFinance implements full ISAK35 (Indonesian Standards for Financial Accounting - Educational Institutions) compliance for schools and educational organizations.

## Chart of Accounts (ISAK35 Standard)

### Assets (1000-1999)
- 1000: Cash
- 1100: Bank Account
- 1200: Accounts Receivable

### Liabilities (2000-2999)
- 2000: Accounts Payable
- 2100: Employee Payables

### Equity (3000-3999)
- 3000: Fund Balance - Terikat (Restricted)
- 3100: Fund Balance - Tidak Terikat (Unrestricted)

### Revenue (4000-4999)
- 4000: Tuition Income (SPP)
- 4100: Government Grant (BOS)
- 4200: Donations

### Expenses (5000-5999)
- 5000: Salary Expense
- 5100: Benefit Expense (BPJS)
- 5200: Supply Expense

## Fund Classification

### Terikat (Restricted Funds)
- Government grants (BOS) - must be used for specific purposes
- Donations with restrictions
- Special purpose funds

### Tidak Terikat (Unrestricted Funds)
- Tuition fees
- Unrestricted donations
- Operational revenue

## Financial Reports

### 1. Posisi Keuangan (Balance Sheet)
- Assets
- Liabilities
- Fund Balance (by restriction status)

### 2. Operasi (Income Statement)
- Operating Revenue
- Operating Expenses
- Non-Operating Revenue/Expenses
- Surplus/Deficit

### 3. Arus Kas (Cash Flow Statement)
- Operating Activities
- Investment Activities
- Financing Activities

## Audit Trail
All transactions are logged with:
- User ID & email
- Timestamp
- Transaction details
- Source system
- Authorization level

## Compliance Checklist
✅ Dual-classification of funds (Terikat/Tidak Terikat)
✅ ISAK35 chart of accounts
✅ Automated journal posting
✅ Fund movement tracking
✅ Real-time financial reporting
✅ Audit logging
✅ Stakeholder transparency
✅ Tax compliance (PPh 21 TER, BPJS)
