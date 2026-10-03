import express, { Request, Response } from 'express';
import db from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { isDemoMode } from '../env';

const router = express.Router();

interface OfficerRequest extends Request {
  officer?: { id: number; email: string; name: string; role: string; department: string };
}

export const protectOfficer = (req: OfficerRequest, res: Response, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    req.officer = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  if (isDemoMode()) {
    const demoOfficer = {
      id: 1,
      email: 'officer@demo.com',
      name: 'Demo Officer',
      role: 'officer',
      department: 'PWD',
    };
    const token = jwt.sign(demoOfficer, process.env.JWT_SECRET || 'your-secret-key');
    return res.json({ token, officer: demoOfficer });
  }

  db.get(
    'SELECT id, email, name, password_hash, role, department FROM officers WHERE email = ?',
    [email],
    async (err: any, row: any) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, row.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        {
          id: row.id,
          email: row.email,
          name: row.name,
          role: row.role,
          department: row.department,
        },
        process.env.JWT_SECRET || 'your-secret-key'
      );

      res.json({
        token,
        officer: {
          id: row.id,
          email: row.email,
          name: row.name,
          role: row.role,
          department: row.department,
        },
      });
    }
  );
});

router.post('/register', async (req: Request, res: Response) => {
  const { email, password, name, department, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  if (isDemoMode()) {
    return res.status(400).json({ error: 'Registration not available in demo mode' });
  }

  db.run(
    'INSERT INTO officers (name, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?)',
    [name, email, hashedPassword, role || 'officer', department || null],
    function (err: any) {
      if (err) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      res.status(201).json({
        id: (this as any).lastID,
        email,
        name,
        role: role || 'officer',
        department: department || null,
      });
    }
  );
});

router.get('/me', protectOfficer, (req: OfficerRequest, res: Response) => {
  res.json({ officer: req.officer });
});

export default router;
export { OfficerRequest };
