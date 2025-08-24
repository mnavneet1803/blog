import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from './config';

function ModifyCategories({ user }) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

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

  const handleEdit = (category) => {
    setEditingCategory(category._id);
    setEditForm({
      name: category.name,
      description: category.description || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditForm({ name: '', description: '' });
  };

  const handleSaveEdit = async (categoryId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/categories/${categoryId}`,
        editForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setEditingCategory(null);
      setEditForm({ name: '', description: '' });
      toast.success('Category updated successfully!');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleToggleStatus = async (categoryId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/api/categories/${categoryId}/toggle-status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
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

  const handleDelete = async (categoryId) => {
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

  if (!user || user.role !== 'admin') {
    return <div className="error">Access denied. Admin privileges required.</div>;
  }

  if (isLoading) {
    return <div className="loading">Loading categories...</div>;
  }

  return (
    <div className="main-content">
      <h2>Manage Categories</h2>
      
      {categories.length === 0 ? (
        <p>No categories found.</p>
      ) : (
        <div className="category-list">
          {categories.map((category) => (
            <div key={category._id} className="category-item">
              {editingCategory === category._id ? (
                <div className="category-info" style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    style={{ marginBottom: '0.5rem', width: '100%' }}
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows="2"
                    style={{ width: '100%' }}
                  />
                </div>
              ) : (
                <div className="category-info">
                  <div className="category-name">{category.name}</div>
                  {category.description && <p>{category.description}</p>}
                  <span className={`category-status ${category.isActive ? 'active' : 'inactive'}`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              )}
              
              <div className="category-actions">
                {editingCategory === category._id ? (
                  <>
                    <button
                      onClick={() => handleSaveEdit(category._id)}
                      className="btn btn-success"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(category)}
                      className="btn btn-primary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(category._id, category.isActive)}
                      className={`btn ${category.isActive ? 'btn-warning' : 'btn-success'}`}
                    >
                      {category.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(category._id)}
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ModifyCategories;
