# Al-Musabbihin NexFinance

**ISAK35 Finance System for Schools**

A comprehensive financial management system designed specifically for educational institutions, implementing the ISAK35 standard for school accounting and financial reporting.

## Project Overview

Al-Musabbihin NexFinance is a modern, scalable web application that provides:

- **Financial Management**: Budget planning, expense tracking, and financial reporting
- **School Administration**: Student fees, salary management, and payroll processing
- **Compliance**: ISAK35 standard compliance for school financial management
- **Real-time Analytics**: Dashboard with key financial metrics and insights
- **Multi-user Access**: Role-based access control for administrators, accountants, and supervisors
- **Audit Trail**: Complete transaction history and compliance documentation

## Technology Stack

### Backend
- Node.js / Express.js
- PostgreSQL / MongoDB
- RESTful API architecture
- JWT Authentication

### Frontend
- React.js / Next.js
- TypeScript
- Material-UI / Tailwind CSS
- Real-time data visualization

### DevOps
- Docker & Docker Compose
- Kubernetes-ready
- CI/CD Pipeline
- Cloud-native deployment

## Project Structure

```
al-musabbihin-nexfinance/
├── backend/           # Node.js backend API
├── frontend/          # React.js frontend application
├── docs/              # Documentation and specifications
├── deployment/        # Docker and deployment configurations
└── README.md          # This file
```

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- npm or yarn

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/Nexora-Tech-Team/al-musabbihin-nexfinance.git
cd al-musabbihin-nexfinance

# Start services with Docker Compose
docker-compose up -d

# Application will be available at:
# Frontend: http://localhost:3000
# API: http://localhost:5000
```

### Local Development Setup

```bash
# Backend setup
cd backend
npm install
npm run dev

# Frontend setup (in new terminal)
cd frontend
npm install
npm run dev
```

## Configuration

### Environment Variables

Create `.env` files in respective directories:

**Backend (.env)**
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/nexfinance
JWT_SECRET=your-secret-key
```

**Frontend (.env.local)**
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

## Features

### Phase 1: Core Finance Module
- [ ] General Ledger Management
- [ ] Chart of Accounts
- [ ] Journal Entry Processing
- [ ] Financial Statement Generation

### Phase 2: School Operations
- [ ] Student Fee Management
- [ ] Salary & Payroll System
- [ ] Expense Tracking
- [ ] Budget Allocation

### Phase 3: Reporting & Compliance
- [ ] ISAK35 Compliance Reports
- [ ] Audit Trail Reports
- [ ] Financial Analytics Dashboard
- [ ] Multi-year Comparisons

## Deployment

### Docker Compose (Development)
```bash
docker-compose up -d
```

### Production Deployment
See `/deployment` directory for:
- Kubernetes manifests
- Cloud deployment guides
- Infrastructure as Code (Terraform/Ansible)

## Documentation

- `/docs/API_DOCUMENTATION.md` - API endpoints and specifications
- `/docs/ISAK35_COMPLIANCE.md` - ISAK35 standard implementation details
- `/docs/DATABASE_SCHEMA.md` - Database design documentation
- `/docs/DEPLOYMENT_GUIDE.md` - Production deployment procedures

## Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Building for Production
```bash
# Build Docker images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring & Logging

- Application logs: Docker Compose logs
- Error tracking: Sentry integration (optional)
- Performance monitoring: New Relic / DataDog (optional)

## Contributing

1. Create a feature branch: `git checkout -b feature/feature-name`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/feature-name`
4. Submit a Pull Request

## Security

- All API endpoints require JWT authentication
- Sensitive data is encrypted at rest
- HTTPS required for production
- Regular security audits and dependency updates
- Environment variables for sensitive configuration

## Troubleshooting

### Port already in use
```bash
# Change port in docker-compose.yml or .env files
```

### Database connection errors
```bash
# Verify DATABASE_URL in .env
# Check database service is running
docker-compose ps
```

### CORS issues
```bash
# Update CORS settings in backend configuration
```

## Support & Maintenance

For support, issues, or feature requests, please create an issue in the repository.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- ISAK35 Standard Implementation
- School Financial Management Best Practices
- Built by Nexora Tech Team

---

**Status**: Active Development  
**Last Updated**: 2026  
**Nexora Technology Team**
