import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from './config';
import LikeButton from './LikeButton';
import ImageCarousel from './ImageCarousel';
import ShareButton from './ShareButton';

function MainContent({ user, selectedCategory, searchTerm, onSearchChange }) {
  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]); // For search functionality
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchCurrentPage, setSearchCurrentPage] = useState(1);
  const postsPerPage = 5;

  const highlightText = (text, searchTerm) => {
    if (!searchTerm.trim() || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="search-highlight">{part}</mark> : 
        part
    );
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, currentPage]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        fetchAllPosts();
      } else {
        setAllPosts([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [selectedCategory]);

  useEffect(() => {
    setSearchCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (!isLoading && posts.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [posts, isLoading]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      let url = `${API_BASE_URL}/api/posts?page=${currentPage}&limit=5`;
      if (selectedCategory) {
        url += `&category=${selectedCategory}`;
      }
      const response = await axios.get(url, { headers });
      
      setPosts(response.data.posts);
      setPagination(response.data.pagination);
    } catch (error) {
      setError('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllPosts = async () => {
    try {
      setIsSearching(true);
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      let url = `${API_BASE_URL}/api/posts?limit=10000`; 
      if (selectedCategory) {
        url += `&category=${selectedCategory}`;
      }
      const response = await axios.get(url, { headers });
      
      setAllPosts(response.data.posts || []);
    } catch (error) {
      console.error('Search fetch error:', error);
      setError('Failed to load posts for search');
      setAllPosts(posts);
    } finally {
      setIsSearching(false);
    }
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

  const filteredPosts = searchTerm.trim() ? 
    allPosts.filter(post => {
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = post.title.toLowerCase().includes(searchLower);
      const bodyMatch = post.body.toLowerCase().includes(searchLower);
      const authorMatch = (post.user && post.user.firstName && post.user.lastName) && 
        (`${post.user.firstName} ${post.user.lastName}`.toLowerCase().includes(searchLower));
      const usernameMatch = (post.author && post.author.username) && 
        post.author.username.toLowerCase().includes(searchLower);
      const categoryMatch = (post.category && post.category.title) && 
        post.category.title.toLowerCase().includes(searchLower);
      
      return titleMatch || bodyMatch || authorMatch || usernameMatch || categoryMatch;
    }) : 
    posts;

  const totalSearchPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (searchCurrentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = searchTerm.trim() ? 
    filteredPosts.slice(startIndex, endIndex) : 
    posts;

  const handlePageChange = (newPage) => {
    if (searchTerm.trim()) {
      if (newPage >= 1 && newPage <= totalSearchPages) {
        setSearchCurrentPage(newPage);
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    } else {
      if (newPage >= 1 && newPage <= pagination.totalPages) {
        setCurrentPage(newPage);
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    }
  };

  const renderPaginationButtons = () => {
    const isSearchMode = searchTerm.trim();
    const totalPages = isSearchMode ? totalSearchPages : pagination.totalPages;
    const currentPageNum = isSearchMode ? searchCurrentPage : currentPage;
    
    if (totalPages <= 1) return null;

    const buttons = [];
    
    if (currentPageNum > 1) {
      buttons.push(
        <button 
          key="prev" 
          onClick={() => handlePageChange(currentPageNum - 1)} 
          className="page-btn prev-btn"
        >
          ‹ Previous
        </button>
      );
    }

    const startPage = Math.max(1, currentPageNum - 2);
    const endPage = Math.min(totalPages, currentPageNum + 2);

    if (startPage > 1) {
      buttons.push(
        <button key={1} onClick={() => handlePageChange(1)} className="page-btn">
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(<span key="ellipsis1" className="pagination-ellipsis">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`page-btn ${i === currentPageNum ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="ellipsis2" className="pagination-ellipsis">...</span>);
      }
      buttons.push(
        <button key={totalPages} onClick={() => handlePageChange(totalPages)} className="page-btn">
          {totalPages}
        </button>
      );
    }

    if (currentPageNum < totalPages) {
      buttons.push(
        <button 
          key="next" 
          onClick={() => handlePageChange(currentPageNum + 1)} 
          className="page-btn next-btn"
        >
          Next ›
        </button>
      );
    }

    return buttons;
  };

  if (error) {
    return (
      <div className="main-content">
        <div className="home-container">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="home-container">
        {user && <h1>Hello, {user.firstName}!</h1>}
        
        <div className="search-section">
          <div className="search-container">
            <div className="search-input-wrapper">
              <svg className="search-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                placeholder="Search posts by title, author, or content..."
                value={searchTerm}
                onChange={onSearchChange}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search" 
                  onClick={() => onSearchChange({ target: { value: '' } })}
                  type="button"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="posts-container">
          {searchTerm && (
            <div className="search-results-info">
              {filteredPosts.length === 0 ? (
                <p>No posts found for "<strong>{searchTerm}</strong>"</p>
              ) : (
                <p>Found {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} for "<strong>{searchTerm}</strong>"</p>
              )}
            </div>
          )}
          
          {(isLoading || (searchTerm.trim() && isSearching)) ? (
            <div className="loading">
              {searchTerm.trim() ? 'Searching posts...' : 'Loading posts...'}
            </div>
          ) : currentPosts.length === 0 && !searchTerm ? (
            <div className="no-posts">
              <p>No posts found. {selectedCategory ? 'Try selecting a different category.' : 'Be the first to create one!'}</p>
            </div>
          ) : currentPosts.length === 0 && searchTerm ? (
            <div className="no-posts">
              <p>No posts found for your search. Try different keywords.</p>
            </div>
          ) : (
            currentPosts.map(post => (
              <div key={post._id} className={`post-card ${post.isPinned ? 'pinned-post' : ''}`}>
                {post.isPinned && (
                  <div className="pinned-badge">
                    <svg className="pin-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,4V6H12V4H8V6L12,10L16,6V4H14M12,2H16A2,2 0 0,1 18,4V8L12,14L6,8V4A2,2 0 0,1 8,2H12Z"/>
                    </svg>
                    Pinned
                  </div>
                )}
                
                {(post.images && post.images.length > 0) ? (
                  <div className="post-image-container">
                    <ImageCarousel 
                      images={post.images.map(img => `${API_BASE_URL}${img}`)} 
                      alt={post.title}
                      showThumbnails={false}
                    />
                  </div>
                ) : post.img && (
                  <div className="post-image-container">
                    <ImageCarousel 
                      images={[`${API_BASE_URL}${post.img}`]} 
                      alt={post.title}
                      showThumbnails={false}
                    />
                  </div>
                )}
                
                <Link to={`/post/${post.slug || post._id}`} className="post-card-link">
                  <div className="post-header">
                    <h2>{highlightText(post.title, searchTerm)}</h2>
                    <div className="post-meta">
                      <span>By {highlightText(`${post.user.firstName} ${post.user.lastName}`, searchTerm)}</span>
                      <span>{formatDate(post.createdAt)}</span>
                      {post.category && (
                        <span className="post-category">{highlightText(post.category.title, searchTerm)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="post-body">
                    <p>{highlightText(post.body.length > 200 ? post.body.substring(0, 200) + '...' : post.body, searchTerm)}</p>
                    {post.body.length > 30 && (
                      <span className="read-more">
                        Read More
                      </span>
                    )}
                  </div>
                </Link>
                
                <div className="post-actions">
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
                  <ShareButton post={post} />
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Pagination */}
        {!isLoading && !(searchTerm.trim() && isSearching) && ((!searchTerm && pagination.totalPages > 1) || (searchTerm && totalSearchPages > 1)) && (
          <div className="pagination-container">
            <div className="pagination-info">
              {searchTerm ? (
                <span>
                  Showing {((searchCurrentPage - 1) * postsPerPage) + 1} to {Math.min(searchCurrentPage * postsPerPage, filteredPosts.length)} of {filteredPosts.length} search results
                </span>
              ) : (
                <span>
                  Showing {((currentPage - 1) * postsPerPage) + 1} to {Math.min(currentPage * postsPerPage, pagination.totalPosts)} of {pagination.totalPosts} posts
                </span>
              )}
            </div>
            <div className="pagination-buttons">
              {renderPaginationButtons()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainContent;
