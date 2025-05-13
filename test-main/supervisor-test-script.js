const axios = require('axios');

async function testSupervisorAssignment() {
  try {
    console.log('Testing supervisor assignment with different ID formats...');
    
    // Test with numeric IDs
    const numericResponse = await axios.post('http://localhost:5001/api/users/assign-supervisor', {
      employeeId: 2,
      supervisorId: 1
    });
    console.log('Response with numeric IDs:', numericResponse.data);
    
    // Test with string IDs
    const stringResponse = await axios.post('http://localhost:5001/api/users/assign-supervisor', {
      employeeId: '2',
      supervisorId: '1'
    });
    console.log('Response with string IDs:', stringResponse.data);
    
    console.log('Tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
  }
}

testSupervisorAssignment();
