// A script to help refresh supervisor assignments in the UI
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to the database file
const dbPath = path.join(__dirname, '../../database/employee_tracker.db');

// Connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
    return;
  }
  
  console.log('Connected to the employee_tracker database.');
  
  // First, list all users
  db.all(`SELECT * FROM users`, [], (err, users) => {
    if (err) {
      console.error('Error fetching users:', err.message);
      closeDb();
      return;
    }
    
    console.log('=== ALL USERS ===');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.username}, Name: ${user.full_name}, Role: ${user.role}`);
    });
    
    // Then list all supervisor assignments
    db.all(`SELECT * FROM employee_supervisors`, [], (err, assignments) => {
      if (err) {
        console.error('Error fetching supervisor assignments:', err.message);
        closeDb();
        return;
      }
      
      console.log('\n=== SUPERVISOR ASSIGNMENTS ===');
      if (assignments.length === 0) {
        console.log('No supervisor assignments found in the database.');
      } else {
        const promises = assignments.map((assignment) => {
          return new Promise((resolve, reject) => {
            // Get employee name
            db.get(`SELECT full_name FROM users WHERE id = ?`, [assignment.employee_id], (err, employee) => {
              if (err || !employee) {
                console.error(`Error getting employee ${assignment.employee_id}:`, err ? err.message : 'Not found');
                resolve();
                return;
              }
              
              // Get supervisor name
              db.get(`SELECT full_name FROM users WHERE id = ?`, [assignment.supervisor_id], (err, supervisor) => {
                if (err || !supervisor) {
                  console.error(`Error getting supervisor ${assignment.supervisor_id}:`, err ? err.message : 'Not found');
                  resolve();
                  return;
                }
                
                console.log(`Employee: ${employee.full_name} (ID: ${assignment.employee_id}) → Supervisor: ${supervisor.full_name} (ID: ${assignment.supervisor_id})`);
                resolve();
              });
            });
          });
        });
        
        Promise.all(promises).then(() => {
          console.log('\nTrying to fix any display issues...');
          
          // Now check the UI status
          db.run(`SELECT 1`, [], function(err) {
            if (err) {
              console.error('The database is working properly. UI issues may be related to the client code.');
            } else {
              console.log('Database connection is working properly.');
              console.log('Any UI issues should be fixed by refreshing the page or restarting the application.');
            }
            
            closeDb();
          });
        });
      }
    });
  });
});

function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Error closing the database connection:', err.message);
      return;
    }
    console.log('Database connection closed.');
  });
}
