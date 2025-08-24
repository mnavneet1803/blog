import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from './config';

function Signup({ onSignup }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
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
      const response = await axios.post(`${API_BASE_URL}/api/users/register`, formData);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      toast.success('Account created successfully!');
      
      if (onSignup) {
        onSignup(response.data.user, response.data.token);
      }
    } catch (error) {
      let friendlyMessage = 'Something went wrong. Please try again.';
      
      const serverError = error.response?.data?.error;
      if (serverError) {
        // Make common server errors more user-friendly
        if (serverError.includes('email') && serverError.includes('exists')) {
          friendlyMessage = 'This email address is already registered. Please use a different email or try signing in instead.';
        } else if (serverError.includes('validation') || serverError.includes('required')) {
          friendlyMessage = 'Please fill in all required fields with valid information.';
        } else if (serverError.includes('password')) {
          friendlyMessage = 'Please create a stronger password with at least 8 characters.';
        } else if (serverError.includes('email') && serverError.includes('invalid')) {
          friendlyMessage = 'Please enter a valid email address.';
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
    <div className="signup-container">
      <form onSubmit={handleSubmit} className="signup-form" noValidate>
        <h2>Create Account</h2>
        
        {errors.general && <div className="error-message general-error">{errors.general}</div>}
        
        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Enter your first name"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Enter your last name"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter your phone number"
            disabled={isLoading}
          />
        </div>

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
            placeholder="Create a password"
            disabled={isLoading}
          />
        </div>

        <button type="submit" className="btn btn-success" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}

export default Signup;