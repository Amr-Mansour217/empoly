const axios = require("axios");

(async () => {
  try {
    // Login first
    const loginResponse = await axios.post("http://localhost:5001/api/auth/login", {
      username: "admin",
      password: "admin"
    });
    const token = loginResponse.data.token;
    console.log("Login successful, token obtained");
    
    // Make a direct request to assign supervisor
    const assignResponse = await axios.post(
      "http://localhost:5001/api/users/assign-supervisor",
      {
        "employeeId": 30,
        "supervisorId": 1
      },
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    console.log("Assignment response:", assignResponse.data);
  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message);
  }
})();
