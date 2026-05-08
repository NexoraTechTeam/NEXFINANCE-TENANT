const express = require('express');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const router = express.Router();

// Mock users database
const users = {
  'admin@nexfinance.com': {
    id: '1',
    password: 'admin123', // Plain text for demo (use hashed in production)
    role: 'admin'
  }
};

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`[AUTH] Login attempt: ${email} / ${password}`);
  const user = users[email];
  console.log(`[AUTH] User found: ${!!user}`);
  
  // Simple password check for demo
  if (!user || user.password !== password) {
    console.log(`[AUTH] Auth failed - user: ${!!user}, password match: ${user && user.password === password}`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '24h' }
  );

  res.json({ token, user: { id: user.id, email, role: user.role } });
});

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  
  if (users[email]) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const hashedPassword = await bcryptjs.hash(password, 10);
  const id = Date.now().toString();
  
  users[email] = { id, password: hashedPassword, role: 'user' };
  
  const token = jwt.sign(
    { id, email, role: 'user' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '24h' }
  );

  res.status(201).json({ token, user: { id, email, role: 'user' } });
});

router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ valid: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;
