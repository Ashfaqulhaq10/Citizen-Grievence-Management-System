import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';
import { sendOtpEmail, isValidEmail } from '../utils/email';
import { getOrCreateUserByEmail } from '../memory';
import { isDemoMode } from '../env';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

const otpStore: { [email: string]: { code: string; expiresAt: number } } = {};

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Get current user
router.get('/me', protect, (req: AuthRequest, res) => {
  if (req.user) {
    res.json({ user: { id: req.user.id, email: req.user.email } });
  } else {
    res.json({ user: null });
  }
});

// Request OTP
router.post('/request-otp', async (req, res) => {
  const { email } = req.body;
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const code = generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  otpStore[email] = { code, expiresAt };

  try {
    await sendOtpEmail(email, code);
    const response: any = { success: true };
    if (isDemoMode()) {
      response.demo = true;
      response.code = code;
    }
    console.log(`[OTP] Sent to ${email}`);
    res.json(response);
  } catch (err: any) {
    console.error(`[OTP] Failed for ${email}:`, err.message);
    return res.status(500).json({ error: 'Failed to send OTP', details: err.message });
  }
});

// Verify OTP
router.post('/verify-otp', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  const otp = otpStore[email];
  if (!otp) {
    return res.status(400).json({ error: 'OTP not found or expired' });
  }

  if (Date.now() > otp.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ error: 'OTP expired' });
  }

  if (otp.code !== code.trim()) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  delete otpStore[email];

  const user = getOrCreateUserByEmail(email);
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

  res.json({ token, user: { id: user.id, email: user.email } });
});

// Register new user
router.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Please provide email, password, and name' });
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);

  db.run('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)', [email, password_hash, name], function(err) {
    if (err) {
      return res.status(400).json({ message: 'User already exists' });
    }
    res.status(201).json({ id: this.lastID, email, name });
  });
});

// Login user
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    res.json({ token });
  });
});

// Login admin
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  db.get('SELECT * FROM admins WHERE email = ?', [email], (err, admin) => {
    if (err || !admin) {
        // for the first time admin login, create a new admin
        if (email === 'admin@gmail.com' && password === 'admin123') {
            const salt = bcrypt.genSaltSync(10);
            const password_hash = bcrypt.hashSync(password, salt);
            db.run('INSERT INTO admins (email, password_hash) VALUES (?, ?)', [email, password_hash], function(err) {
                if (err) {
                    return res.status(500).json({ message: 'Error creating admin' });
                }
                const token = jwt.sign({ id: this.lastID, email, isAdmin: true }, process.env.JWT_SECRET!, { expiresIn: '1h' });
                return res.json({ token });
            });
            return;
        }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = bcrypt.compareSync(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin.id, email: admin.email, isAdmin: true }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    res.json({ token });
  });
});

export default router;
