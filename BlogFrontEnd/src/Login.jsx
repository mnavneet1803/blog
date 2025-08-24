import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from './config';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/login`, formData);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      

      onLogin(response.data.user, response.data.token);
      
      toast.success('Login successful!');
    } catch (error) {
      let friendlyMessage = 'Something went wrong. Please try again.';
      
      const serverError = error.response?.data?.error;
      if (serverError) {
        // Make common server errors more user-friendly
        if (serverError.includes('Invalid credentials') || serverError.includes('password') || serverError.includes('email')) {
          friendlyMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (serverError.includes('User not found')) {
          friendlyMessage = 'No account found with this email address. Please check your email or create a new account.';
        } else if (serverError.includes('blocked') || serverError.includes('suspended')) {
          friendlyMessage = 'Your account has been temporarily suspended. Please contact support.';
        } else {
          friendlyMessage = serverError;
        }
      }
      
      setErrors({ 
        general: friendlyMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form" noValidate>
        <h2>Sign In</h2>
        
        {errors.general && <div className="error-message general-error">{errors.general}</div>}
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            disabled={isLoading}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

export default Login;
