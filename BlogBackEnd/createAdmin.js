const axios = require('axios');

async function createAdmin() {
  try {
    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      phone: '1234567890',
      email: 'admin@blog.com',
      password: 'admin123!',
      role: 'admin'
    };

    const response = await axios.post('http://localhost:8000/api/users/register', adminData);
    
  } catch (error) {
    if (error.response) {
    } else if (error.request) {
    } else {
    }
  }
}

createAdmin();
