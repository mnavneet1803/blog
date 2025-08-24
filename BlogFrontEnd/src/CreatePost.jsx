import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from './config';
import ImageCarousel from './ImageCarousel';
import ImageManager from './ImageManager';

function CreatePost({ user, onPostCreated }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    img: '',
    images: [],
    category: '',
    isPinned: false
  });
  
  const [categories, setCategories] = useState([]);
  const [imageItems, setImageItems] = useState([]);
  const [reorderCounter, setReorderCounter] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    return () => {
      imageItems.forEach(item => {
        if (item && item.preview) {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/categories/active`);
      setCategories(response.data);
    } catch (error) {
    }
  };

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

  const handlePinnedChange = (checked) => {
    setFormData(prev => ({
      ...prev,
      isPinned: checked,
      category: checked ? '' : prev.category
    }));
    
    if (checked && (errors.category || errors.image)) {
      setErrors(prev => ({
        ...prev,
        category: '',
        image: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImageItems = files.map((file, index) => ({
        id: Date.now() + index,
        file: file,
        preview: URL.createObjectURL(file)
      }));
      
      const updatedItems = [...imageItems, ...newImageItems];
      setImageItems(updatedItems);
      
      if (errors.image) {
        setErrors(prev => ({
          ...prev,
          image: ''
        }));
      }
    }
    
    e.target.value = '';
  };

  const removeImage = (indexToRemove) => {
    const itemToRemove = imageItems[indexToRemove];
    if (itemToRemove) {
      URL.revokeObjectURL(itemToRemove.preview);
    }
    
    const updatedItems = imageItems.filter((_, index) => index !== indexToRemove);
    setImageItems(updatedItems);
  };

  const reorderImages = (dragIndex, hoverIndex) => {
    const updatedItems = [...imageItems];
    
    const draggedItem = updatedItems[dragIndex];
    updatedItems.splice(dragIndex, 1);
    updatedItems.splice(hoverIndex, 0, draggedItem);
    
    setImageItems(updatedItems);
    setReorderCounter(prev => prev + 1);
  };

  const uploadImages = async () => {
    if (!imageItems || imageItems.length === 0) return [];
    
    const formData = new FormData();
    imageItems.forEach(item => {
      formData.append('images', item.file);
    });
    
    try {
      setIsUploading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/api/posts/upload-images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.imageUrls;
    } catch (error) {
      throw new Error('Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.body.trim()) {
      newErrors.body = 'Content is required';
    }
    
    if (!formData.isPinned && !formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.isPinned && (!imageItems || imageItems.length === 0)) {
      newErrors.image = 'At least one image is required';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      
      let imageUrls = [];
      if (imageItems && imageItems.length > 0) {
        imageUrls = await uploadImages();
      }
      
      const token = localStorage.getItem('token');
      const postData = {
        title: formData.title,
        body: formData.body,
        images: imageUrls,
        img: imageUrls.length > 0 ? imageUrls[0] : '',
        category: formData.category,
        isPinned: formData.isPinned
      };
      
      const response = await axios.post(`${API_BASE_URL}/api/posts`, postData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success(response.data.message || 'Post created successfully!');
      
      setFormData({ title: '', body: '', img: '', images: [], category: '', isPinned: false });
      setImageItems([]);
      
      if (onPostCreated) {
        onPostCreated(response.data.post || response.data);
      }
      
      navigate('/');
      
    } catch (error) {
      setErrors({ 
        general: error.response?.data?.error || 'Failed to create post. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="create-post-container">
        <p>Please log in to create a post.</p>
      </div>
    );
  }

  return (
    <div className="create-post-container">
      <form onSubmit={handleSubmit} className="create-post-form">
        <h2>Create New Post</h2>
        
        {errors.general && <div className="error-message general-error">{errors.general}</div>}
        
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter post title"
            className={errors.title ? 'error' : ''}
            disabled={isSubmitting}
          />
          {errors.title && <span className="error-message">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={errors.category ? 'error' : ''}
            disabled={isSubmitting || formData.isPinned}
            required
          >
            <option value="">
              {formData.isPinned ? 'Auto-assigned to Important' : 'Select a category'}
            </option>
            {!formData.isPinned && categories
              .filter(category => category.title !== 'Important')
              .map(category => (
                <option key={category._id} value={category._id}>
                  {category.title}
                </option>
              ))}
          </select>
          {errors.category && <span className="error-message">{errors.category}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="image">
            Images {formData.isPinned ? '(Optional)' : '(Required)'}
          </label>
          
          <div className="add-image-section">
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              disabled={isSubmitting || isUploading}
              className="add-image-input"
              required={!formData.isPinned && imageItems.length === 0}
            />
            <button
              type="button"
              className="add-image-btn"
              onClick={() => document.getElementById('image').click()}
              disabled={isSubmitting || isUploading}
              title="Click to select one or more images"
            >
            {imageItems.length === 0 ? 'Add Images' : 'Add More Images'}
            </button>
          </div>
          
          {errors.image && <span className="error-message">{errors.image}</span>}
          
          {imageItems.length > 0 && (
            <ImageManager
              images={imageItems.map(item => item.preview)}
              imageItems={imageItems}
              onRemove={removeImage}
              onReorder={reorderImages}
            />
          )}
          
          {imageItems.length > 1 && (
            <div className="image-preview-section">
              <h4>Preview:</h4>
              <ImageCarousel 
                key={`carousel-reorder-${reorderCounter}-${imageItems.length}`} 
                images={imageItems.map(item => item.preview)} 
                alt="Image preview" 
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="body">Content</label>
          <textarea
            id="body"
            name="body"
            value={formData.body}
            onChange={handleChange}
            placeholder="Write your post content here..."
            rows="10"
            className={errors.body ? 'error' : ''}
            disabled={isSubmitting}
          />
          {errors.body && <span className="error-message">{errors.body}</span>}
        </div>

        {(user.role === 'admin' || user.role === 'Admin') && (
          <div className="toggle-switch-container">
            <label>Pin Post to Top:</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="isPinned"
                className="toggle-switch-input"
                checked={formData.isPinned}
                onChange={(e) => handlePinnedChange(e.target.checked)}
                disabled={isSubmitting}
              />
              <span className="toggle-switch-text">
                {formData.isPinned ? 'Pinned' : 'Not Pinned'}
              </span>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={isSubmitting || isUploading}
        >
          {isSubmitting ? 'Creating Post...' : isUploading ? 'Uploading Images...' : 'Create Post'}
        </button>
      </form>
    </div>
  );
}

export default CreatePost;