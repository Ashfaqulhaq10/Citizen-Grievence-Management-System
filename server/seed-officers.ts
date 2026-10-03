import db from './db';
import bcrypt from 'bcryptjs';

async function seedOfficers() {
  console.log('[SEED] Starting officer seed...');

  await db.initialize();

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

    db.run(
      `INSERT INTO officers (name, email, password_hash, role, department)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      [officer.name, officer.email, hashedPassword, officer.role, officer.department],
      (err: any) => {
        if (err) {
          console.error(`[SEED] Error seeding ${officer.email}:`, err.message);
        } else {
          console.log(`[SEED] ✓ ${officer.email} (${officer.role})`);
        }
      }
    );
  }

  console.log('[SEED] Officer seed completed!');
  console.log('[SEED] Demo credentials:');
  officers.forEach((o) => {
    console.log(`  - ${o.email} / ${o.password}`);
  });
}

seedOfficers();
