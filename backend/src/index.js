const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

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

app.listen(PORT, () => {
  console.log(`✅ NexFinance API running on port ${PORT}`);
});

module.exports = app;
