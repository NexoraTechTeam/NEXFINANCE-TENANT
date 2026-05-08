# Deployment Guide

## Prerequisites
- Docker & Docker Compose
- Git
- Node.js 18+ (for local dev)
- PostgreSQL 15+ (for local dev)

## Quick Start with Docker

### 1. Clone Repository
```bash
git clone https://github.com/imam-nurokhi/al-musabbihin-nexfinance.git
cd al-musabbihin-nexfinance
```

### 2. Start Services
```bash
docker-compose up -d
```

### 3. Access Applications
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Database: localhost:5432 (postgres/nexfinance_password)

## Environment Configuration

### Backend (.env)
```
NODE_ENV=production
PORT=5000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=nexfinance
DB_USER=postgres
DB_PASSWORD=secure_password_here
JWT_SECRET=your_super_secret_jwt_key
API_BASE_URL=https://api.yourdomain.com
```

### Frontend (.env)
```
REACT_APP_API_URL=https://api.yourdomain.com/api/v1
REACT_APP_ENV=production
```

## Production Deployment

### AWS EC2
```bash
# SSH into instance
ssh -i key.pem ec2-user@your-instance

# Clone repo
git clone https://github.com/imam-nurokhi/al-musabbihin-nexfinance.git

# Run with Docker Compose
cd al-musabbihin-nexfinance
docker-compose -f docker-compose.yml up -d
```

### Health Checks
```bash
# Backend health
curl http://localhost:5000/health

# Database connection
curl http://localhost:5000/api/v1/auth/verify
```

## Backup & Recovery

### Database Backup
```bash
docker exec postgres pg_dump -U postgres nexfinance > backup.sql
```

### Restore Backup
```bash
docker exec -i postgres psql -U postgres < backup.sql
```

## Monitoring

### View Logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop Services
```bash
docker-compose down
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port
lsof -i :5000
kill -9 <PID>
```

### Database Connection Error
```bash
# Verify PostgreSQL is running
docker-compose ps

# Reset database
docker-compose down -v
docker-compose up -d
```

### Frontend Not Loading
```bash
# Check Node modules
cd frontend
npm install
npm start
```
