import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from './config';
import ImageCarousel from './ImageCarousel';
import ImageManager from './ImageManager';

function EditPost({ user }) {
  const navigate = useNavigate();
  const { id } = useParams();
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
  const [existingImages, setExistingImages] = useState([]);
  const [reorderCounter, setReorderCounter] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
    fetchPost();
  }, [id]);

  useEffect(() => {
    return () => {
      imageItems.forEach(item => {
        if (item && item.preview) {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (formData.isPinned && errors.image) {
      setErrors(prev => ({
        ...prev,
        image: ''
      }));
    }
  }, [formData.isPinned, errors.image]);

  const fetchPost = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/posts/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const post = response.data;
      
      console.log('Post data:', post);
      console.log('Post images:', post.images);
      console.log('Post img:', post.img);
      
      setFormData({
        title: post.title,
        body: post.body,
        img: post.img,
        images: post.images || [],
        category: post.category?._id || '',
        isPinned: post.isPinned || false
      });
      
      let allImages = [];
      if (post.images && post.images.length > 0) {
        allImages = post.images;
      } else if (post.img) {
        allImages = [post.img];
      }
      
      console.log('All images to display:', allImages);
      setExistingImages(allImages);
      setIsLoading(false);
    } catch (error) {
      toast.error('Failed to fetch post details');
      navigate('/');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/categories/active`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories');
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
    
    setErrors(prev => ({
      ...prev,
      category: '',
      image: ''
    }));
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

  const removeExistingImage = (indexToRemove) => {
    const updatedImages = existingImages.filter((_, index) => index !== indexToRemove);
    setExistingImages(updatedImages);
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
    
    if (!formData.isPinned) {

      if (!formData.category) {
        newErrors.category = 'Category is required';
      }
      
      const totalImages = existingImages.length + imageItems.length;
      if (totalImages === 0) {
        newErrors.image = 'At least one image is required';
      }
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
      
      let newImageUrls = [];
      if (imageItems && imageItems.length > 0) {
        newImageUrls = await uploadImages();
      }
      
      const allImages = [...existingImages, ...newImageUrls];
      
      const token = localStorage.getItem('token');
      
      const postData = {
        title: formData.title,
        body: formData.body,
        isPinned: formData.isPinned
      };
      
      if (!formData.isPinned && formData.category) {
        postData.category = formData.category;
      }
      
      if (allImages.length > 0) {
        postData.images = allImages;
        postData.img = allImages[0];
      } else {

        if (!formData.isPinned) {

          throw new Error('Non-pinned posts require at least one image');
        }
        postData.images = [];
        postData.img = '';
      }
      
      console.log('Sending postData to backend:', postData);
      
      const response = await axios.put(`${API_BASE_URL}/api/posts/${id}`, postData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Post updated successfully!');
      

      const updatedPost = response.data;
      const postSlug = updatedPost.slug || updatedPost._id;
      navigate(`/post/${postSlug}`);
      
    } catch (error) {
      setErrors({ 
        general: error.response?.data?.error || 'Failed to update post. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="create-post-container">
        <p>Please log in to edit posts.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="create-post-container">
        <p>Loading post details...</p>
      </div>
    );
  }

  return (
    <div className="create-post-container">
      <form onSubmit={handleSubmit} className="create-post-form">
        <h2>Edit Post</h2>
        
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
          />
          {errors.title && <span className="error-text">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="body">Content</label>
          <textarea
            id="body"
            name="body"
            value={formData.body}
            onChange={handleChange}
            rows={10}
            placeholder="Write your post content here..."
            className={errors.body ? 'error' : ''}
          />
          {errors.body && <span className="error-text">{errors.body}</span>}
        </div>

        {user?.role === 'admin' && (
          <div className="form-group admin-pinned">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isPinned}
                onChange={(e) => handlePinnedChange(e.target.checked)}
              />
              <span className="checkbox-custom"></span>
              Pin this post (admins only)
            </label>
            <p className="pin-description">Pinned posts don't require categories or images</p>
          </div>
        )}

        {!formData.isPinned && (
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={errors.category ? 'error' : ''}
            >
              <option value="">Select a category</option>
              {categories
                .filter(category => category.title.toLowerCase() !== 'important')
                .map(category => (
                  <option key={category._id} value={category._id}>
                    {category.title}
                  </option>
                ))}
            </select>
            {errors.category && <span className="error-text">{errors.category}</span>}
          </div>
        )}

        <div className="form-group">
          <label>Images</label>
          {formData.isPinned && (
            <p className="pin-image-note">Images are optional for pinned posts</p>
          )}
          
          {existingImages.length > 0 && (
            <div className="existing-images">
              <h4>Current Images:</h4>
              <div className="image-preview-grid">
                {existingImages.map((imageUrl, index) => (
                  <div key={index} className="image-preview-item">
                    <img 
                      src={imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`}
                      alt={`Existing ${index + 1}`}
                      className="preview-image"
                      onError={(e) => {
                        console.error('Failed to load image:', imageUrl);
                        e.target.style.display = 'none';
                      }}
                      onLoad={(e) => {
                        e.target.style.display = 'block';
                      }}
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeExistingImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="add-new-images">
            <h4>Add New Images:</h4>
            <input
              key={`file-input-${imageItems.length}-${Date.now()}`}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="file-input"
            />
          </div>
          
          {imageItems.length > 0 && (
            <ImageManager
              images={imageItems}
              imageItems={imageItems}
              onRemove={removeImage}
              onReorder={reorderImages}
              reorderCounter={reorderCounter}
            />
          )}
          
          {errors.image && <span className="error-text">{errors.image}</span>}
        </div>

        <button 
          type="submit" 
          className="btn btn-primary btn-full" 
          disabled={isSubmitting || isUploading}
        >
          {isSubmitting ? 'Updating...' : isUploading ? 'Uploading Images...' : 'Update Post'}
        </button>
      </form>
    </div>
  );
}

export default EditPost;
