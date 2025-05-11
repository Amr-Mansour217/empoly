import userModel from '../models/user';

async function debugUsers() {
  try {
    console.log('Fetching all users for debugging...');
    const users = await userModel.getAll();
    console.log(`Total users found: ${users.length}`);
    
    if (users.length > 0) {
      console.log('First user:', {
        id: users[0].id,
        username: users[0].username,
        role: users[0].role
      });
    } else {
      console.log('No users found in database.');
    }
    
    console.log('Fetching all supervisors...');
    const supervisors = await userModel.getAllSupervisors();
    console.log(`Total supervisors found: ${supervisors.length}`);
    
    if (supervisors.length > 0) {
      console.log('First supervisor:', {
        id: supervisors[0].id,
        username: supervisors[0].username,
        role: supervisors[0].role
      });
    } else {
      console.log('No supervisors found in database.');
    }
    
  } catch (error) {
    console.error('Error in debug script:', error);
  }
}

// Run the debug function
debugUsers().then(() => {
  console.log('Debug complete');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
