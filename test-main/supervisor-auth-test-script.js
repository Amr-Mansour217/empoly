const axios = require('axios');

async function testSupervisorAssignment() {
  try {
    console.log('Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      username: 'admin',
      password: 'admin'
    });
    
    const token = loginResponse.data.token;
    console.log('Logged in successfully, token received');
    
    // Configure axios to use the token for all requests
    const config = {
      headers: {
        'Authorization': Bearer 
      }
    };
    
    console.log('Testing supervisor assignment with different ID formats...');
    
    // Test with numeric IDs
    const numericResponse = await axios.post('http://localhost:5001/api/users/assign-supervisor', {
      employeeId: 2,
      supervisorId: 1
    }, config);
    console.log('Response with numeric IDs:', numericResponse.data);
    
    // Test with string IDs
    const stringResponse = await axios.post('http://localhost:5001/api/users/assign-supervisor', {
      employeeId: '2',
      supervisorId: '1'
    }, config);
    console.log('Response with string IDs:', stringResponse.data);
    
    console.log('Tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
    console.error('Error details:', error.response?.data?.details || 'No details available');
  }
}

testSupervisorAssignment();
