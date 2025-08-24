import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from './config';
import ImageCarousel from './ImageCarousel';

function PopularPosts({ user }) {
  const [popularPosts, setPopularPosts] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPopularPosts();
  }, [selectedPeriod]);

  const fetchPopularPosts = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await axios.get(
        `${API_BASE_URL}/api/posts/popular?period=${selectedPeriod}&limit=5`,
        { headers }
      );
      
      // Filter out any inactive posts as an extra safety measure
      const activePosts = response.data.filter(post => post.isActive !== false);
      setPopularPosts(activePosts);
    } catch (error) {
      console.error('Failed to load popular posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="popular-posts-section">
      <div className="popular-posts-header">
        <h3>Popular Posts</h3>
        <div className="period-selector">
          <button
            className={`period-btn ${selectedPeriod === 'day' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('day')}
          >
            Day
          </button>
          <button
            className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('week')}
          >
            Week
          </button>
          <button
            className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('month')}
          >
            Month
          </button>
        </div>
      </div>

      <div className="popular-posts-list">
        {isLoading ? (
          <div className="loading-popular">Loading popular posts...</div>
        ) : popularPosts.length === 0 ? (
          <div className="no-popular-posts">
            <p>No popular posts found for this period.</p>
          </div>
        ) : (
          popularPosts.map((post, index) => (
            <div key={post._id} className="popular-post-item">
              <div className="popular-post-rank">
                <span className="rank-number">#{index + 1}</span>
              </div>
              
              <Link to={`/post/${post.slug || post._id}`} className="popular-post-content">
                {(post.images && post.images.length > 0) ? (
                  <div className="popular-post-image">
                    <img 
                      src={`${API_BASE_URL}${post.images[0]}`} 
                      alt={post.title}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    {post.images.length > 1 && (
                      <div className="multiple-images-indicator">
                        +{post.images.length - 1}
                      </div>
                    )}
                  </div>
                ) : post.img && (
                  <div className="popular-post-image">
                    <img 
                      src={`${API_BASE_URL}${post.img}`} 
                      alt={post.title}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="popular-post-info">
                  <h4 className="popular-post-title">
                    {truncateText(post.title, 50)}
                  </h4>
                  
                  {post.body && (
                    <p className="popular-post-excerpt">
                      {truncateText(post.body, 80)}
                    </p>
                  )}
                  
                  <div className="popular-post-meta">
                    <div className="popular-post-stats">
                      <div className="stat-item likes">
                        <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        <span className="stat-count">{post.likesCount || 0}</span>
                      </div>
                      <div className="stat-item comments">
                        <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h11c.55 0 1-.45 1-1z"/>
                        </svg>
                        <span className="stat-count">{post.commentsCount || 0}</span>
                      </div>
                    </div>
                    <div className="popular-post-date">
                      {formatDate(post.createdAt)}
                    </div>
                  </div>
                  
                  <div className="popular-post-author">
                    By {post.user.firstName} {post.user.lastName}
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default PopularPosts;
