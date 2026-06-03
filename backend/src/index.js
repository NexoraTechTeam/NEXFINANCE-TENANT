const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/accounting', require('./routes/accounting'));
app.use('/api/v1/spp', require('./routes/spp'));
app.use('/api/v1/payroll', require('./routes/payroll'));
app.use('/api/v1/expenses', require('./routes/expenses'));
app.use('/api/v1/procurement', require('./routes/procurement'));
app.use('/api/v1/dashboard', require('./routes/dashboard'));
app.use('/api/v1/master', require('./routes/master'));
app.use('/api/v1/activity', require('./routes/activity'));
app.use('/api/v1/notifications', require('./routes/notifications'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    requestId: req.id
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ NexFinance API running on port ${PORT}`);
  });
}

module.exports = app;
