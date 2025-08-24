import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from './config';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';
import ImageCarousel from './ImageCarousel';
import ShareButton from './ShareButton';

function PostDetail({ user }) {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentsCount, setCommentsCount] = useState(0);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        let response;
        try {
          response = await axios.get(`${API_BASE_URL}/api/posts/slug/${slug}`, { headers });
        } catch (slugError) {
          response = await axios.get(`${API_BASE_URL}/api/posts/${slug}`, { headers });
        }
        setPost(response.data);
        setCommentsCount(response.data.commentsCount || 0);
      } catch (error) {
        setError('Post not found');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const handleCommentCountChange = (newCount) => {
    setCommentsCount(newCount);
  };

  if (isLoading) {
    return <div className="loading">Loading post...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!post) {
    return <div className="error">Post not found</div>;
  }

  return (
    <div className="post-detail">
      {(post.images && post.images.length > 0) ? (
        <ImageCarousel 
          images={post.images.map(img => `${API_BASE_URL}${img}`)} 
          alt={post.title}
          showThumbnails={true}
        />
      ) : post.img && (
        <ImageCarousel 
          images={[`${API_BASE_URL}${post.img}`]} 
          alt={post.title}
          showThumbnails={true}
        />
      )}
      <div className="post-detail-content">
        <h1 className="post-detail-title">{post.title}</h1>
        <div className="post-detail-meta">
          <span>By {post.user?.firstName} {post.user?.lastName}</span>
          <span> • </span>
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          {post.category && (
            <>
              <span> • </span>
              <span className="post-category">{post.category.title}</span>
            </>
          )}
        </div>
        <div className="post-detail-body">
          {post.body.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        
        <div className="post-actions modern-actions">
          <LikeButton 
            postId={post._id}
            initialLikesCount={post.likesCount}
            initialIsLiked={post.isLiked}
            user={user}
          />
          <div className="comment-count modern-stat-item comments">
            <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h11c.55 0 1-.45 1-1z"/>
            </svg>
            <span className="stat-count">{commentsCount}</span>
          </div>
          <ShareButton post={post} />
        </div>

        <CommentSection 
          key={post._id}
          postId={post._id} 
          user={user} 
          onCommentCountChange={handleCommentCountChange}
        />
        
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link to="/" className="btn btn-secondary">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

export default PostDetail;
