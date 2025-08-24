import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from './config';

function ManageCategories({ user }) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ title: '', isActive: true });
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/categories`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/categories`, newCategory, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Category created successfully!');
      setNewCategory({ title: '', isActive: true });
      setShowCreateForm(false);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (categoryId, updatedData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/categories/${categoryId}`, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Category updated successfully!');
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update category');
    }
  };

  const handleToggleStatus = async (categoryId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/api/categories/${categoryId}/toggle-status`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      toast.success('Category status updated successfully!');
      fetchCategories();
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.postCount) {
        toast.error(
          error.response.data.error || 'Cannot deactivate category that has posts',
          {
            autoClose: 5000,
            position: 'top-center'
          }
        );
      } else {
        toast.error(error.response?.data?.error || 'Failed to update category status');
      }
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const confirmed = await new Promise((resolve) => {
      toast.warn(
        <div>
          <p>Are you sure you want to delete this category?</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              onClick={() => {
                toast.dismiss();
                resolve(true);
              }}
              style={{ 
                background: '#dc3545', 
                color: 'white', 
                border: 'none', 
                padding: '5px 15px', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
            <button 
              onClick={() => {
                toast.dismiss();
                resolve(false);
              }}
              style={{ 
                background: '#6c757d', 
                color: 'white', 
                border: 'none', 
                padding: '5px 15px', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>,
        {
          position: 'top-center',
          autoClose: false,
          closeOnClick: false,
          draggable: false,
        }
      );
    });

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/categories/${categoryId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      toast.success('Category deleted successfully!');
      fetchCategories();
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.postCount) {
        toast.error(
          error.response.data.error || 'Cannot delete category that has posts',
          {
            autoClose: 6000,
            position: 'top-center'
          }
        );
      } else {
        toast.error(error.response?.data?.error || 'Failed to delete category');
      }
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'Admin')) {
    return <div className="error">Access denied. Admin privileges required.</div>;
  }

  if (isLoading) {
    return <div className="loading">Loading categories...</div>;
  }

  return (
    <div className="manage-categories-container">
      <h2>Manage Categories</h2>
      
      <div className="category-actions-header">
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)} 
          className="btn btn-primary"
        >
          {showCreateForm ? 'Cancel' : 'Create New Category'}
        </button>
      </div>

      {showCreateForm && (
        <div className="create-category-form">
          <h3>Create New Category</h3>
          <form onSubmit={handleCreateCategory}>
            <div className="form-group">
              <label htmlFor="title">Title:</label>
              <input
                type="text"
                id="title"
                value={newCategory.title}
                onChange={(e) => setNewCategory({ ...newCategory, title: e.target.value })}
                required
              />
            </div>
            <div className="toggle-switch-container">
              <label>Active Status:</label>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="isActive"
                  className="toggle-switch-input"
                  checked={newCategory.isActive}
                  onChange={(e) => setNewCategory({ ...newCategory, isActive: e.target.checked })}
                />
                <span className="toggle-switch-text">
                  {newCategory.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Create Category</button>
          </form>
        </div>
      )}

      <div className="categories-table">
        {categories.length === 0 ? (
          <p>No categories found. Create your first category!</p>
        ) : (
          <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category, index) => (
              <tr key={category._id}>
                <td>
                  {editingCategory === category._id ? (
                    <input
                      type="text"
                      value={category.title}
                      onChange={(e) => {
                        const updatedCategories = categories.map(cat =>
                          cat._id === category._id ? { ...cat, title: e.target.value } : cat
                        );
                        setCategories(updatedCategories);
                      }}
                    />
                  ) : (
                    category.title
                  )}
                </td>
                <td>
                  <span className={`status ${category.isActive ? 'active' : 'inactive'}`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="action-buttons">
                  {editingCategory === category._id ? (
                    <>
                      <button
                        onClick={() => handleUpdateCategory(category._id, { title: category.title, isActive: category.isActive })}
                        className="btn btn-success btn-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingCategory(null);
                          fetchCategories();
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingCategory(category._id)}
                        className="btn btn-primary btn-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(category._id)}
                        className={`btn btn-sm ${category.isActive ? 'btn-warning' : 'btn-success'}`}
                      >
                        {category.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category._id)}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}

export default ManageCategories;
