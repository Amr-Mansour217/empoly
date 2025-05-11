"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.testConnection = testConnection;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Ensure db directory exists
const dbDir = path_1.default.resolve(__dirname, '../../database');
if (!fs_1.default.existsSync(dbDir)) {
    fs_1.default.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path_1.default.join(dbDir, 'employee_tracker.db');
const db = new better_sqlite3_1.default(dbPath);
// Import schema
const schemaPath = path_1.default.resolve(__dirname, '../../../db/schema.sqlite.sql');
if (fs_1.default.existsSync(schemaPath)) {
    const schema = fs_1.default.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
}
else {
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
const execute = (sql_1, ...args_1) => __awaiter(void 0, [sql_1, ...args_1], void 0, function* (sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        if (sql.trim().toLowerCase().startsWith('select')) {
            return stmt.all(...params);
        }
        else {
            return [stmt.run(...params)];
        }
    }
    catch (error) {
        console.error('Database error:', error);
        throw error;
    }
});
// Mock the same interface as MySQL for compatibility
const pool = {
    execute: (sql_1, ...args_1) => __awaiter(void 0, [sql_1, ...args_1], void 0, function* (sql, params = []) {
        const rows = yield execute(sql, params);
        return [rows, null];
    }),
    getConnection: () => __awaiter(void 0, void 0, void 0, function* () {
        return {
            release: () => { }
        };
    })
};
exports.pool = pool;
// Test database connection
function testConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const rows = yield execute('SELECT sqlite_version()');
            console.log('Database connection successful', rows);
            return true;
        }
        catch (error) {
            console.error('Database connection failed:', error);
            return false;
        }
    });
}
