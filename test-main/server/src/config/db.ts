import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

// Ensure db directory exists
const dbDir = path.resolve(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'employee_tracker.db');
const db = new Database(dbPath);

// Import schema
const schemaPath = path.resolve(__dirname, '../../../db/schema.sqlite.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
} else {
  console.log('Schema file not found, creating tables manually');
  
  // Create tables
  db.exec(`
    -- Users table (for all user types)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      nationality TEXT,
      location TEXT,
      role TEXT NOT NULL CHECK(role IN ('admin', 'supervisor', 'employee')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Supervisor-Employee relationship
    CREATE TABLE IF NOT EXISTS employee_supervisors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      supervisor_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (employee_id)
    );

    -- Activity types
    CREATE TABLE IF NOT EXISTS activity_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Daily reports
    CREATE TABLE IF NOT EXISTS daily_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      activity_type_id INTEGER NOT NULL,
      beneficiaries_count INTEGER NOT NULL,
      location TEXT,
      report_date DATE NOT NULL,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (activity_type_id) REFERENCES activity_types(id) ON DELETE CASCADE,
      UNIQUE (employee_id, report_date)
    );

    -- Attendance records (automatically generated)
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date DATE NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('present', 'absent')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (employee_id, date)
    );

    -- Insert default activity types
    INSERT OR IGNORE INTO activity_types (name) VALUES 
      ('نشاط دعوي'),
      ('تصحيح تلاوة'),
      ('درس علمي'),
      ('غيره');

    -- Create admin user (password: admin123)
    INSERT OR IGNORE INTO users (username, password, full_name, role)
    VALUES ('admin', '$2b$10$rNC7OqI.Jy.OMa4.XLzHd.FfgN8jlzRlX9yw8tg9FUOgZQ1.wMTjq', 'Admin User', 'admin');
  `);
}

// Execute a query and return all rows
const execute = async (sql: string, params: any[] = []): Promise<any[]> => {
  try {
    const stmt = db.prepare(sql);
    if (sql.trim().toLowerCase().startsWith('select')) {
      return stmt.all(...params);
    } else {
      return [stmt.run(...params)];
    }
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
};

// Mock the same interface as MySQL for compatibility
const pool = {
  execute: async (sql: string, params: any[] = []): Promise<[any[], any]> => {
    const rows = await execute(sql, params);
    return [rows, null];
  },
  getConnection: async () => {
    return {
      release: () => {}
    };
  }
};

// Test database connection
async function testConnection() {
  try {
    const rows = await execute('SELECT sqlite_version()');
    console.log('Database connection successful', rows);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export { pool, testConnection }; 