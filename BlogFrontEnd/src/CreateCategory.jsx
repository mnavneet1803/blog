import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from './config';

function CreateCategory({ user }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isActive: true
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/categories`,
        {
          title: formData.title,
          isActive: formData.isActive
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('Category created successfully!');
      setFormData({ title: '', description: '', isActive: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create category');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="error">Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="form-container">
      <h2>Create New Category</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Category Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            disabled={isLoading}
          />
        </div>

        <div className="toggle-switch-container">
          <label>Active Status:</label>
          <div className="toggle-switch">
            <input
              type="checkbox"
              id="isActive"
              className="toggle-switch-input"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              disabled={isLoading}
            />
            <span className="toggle-switch-text">
              {formData.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary btn-full"
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Category'}
        </button>
      </form>
    </div>
  );
}

export default CreateCategory;
