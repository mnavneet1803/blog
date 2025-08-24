import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from './config';
import LikeButton from './LikeButton';

function UserPosts({ user }) {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [paginatedPosts, setPaginatedPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 6
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredPagination, setFilteredPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 6
  });
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const postsPerPage = 6;
  
  const isAdmin = React.useMemo(() => {
    if (!user) return false;
    const role = user.role?.toLowerCase();
    return role === 'admin';
  }, [user]);

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        fetchAllPosts();
      } else {
        fetchUserPosts();
      }
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Debounced filter effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      filterPosts();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [posts, searchTerm, selectedCategory]);

  // Initialize filteredPosts when posts change and no filters are active
  useEffect(() => {
    if (!searchTerm.trim() && !selectedCategory) {
      setFilteredPosts(posts);
      setCurrentPage(1); // Reset to first page when posts change
    }
  }, [posts, searchTerm, selectedCategory]);

  // Update main pagination when posts array changes (e.g., after deletion)
  useEffect(() => {
    setPagination(prevPagination => ({
      ...prevPagination,
      totalPages: Math.ceil(posts.length / postsPerPage) || 1,
      totalPosts: posts.length,
      hasNextPage: posts.length > postsPerPage,
      hasPrevPage: prevPagination.currentPage > 1
    }));
  }, [posts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update pagination when filtered posts change
  useEffect(() => {
    updatePaginatedPosts();
  }, [filteredPosts, currentPage]);

  const fetchUserPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      // Fetch all posts for client-side filtering and pagination
      const response = await axios.get(
        `${API_BASE_URL}/api/posts/user/my-posts?page=1&limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setPosts(response.data.posts || []);
      // For initial state when no filtering
      setPagination({
        currentPage: 1,
        totalPages: Math.ceil((response.data.posts || []).length / postsPerPage),
        totalPosts: (response.data.posts || []).length,
        hasNextPage: (response.data.posts || []).length > postsPerPage,
        hasPrevPage: false,
        limit: postsPerPage
      });
    } catch (error) {
      console.error('Error fetching user posts:', error);
      setError('Failed to load your posts');
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      // Fetch all posts for client-side filtering and pagination
      const response = await axios.get(
        `${API_BASE_URL}/api/posts/admin/all?page=1&limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setPosts(response.data.posts || []);
      // For initial state when no filtering
      setPagination({
        currentPage: 1,
        totalPages: Math.ceil((response.data.posts || []).length / postsPerPage),
        totalPosts: (response.data.posts || []).length,
        hasNextPage: (response.data.posts || []).length > postsPerPage,
        hasPrevPage: false,
        limit: postsPerPage
      });
    } catch (error) {
      console.error('Error fetching admin posts:', error);
      setError('Failed to load posts');
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/categories/active`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const filterPosts = () => {
    let filtered = posts;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.body.toLowerCase().includes(searchLower) ||
        (post.category && post.category.title.toLowerCase().includes(searchLower))
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(post => 
        post.category && post.category._id === selectedCategory
      );
    }

    setFilteredPosts(filtered);
  };

  const updatePaginatedPosts = () => {
    const totalPosts = filteredPosts.length;
    const totalPages = Math.ceil(totalPosts / postsPerPage) || 1;
    
    // Ensure current page doesn't exceed total pages
    let validCurrentPage = currentPage;
    if (currentPage > totalPages) {
      validCurrentPage = Math.max(1, totalPages);
      setCurrentPage(validCurrentPage);
    }
    
    const startIndex = (validCurrentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const currentPagePosts = filteredPosts.slice(startIndex, endIndex);

    setPaginatedPosts(currentPagePosts);
    setFilteredPagination({
      currentPage: validCurrentPage,
      totalPages: totalPages,
      totalPosts: totalPosts,
      hasNextPage: validCurrentPage < totalPages,
      hasPrevPage: validCurrentPage > 1,
      limit: postsPerPage
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeletePost = async (postId) => {
    const confirmed = await new Promise((resolve) => {
      toast.warn(
        <div>
          <p>Are you sure you want to delete this post?</p>
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
      await axios.delete(`${API_BASE_URL}/api/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      toast.success('Post deleted successfully!');
      
      // Update posts by removing the deleted post
      setPosts(posts.filter(post => post._id !== postId));
    } catch (error) {
      toast.error('Failed to delete post. Please try again.');
    }
  };

  const handleTogglePostStatus = async (postId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/api/posts/${postId}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newStatus = currentStatus ? 'deactivated' : 'activated';
      toast.success(`Post ${newStatus} successfully`);
      
      // Update the post status in the posts array
      setPosts(posts.map(post => 
        post._id === postId 
          ? { ...post, isActive: !currentStatus }
          : post
      ));
    } catch (error) {
      console.error('Error toggling post status:', error);
      toast.error(error.response?.data?.error || 'Failed to update post status');
    }
  };

  const handlePageChange = (newPage) => {
    // Simple validation - just check if it's a positive number
    if (newPage >= 1) {
      setCurrentPage(newPage);
    }
  };

  const toggleDropdown = (postId) => {
    setOpenDropdown(openDropdown === postId ? null : postId);
  };

  const renderPagination = () => {
    const isFiltered = searchTerm.trim() || selectedCategory;
    const currentPagination = isFiltered ? filteredPagination : pagination;
    
    // Always show pagination info if we have posts, only hide navigation if single page
    if (currentPagination.totalPosts === 0) return null;

    const pages = [];
    const showPageNumbers = currentPagination.totalPages > 1;
    
    if (showPageNumbers) {
      for (let i = 1; i <= currentPagination.totalPages; i++) {
        pages.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            className={`page-number ${i === currentPage ? 'active' : ''}`}
          >
            {i}
          </button>
        );
      }
    }

    return (
      <div className="pagination">
        <div className="pagination-info">
          {showPageNumbers && (
            <div className="page-numbers">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="page-number"
              >
                Previous
              </button>
              {pages}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= currentPagination.totalPages}
                className="page-number"
              >
                Next
              </button>
            </div>
          )}
          <div className="page-info">
            {showPageNumbers ? (
              <>Page {currentPage} of {currentPagination.totalPages} ({currentPagination.totalPosts} total {isFiltered ? 'filtered ' : ''}posts)</>
            ) : (
              <>{currentPagination.totalPosts} {isFiltered ? 'filtered ' : ''}post{currentPagination.totalPosts !== 1 ? 's' : ''}</>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="user-posts-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="loading">{isAdmin ? 'Loading all posts...' : 'Loading your posts...'}</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="user-posts-container">
      <div className="user-posts-header">
        <h1>{isAdmin ? 'All Posts' : 'Your Posts'}</h1>
        <p>
          {pagination.totalPosts > 0 
            ? (() => {
                const isFiltered = searchTerm.trim() || selectedCategory;
                const currentPagination = isFiltered ? filteredPagination : pagination;
                const startIndex = ((currentPagination.currentPage - 1) * postsPerPage) + 1;
                const endIndex = Math.min(currentPagination.currentPage * postsPerPage, currentPagination.totalPosts);
                return `Showing ${startIndex} to ${endIndex} of ${currentPagination.totalPosts} post${currentPagination.totalPosts !== 1 ? 's' : ''}`;
              })()
            : 'No posts found'
          }
        </p>
        
        {/* Search and Filter Controls */}
        <div className="posts-controls">
          <div className="search-input-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              placeholder="Search by title, content, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search" 
                onClick={() => setSearchTerm('')}
                type="button"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            )}
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="no-posts">
          <p>
            {posts.length === 0 
              ? (isAdmin ? 'No posts found.' : 'You haven\'t created any posts yet.')
              : 'No posts match your current filters.'
            }
          </p>
          {!isAdmin && posts.length === 0 && (
            <Link to="/create-post" className="btn btn-primary">Create Your First Post</Link>
          )}
        </div>
      ) : (
        <div className="posts-grid">
          {paginatedPosts.map(post => (
            <div key={post._id} className="user-post-card">
              <div className="post-card-content">
                <div className="post-header">
                  <Link to={`/post/${post.slug || post._id}`}>
                    <h3>{post.title}</h3>
                  </Link>
                  <div className="post-meta">
                    <span>{formatDate(post.createdAt)}</span>
                    {post.category && (
                      <span className="post-category">{post.category.title}</span>
                    )}
                    {isAdmin && (
                      <>
                        <span className={`post-status ${post.isActive ? 'active' : 'inactive'}`}>
                          {post.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {post.user && (
                          <span className="post-author">
                            by {post.user.firstName} {post.user.lastName}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="post-image">
                  <img 
                    src={post.img ? `${API_BASE_URL}${post.img}` : '/dummy-post-image.svg'} 
                    alt={post.title}
                    className={!post.img ? 'dummy-image' : ''}
                    onError={(e) => {
                      // If the actual image fails to load, try the dummy image
                      if (post.img && e.target.src !== '/dummy-post-image.svg') {
                        e.target.src = '/dummy-post-image.svg';
                        e.target.classList.add('dummy-image');
                      } else if (!post.img && e.target.src !== '/dummy-post-image.svg') {
                        e.target.src = '/dummy-post-image.svg';
                        e.target.classList.add('dummy-image');
                      }
                    }}
                  />
                </div>
                
                <div className="post-body">
                  <p>{post.body.length > 150 ? post.body.substring(0, 150) + '...' : post.body}</p>
                </div>

                <div className="post-stats">
                  <div className="stats-inline-container">
                    <LikeButton 
                      postId={post._id}
                      initialLikesCount={post.likesCount}
                      initialIsLiked={post.isLiked}
                      user={user}
                    />
                    <Link to={`/post/${post.slug || post._id}`} className={`comment-link ${post.hasCommented ? 'commented' : ''}`}>
                      <div className={`comment-count modern-stat-item comments ${post.hasCommented ? 'commented' : ''}`}>
                        <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h11c.55 0 1-.45 1-1z"/>
                        </svg>
                        <span className="stat-count">{post.commentsCount || 0}</span>
                      </div>
                    </Link>
                    
                    {/* Actions Dropdown */}
                    <div 
                      className="post-actions-dropdown" 
                      ref={openDropdown === post._id ? dropdownRef : null}
                    >
                      <button 
                        className="dropdown-toggle"
                        onClick={() => toggleDropdown(post._id)}
                      >
                        <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                        <span className="stat-count">Actions</span>
                      </button>
                      
                      {openDropdown === post._id && (
                        <div className="dropdown-menu">
                          <Link to={`/post/${post.slug || post._id}`} className="dropdown-item">
                            <svg className="dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                            </svg>
                            View
                          </Link>
                          <Link to={`/edit-post/${post._id}`} className="dropdown-item">
                            <svg className="dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                            Edit
                          </Link>
                          <button 
                            onClick={() => {
                              handleDeletePost(post._id);
                              setOpenDropdown(null);
                            }}
                            className="dropdown-item delete"
                          >
                            <svg className="dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                            Delete
                          </button>
                          {isAdmin && (
                            <button 
                              onClick={() => {
                                handleTogglePostStatus(post._id, post.isActive);
                                setOpenDropdown(null);
                              }}
                              className="dropdown-item"
                            >
                              <svg className="dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                              </svg>
                              {post.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {renderPagination()}
    </div>
  );
}

export default UserPosts;
