import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import complaintRoutes from './routes/complaints';
import adminRoutes from './routes/admin';
import officerAuthRoutes from './routes/officer-auth';
import officerComplaintRoutes from './routes/officer-complaints';
import db from './db';
import { initializeEmailService } from './utils/email-service';
import bcrypt from 'bcryptjs';

dotenv.config();

const seedOfficers = async () => {
  const officers = [
    {
      name: 'Admin Officer',
      email: 'admin@samasya.gov',
      password: 'admin123',
      role: 'admin',
      department: 'General',
    },
    {
      name: 'PWD Officer',
      email: 'pwd@samasya.gov',
      password: 'pwd123',
      role: 'officer',
      department: 'PWD',
    },
    {
      name: 'Water Officer',
      email: 'water@samasya.gov',
      password: 'water123',
      role: 'officer',
      department: 'Water',
    },
    {
      name: 'Sanitation Officer',
      email: 'sanitation@samasya.gov',
      password: 'sanitation123',
      role: 'officer',
      department: 'Sanitation',
    },
    {
      name: 'Electricity Officer',
      email: 'electricity@samasya.gov',
      password: 'electricity123',
      role: 'officer',
      department: 'Electricity',
    },
  ];

  for (const officer of officers) {
    const hashedPassword = await bcrypt.hash(officer.password, 10);

    await new Promise<void>((resolve) => {
      db.run(
        `INSERT INTO officers (name, email, password_hash, role, department)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
        [officer.name, officer.email, hashedPassword, officer.role, officer.department],
        (err: any) => {
          if (err) {
            console.warn(`[SEED] ⚠ ${officer.email}:`, err.message);
          } else {
            console.log(`[SEED] ✓ ${officer.email} (${officer.role})`);
          }
          resolve();
        }
      );
    });
  }
};

// Log environment configuration
console.log('[SERVER] Environment check:');
console.log('[SERVER] MYSQL_HOST:', process.env.MYSQL_HOST ? '✓ Configured' : '✗ Missing');
console.log('[SERVER] MYSQL_USER:', process.env.MYSQL_USER ? '✓ Configured' : '✗ Missing');
console.log('[SERVER] MYSQL_DATABASE:', process.env.MYSQL_DATABASE ? '✓ Configured' : '✗ Missing');
console.log('[SERVER] SMTP_HOST:', process.env.SMTP_HOST ? '✓ Configured' : '✗ Missing');
console.log('[SERVER] SMTP_PORT:', process.env.SMTP_PORT ? '✓ Configured' : '✗ Missing');

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static('uploads'));

  // Debug endpoint
  app.get('/api/debug', (req, res) => {
    res.json({
      mysql_connected: !!db.pool,
      smtp_configured: !!(process.env.SMTP_HOST && process.env.SMTP_PORT),
      server_time: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/complaints', complaintRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/officer/auth', officerAuthRoutes);
  app.use('/api/officer/complaints', officerComplaintRoutes);

  return app;
}

// Start server if this file is executed directly
(async () => {
  try {
    // Initialize database connection
    await db.initialize();

    // Seed officers on startup
    console.log('[SEED] Seeding officers table...');
    await seedOfficers();

    // Initialize email service
    initializeEmailService();

    const app = createServer();
    const PORT = process.env.SERVER_PORT || 5000;

    const server = app.listen(PORT, () => {
      console.log(`[SERVER] ✓ Express server running on http://localhost:${PORT}`);
    });

    // Handle server errors
    server.on('error', (err: any) => {
      if ((err as any).code === 'EADDRINUSE') {
        console.warn(`[SERVER] ⚠ Port ${PORT} in use, trying port ${PORT + 1}...`);
        app.listen(PORT + 1, () => {
          console.log(`[SERVER] ✓ Express server running on http://localhost:${PORT + 1}`);
        });
      } else {
        console.error('[SERVER] ✗ Error:', err.message);
        process.exit(1);
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('[SERVER] ✗ Uncaught exception:', err.message);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('[SERVER] ✗ Unhandled rejection at:', promise, 'reason:', reason);
    });
  } catch (err: any) {
    console.error('[SERVER] ✗ Failed to start:', err.message);
    process.exit(1);
  }
})();
