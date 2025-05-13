const axios = require('axios');

async function checkLoginResponse() {
  try {
    console.log('Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      username: 'admin',
      password: 'admin'
    });
    
    console.log('Full login response:', JSON.stringify(loginResponse.data, null, 2));
  } catch (error) {
    console.error('Login failed:', error.response ? error.response.data : error.message);
  }
}

checkLoginResponse();
