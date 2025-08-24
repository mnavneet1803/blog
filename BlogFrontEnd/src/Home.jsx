import React, { useState } from 'react';
import PopularPosts from './PopularPosts';
import CategorySection from './CategorySection';
import MainContent from './MainContent';

function Home({ user }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCategories, setShowCategories] = useState(window.innerWidth > 768);
  const [showPopularPosts, setShowPopularPosts] = useState(window.innerWidth > 768);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleToggleCategories = () => {
    setShowCategories(!showCategories);
  };

  const handleTogglePopularPosts = () => {
    setShowPopularPosts(!showPopularPosts);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="home-layout">
      <div className="sidebar">
        <CategorySection 
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          showCategories={showCategories}
          onToggleCategories={handleToggleCategories}
        />

        <div className="popular-posts-section">
          <div className="section-toggle" onClick={handleTogglePopularPosts}>
            <h3>Popular Posts</h3>
            <svg className={`toggle-icon ${showPopularPosts ? 'expanded' : ''}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </div>
          <div className={`section-content ${showPopularPosts ? 'expanded' : 'collapsed'}`}>
            <PopularPosts user={user} />
          </div>
        </div>
      </div>
      
      <MainContent 
        user={user}
        selectedCategory={selectedCategory}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />

      <div className="sidebar right-sidebar">
        <PopularPosts user={user} />
      </div>
    </div>
  );
}

export default Home;