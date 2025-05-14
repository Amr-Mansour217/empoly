// Apply database migrations
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function applyMigration() {
  // Create database connection
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'employee_tracker',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  console.log('Connected to database');
  
  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'db', 'add_lessons_to_reports.sql');
    const migrationSql = await fs.readFile(migrationPath, 'utf8');
    
    console.log('Migration SQL loaded:', migrationSql);
    
    // Execute migration
    const statements = migrationSql
      .split(';')
      .filter(stmt => stmt.trim())
      .map(stmt => stmt + ';');
    
    for (const stmt of statements) {
      console.log(`Executing: ${stmt}`);
      await pool.execute(stmt);
    }
    
    console.log('Migration completed successfully');
    
    // Verify the structure has been updated
    const [fields] = await pool.execute('DESCRIBE daily_reports');
    console.log('Table structure after migration:');
    console.log(fields.map(f => f.Field));
    
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    await pool.end();
  }
}

applyMigration();
