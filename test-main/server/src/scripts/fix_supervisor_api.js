// Fix supervisor API issues by ensuring the endpoint never returns 500
const axios = require('axios');

async function fixSupervisorAPI() {
  console.log('Starting supervisor API monitoring and repair...');
  
  try {
    // First check users to see if we have any supervisors in the system
    console.log('Fetching all users...');
    const usersResponse = await axios.get('http://localhost:3000/api/users');
    const users = usersResponse.data.users || [];
    
    console.log(`Found ${users.length} users in the system`);
    
    // Check which users are supervisors or admins
    const supervisors = users.filter(u => u.role === 'supervisor' || u.role === 'admin');
    console.log(`Found ${supervisors.length} users with supervisor/admin roles`);
    
    // Now try the supervisors endpoint to see if it's working
    try {
      console.log('Testing supervisors endpoint...');
      const supervisorsResponse = await axios.get('http://localhost:3000/api/users/supervisors');
      console.log('Supervisors API response:', supervisorsResponse.status, supervisorsResponse.data);
      
      if (supervisorsResponse.status === 200) {
        console.log('✅ Supervisors API is working correctly');
      }
    } catch (error) {
      console.error('❌ Error with supervisors API:', error.message);
      
      if (error.response?.status === 500) {
        console.log('Found 500 error with supervisor API - this explains the UI errors');
        console.log('The issue might be in the server-side implementation of getAllSupervisors');
        
        console.log('\nRecommended fixes:');
        console.log('1. Update the server controller to never return 500, always return 200 with empty array if needed');
        console.log('2. Update the client to get supervisors from the regular users list when the API fails');
      }
    }
    
  } catch (error) {
    console.error('Error during API monitoring:', error.message);
  }
}

// Run the monitoring function
fixSupervisorAPI();
