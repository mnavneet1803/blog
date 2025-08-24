import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from './config';

function CommentSection({ postId, user, onCommentCountChange }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (postId) {
      // Reset comments when postId changes
      setComments([]);
      setNewComment('');
      setReplyingTo(null);
      setReplyText('');
      setEditingComment(null);
      setEditText('');
      
      fetchComments();
    }
  }, [postId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Cleanup function to reset state when component unmounts
  useEffect(() => {
    return () => {
      setComments([]);
      setNewComment('');
      setReplyingTo(null);
      setReplyText('');
      setEditingComment(null);
      setEditText('');
    };
  }, []);

  const countAllComments = (commentsList) => {
    let total = commentsList.length;
    commentsList.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        total += comment.replies.length;
      }
    });
    return total;
  };

  const updateCommentCount = (commentsList) => {
    const totalCount = countAllComments(commentsList);
    if (onCommentCountChange) {
      onCommentCountChange(totalCount);
    }
  };

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      console.log('Fetching comments for postId:', postId);
      const response = await axios.get(`${API_BASE_URL}/api/comments/post/${postId}`, { headers });
      console.log('Comments API response:', response.data);
      
      const commentsData = response.data.comments || response.data || [];
      console.log('Parsed comments data:', commentsData);
      
      setComments(commentsData);
      updateCommentCount(commentsData);
    } catch (error) {
      console.error('Error fetching comments:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.warning('Please log in to comment');
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/comments`,
        {
          content: newComment,
          postId: postId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const updatedComments = [response.data.comment, ...comments];
      setComments(updatedComments);
      updateCommentCount(updatedComments);
      setNewComment('');
      toast.success('Comment posted successfully!');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (e, parentCommentId) => {
    e.preventDefault();
    if (!user) {
      toast.warning('Please log in to reply');
      return;
    }
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/comments`,
        {
          content: replyText,
          postId: postId,
          parentCommentId: parentCommentId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const updatedComments = comments.map(comment => 
        comment._id === parentCommentId
          ? { ...comment, replies: [...(comment.replies || []), response.data.comment] }
          : comment
      );
      setComments(updatedComments);
      updateCommentCount(updatedComments);
      setReplyText('');
      setReplyingTo(null);
      toast.success('Reply posted successfully!');
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (e, commentId) => {
    e.preventDefault();
    if (!editText.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/comments/${commentId}`,
        { content: editText },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setComments(comments.map(comment => {
        if (comment._id === commentId) {
          return response.data.comment;
        } else if (comment.replies && comment.replies.some(reply => reply._id === commentId)) {
          return {
            ...comment,
            replies: comment.replies.map(reply => 
              reply._id === commentId ? response.data.comment : reply
            )
          };
        }
        return comment;
      }));

      setEditingComment(null);
      setEditText('');
      toast.success('Comment updated successfully!');
    } catch (error) {
      console.error('Error editing comment:', error);
      toast.error('Failed to edit comment. Please try again.');
    }
  };

  const confirmDelete = (commentId) => {
    toast.warn(
      <div>
        <p>Are you sure you want to delete this comment?</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button 
            onClick={() => {
              toast.dismiss();
              handleDeleteComment(commentId);
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
            onClick={() => toast.dismiss()}
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
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/comments/${commentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const updatedComments = comments.map(comment => {
        if (comment._id === commentId) {
          return null;
        } else if (comment.replies && comment.replies.some(reply => reply._id === commentId)) {
          return {
            ...comment,
            replies: comment.replies.filter(reply => reply._id !== commentId)
          };
        }
        return comment;
      }).filter(comment => comment !== null);

      setComments(updatedComments);
      updateCommentCount(updatedComments);
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment. Please try again.');
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!user) {
      toast.warning('Please log in to like comments');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/comments/${commentId}/like`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setComments(comments.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            isLiked: response.data.isLiked,
            likes: Array(response.data.likesCount).fill(null)
          };
        }
        
        if (comment.replies && comment.replies.length > 0) {
          const updatedReplies = comment.replies.map(reply => {
            if (reply._id === commentId) {
              return {
                ...reply,
                isLiked: response.data.isLiked,
                likes: Array(response.data.likesCount).fill(null)
              };
            }
            return reply;
          });
          return { ...comment, replies: updatedReplies };
        }
        
        return comment;
      }));
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = currentTime;
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else {
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
          return `${diffInDays}d ago`;
        } else {
          return date.toLocaleDateString();
        }
      }
    }
  };

  return (
    <div className="comment-section">
      <h3>Comments ({countAllComments(comments)})</h3>
      
      {user && (
        <form onSubmit={handleSubmitComment} className="comment-form">
          <div className="comment-input-container">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="comment-input"
              rows="3"
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary comment-submit"
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="loading">Loading comments...</div>
      ) : (
        <div className="comments-list">
          {comments.map(comment => (
            <div key={comment._id} className="comment">
              <div className="comment-header">
                <div className="comment-meta">
                  <span className="comment-author">
                    {comment.user.firstName} {comment.user.lastName}
                  </span>
                  <span className="comment-date">{formatDate(comment.createdAt)}</span>
                  {comment.isEdited && <span className="edited-badge">(edited)</span>}
                </div>
              </div>
              
              <div className="comment-content">
                {editingComment === comment._id ? (
                  <form onSubmit={(e) => handleEditComment(e, comment._id)}>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="comment-input"
                      rows="3"
                    />
                    <div className="comment-edit-actions">
                      <button type="submit" className="btn btn-sm btn-primary">Save</button>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setEditingComment(null);
                          setEditText('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="comment-text">{comment.content}</p>
                )}
              </div>              <div className="comment-actions modern-comment-actions">
                <button 
                  className={`modern-comment-btn ${comment.isLiked === true ? 'liked' : ''}`}
                  onClick={() => handleLikeComment(comment._id)}
                  disabled={!user}
                >
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span className="btn-count">{comment.likes?.length || 0}</span>
                </button>

                {user && (
                  <button 
                    className="modern-comment-btn reply-btn"
                    onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                  >
                    <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                    </svg>
                    <span>Reply</span>
                  </button>
                )}

                {user && user._id === comment.user._id && (
                  <>
                    <button 
                      className="modern-comment-btn edit-btn"
                      onClick={() => {
                        setEditingComment(comment._id);
                        setEditText(comment.content);
                      }}
                    >
                      <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                      </svg>
                      <span>Edit</span>
                    </button>
                    <button 
                      className="modern-comment-btn delete-btn"
                      onClick={() => confirmDelete(comment._id)}
                    >
                      <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>

              {replyingTo === comment._id && user && (
                <form onSubmit={(e) => handleSubmitReply(e, comment._id)} className="reply-form">
                  <div className="comment-input-container">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="comment-input"
                      rows="2"
                    />
                  </div>
                  <div className="reply-actions modern-reply-actions">
                    <button 
                      type="submit" 
                      className="modern-action-btn primary"
                      disabled={isSubmitting || !replyText.trim()}
                    >
                      <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                      </svg>
                      <span>{isSubmitting ? 'Replying...' : 'Reply'}</span>
                    </button>
                    <button 
                      type="button" 
                      className="modern-action-btn secondary"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                    >
                      <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              )}

              {comment.replies && comment.replies.length > 0 && (
                <div className="replies">
                  {comment.replies.map(reply => (
                    <div key={reply._id} className="reply">
                      <div className="comment-header">
                        <div className="comment-meta">
                          <span className="comment-author">
                            {reply.user.firstName} {reply.user.lastName}
                          </span>
                          <span className="comment-date">{formatDate(reply.createdAt)}</span>
                          {reply.isEdited && <span className="edited-badge">(edited)</span>}
                        </div>
                      </div>
                      <div className="comment-content">
                        {editingComment === reply._id ? (
                          <form onSubmit={(e) => handleEditComment(e, reply._id)}>
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="comment-input"
                              rows="3"
                            />
                            <div className="comment-edit-actions modern-reply-actions">
                              <button type="submit" className="modern-action-btn primary">
                                <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                </svg>
                                <span>Save</span>
                              </button>
                              <button 
                                type="button" 
                                className="modern-action-btn secondary"
                                onClick={() => {
                                  setEditingComment(null);
                                  setEditText('');
                                }}
                              >
                                <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                                <span>Cancel</span>
                              </button>
                            </div>
                          </form>
                        ) : (
                          <p className="comment-text">{reply.content}</p>
                        )}
                      </div>
                      <div className="comment-actions modern-comment-actions">
                        <button 
                          className={`modern-comment-btn ${reply.isLiked === true ? 'liked' : ''}`}
                          onClick={() => handleLikeComment(reply._id)}
                          disabled={!user}
                        >
                          <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                          <span className="btn-count">{reply.likes?.length || 0}</span>
                        </button>
                        
                        {user && user._id === reply.user._id && (
                          <>
                            <button 
                              className="modern-comment-btn edit-btn"
                              onClick={() => {
                                setEditingComment(reply._id);
                                setEditText(reply.content);
                              }}
                            >
                              <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                              </svg>
                              <span>Edit</span>
                            </button>
                            <button 
                              className="modern-comment-btn delete-btn"
                              onClick={() => confirmDelete(reply._id)}
                            >
                              <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                              </svg>
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!user && (
        <div className="login-prompt">
          <p>Please log in to comment on this post.</p>
        </div>
      )}
    </div>
  );
}

export default CommentSection;
