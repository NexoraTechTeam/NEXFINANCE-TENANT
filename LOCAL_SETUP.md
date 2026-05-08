# 🚀 NexFinance Local Setup Guide (Ports 3033 & 8099)

## Configuration ✅

### Backend (Express.js - Port 8099)
```bash
# File: /tmp/al-musabbihin-nexfinance/backend/.env
NODE_ENV=development
PORT=8099
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexfinance
DB_USER=postgres
DB_PASSWORD=nexfinance_password
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRY=24h
REDIS_HOST=localhost
REDIS_PORT=6379
API_BASE_URL=http://localhost:8099
FRONTEND_URL=http://localhost:3033
```

### Frontend (React - Port 3033)
```bash
# File: /tmp/al-musabbihin-nexfinance/frontend/.env
REACT_APP_API_URL=http://localhost:8099/api/v1
REACT_APP_ENV=development
```

---

## Start Services

### 1. Backend (Terminal 1)
```bash
cd /tmp/al-musabbihin-nexfinance/backend
PORT=8099 npm start
```

**Expected Output:**
```
✅ NexFinance API running on port 8099
```

**Test:**
```bash
curl http://localhost:8099/health
# Response: {"status":"ok","timestamp":"..."}
```

### 2. Frontend (Terminal 2)
```bash
cd /tmp/al-musabbihin-nexfinance/frontend
PORT=3033 npm start
```

**Expected Output:**
```
Compiled successfully!
You can now view nexfinance-frontend in the browser.

  Local:            http://localhost:3033
  On Your Network:  http://[local-ip]:3033
```

---

## API Testing

### Login
```bash
curl -X POST http://localhost:8099/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nexfinance.com","password":"admin123"}'
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "1",
    "email": "admin@nexfinance.com",
    "role": "admin"
  }
}
```

### Test All Modules
```bash
TOKEN="your_token_here"

# Accounting
curl -H "Authorization: Bearer $TOKEN" http://localhost:8099/api/v1/accounting/chart-of-accounts

# SPP
curl -H "Authorization: Bearer $TOKEN" http://localhost:8099/api/v1/spp/invoices

# Payroll
curl -H "Authorization: Bearer $TOKEN" http://localhost:8099/api/v1/payroll/employees

# Dashboard
curl -H "Authorization: Bearer $TOKEN" http://localhost:8099/api/v1/dashboard/kpi

# Expenses
curl -H "Authorization: Bearer $TOKEN" http://localhost:8099/api/v1/expenses

# Procurement
curl -H "Authorization: Bearer $TOKEN" http://localhost:8099/api/v1/procurement/reports
```

---

## Frontend Access

### Login Page
```
http://localhost:3033/login
```

**Demo Credentials:**
- Email: `admin@nexfinance.com`
- Password: `admin123`

### Dashboard
```
http://localhost:3033/dashboard
```

### SPP Management
```
http://localhost:3033/spp
```

---

## Troubleshooting

### Port 8099 Already in Use
```bash
lsof -i :8099 -t | xargs kill -9
```

### Port 3033 Already in Use
```bash
lsof -i :3033 -t | xargs kill -9
```

### Backend Dependencies Missing
```bash
cd /tmp/al-musabbihin-nexfinance/backend
npm install
```

### Frontend Dependencies Missing
```bash
cd /tmp/al-musabbihin-nexfinance/frontend
npm install --legacy-peer-deps
```

### Backend Connection Error
Ensure Node.js v18+ is installed:
```bash
node --version
```

### Frontend Build Error
Try clearing cache:
```bash
cd /tmp/al-musabbihin-nexfinance/frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

## Architecture

```
Browser (http://localhost:3033)
    ↓
React Frontend (Port 3033)
    ↓ HTTPS/CORS
Express.js API (Port 8099)
    ↓
PostgreSQL Database
Redis Cache
```

---

## Monitoring

### Backend Logs
```bash
tail -f /tmp/al-musabbihin-nexfinance/backend/logs/app.log
```

### Frontend Build Output
Check React compiler output in Terminal 2

### API Health
```bash
curl http://localhost:8099/health
```

---

## Production Deployment

After local testing, deploy with Docker:
```bash
cd /tmp/al-musabbihin-nexfinance
docker-compose up -d
```

---

**Status**: ✅ Ready for Local Development  
**Backend Port**: 8099  
**Frontend Port**: 3033  
**Repo**: https://github.com/imam-nurokhi/al-musabbihin-nexfinance
