import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let db: any = null;
let pool: any = null;

const createMysqlPool = async () => {
  try {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log('[DB] ✓ MySQL database connected');
    await createTables();
    return pool;
  } catch (err: any) {
    console.error('[DB] Error connecting to MySQL:', err.message);
    throw err;
  }
};

const createTables = async () => {
  if (!pool) return;

  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    `CREATE TABLE IF NOT EXISTS complaints (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      location_text VARCHAR(255),
      lat DECIMAL(10,7),
      lng DECIMAL(10,7),
      media_url TEXT,
      department VARCHAR(100),
      district VARCHAR(100),
      city VARCHAR(100),
      village VARCHAR(100),
      status VARCHAR(20) DEFAULT 'pending',
      resolution_photo_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    `CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    `CREATE TABLE IF NOT EXISTS officers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'officer',
      department VARCHAR(100),
      area VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_department (department)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    `ALTER TABLE complaints ADD COLUMN assigned_officer_id INT;`
  ];

  try {
    const connection = await pool.getConnection();

    for (const query of queries) {
      try {
        await connection.execute(query);
      } catch (err: any) {
        const errorMsg = err.message || '';
        if (
          errorMsg.includes('already exists') ||
          errorMsg.includes('Duplicate column') ||
          errorMsg.includes('Duplicate entry') ||
          errorMsg.includes('Duplicate key') ||
          errorMsg.includes('Duplicate foreign key') ||
          errorMsg.includes('CONSTRAINT')
        ) {
          continue;
        }
        if (errorMsg.includes('Access denied') || errorMsg.includes('CREATE')) {
          console.warn('[DB] ⚠ Could not create tables (insufficient permissions):', errorMsg);
          continue;
        }
        console.error('[DB] Error creating table:', errorMsg);
      }
    }

    connection.release();
    console.log('[DB] ✓ Tables verified/created');
  } catch (err: any) {
    console.error('[DB] ✗ Error in createTables:', err.message);
  }
};

// Create wrapper object that supports both callback and promise-based API
const dbWrapper = {
  pool: null as any,

  async initialize() {
    this.pool = await createMysqlPool();
  },

  run(sql: string, params: any[] = [], callback?: (this: any, err: any) => void) {
    if (!this.pool) {
      const err = new Error('Database not initialized');
      callback?.call({ lastID: null, changes: 0 }, err);
      return;
    }

    this.pool.execute(sql, params).then((result: any) => {
      const info = result[0] as any;
      const context = {
        lastID: info?.insertId || null,
        changes: info?.affectedRows || 0
      };
      callback?.call(context, null);
    }).catch((err: any) => {
      callback?.call({ lastID: null, changes: 0 }, err);
    });
  },

  get(sql: string, params: any[] = [], callback?: (err: any, row: any) => void) {
    if (!this.pool) {
      callback?.(new Error('Database not initialized'), null);
      return;
    }

    this.pool.execute(sql, params).then((result: any) => {
      const rows = result[0] as any[];
      callback?.(null, rows?.[0] || null);
    }).catch((err: any) => {
      callback?.(err, null);
    });
  },

  all(sql: string, params: any[] = [], callback?: (err: any, rows: any[]) => void) {
    if (!this.pool) {
      callback?.(new Error('Database not initialized'), []);
      return;
    }

    this.pool.execute(sql, params).then((result: any) => {
      const rows = result[0] as any[];
      callback?.(null, rows || []);
    }).catch((err: any) => {
      callback?.(err, []);
    });
  },

  serialize(callback: () => void) {
    callback();
  },

  async query(sql: string, params: any[] = []) {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }
    const [rows] = await this.pool.execute(sql, params);
    return rows;
  }
};

export default dbWrapper;
