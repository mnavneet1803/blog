import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from './config';

function LikeButton({ postId, initialLikesCount, initialIsLiked, user }) {
  const [likesCount, setLikesCount] = useState(initialLikesCount || 0);
  const [isLiked, setIsLiked] = useState(initialIsLiked || false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast.warning('Please log in to like posts');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/likes/post/${postId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setIsLiked(response.data.isLiked);
      setLikesCount(response.data.likesCount);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to toggle like. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="like-button-container">
      <button 
        className={`like-button modern-stat-item ${isLiked ? 'liked' : ''}`}
        onClick={handleLike}
        disabled={isLoading}
      >
        <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <span className="stat-count">{likesCount}</span>
      </button>
    </div>
  );
}

export default LikeButton;
