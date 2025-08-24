import React, { useState } from 'react';
import PopularPosts from './PopularPosts';

function PopularPostsSection({ user }) {
  const [showPopularPosts, setShowPopularPosts] = useState(window.innerWidth > 768);

  return (
    <div className="popular-posts-section">
      <div className="section-toggle" onClick={() => setShowPopularPosts(!showPopularPosts)}>
        <h3>Popular Posts</h3>
        <svg className={`toggle-icon ${showPopularPosts ? 'expanded' : ''}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </div>
      <div className={`section-content ${showPopularPosts ? 'expanded' : 'collapsed'}`}>
        <PopularPosts user={user} />
      </div>
    </div>
  );
}

export default PopularPostsSection;
