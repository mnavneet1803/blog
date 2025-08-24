import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';

function CategorySection({ selectedCategory, onCategoryChange, showCategories, onToggleCategories }) {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/categories/active`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  return (
    <div className="categories-section">
      <div className="section-toggle" onClick={onToggleCategories}>
        <h3>Categories</h3>
        <svg className={`toggle-icon ${showCategories ? 'expanded' : ''}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </div>
      <div className={`section-content ${showCategories ? 'expanded' : 'collapsed'}`}>
        <div className="search-categories-container">
          <div className="category-search">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="category-list">
          <button
            className={`category-item ${selectedCategory === '' ? 'active' : ''}`}
            onClick={() => onCategoryChange('')}
          >
            All Categories
          </button>
          {categories
            .filter(cat => cat.title.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(category => (
              <button
                key={category._id}
                className={`category-item ${selectedCategory === category._id ? 'active' : ''}`}
                onClick={() => onCategoryChange(category._id)}
              >
                {category.title}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

export default CategorySection;
