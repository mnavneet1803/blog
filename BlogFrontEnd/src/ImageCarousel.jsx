import React, { useState, useEffect } from 'react';
import './ImageCarousel.css';

const ImageCarousel = ({ images, alt = "Post image", showThumbnails = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length === 0) {
      setCurrentIndex(0);
      return;
    }

    setCurrentIndex(0);
  }, [images]);

  if (!images || images.length === 0) {
    return null;
  }

  if (images.length === 1) {
    return (
      <div className="single-image-container" onClick={(e) => e.stopPropagation()}>
        <img src={images[0]} alt={alt} className="single-image" />
      </div>
    );
  }

  const goToPrevious = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (images && images.length > 0) {
      setCurrentIndex((prevIndex) => 
        prevIndex === 0 ? images.length - 1 : prevIndex - 1
      );
    }
  };

  const goToNext = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (images && images.length > 0) {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const goToSlide = (index, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (images && index >= 0 && index < images.length) {
      setCurrentIndex(index);
    }
  };

  return (
    <div className="image-carousel" onClick={(e) => e.stopPropagation()}>
      <div className="carousel-container">
        <button 
          className="carousel-btn prev-btn" 
          onClick={goToPrevious}
          aria-label="Previous image"
        >
          ❮
        </button>
        
        <div className="carousel-image-container">
          {images[currentIndex] && (
            <img 
              src={images[currentIndex]} 
              alt={`${alt} ${currentIndex + 1}`}
              className="carousel-image"
            />
          )}
        </div>
        
        <button 
          className="carousel-btn next-btn" 
          onClick={goToNext}
          aria-label="Next image"
        >
          ❯
        </button>
      </div>
      
      <div className="carousel-indicators">
        <div className="image-counter">
          {currentIndex + 1} of {images.length}
        </div>
        
        <div className="carousel-dots">
          {images.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={(e) => goToSlide(index, e)}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>
      
      {images.length > 1 && showThumbnails && (
        <div className="carousel-thumbnails">
          {images.map((image, index) => (
            <button
              key={index}
              className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
              onClick={(e) => goToSlide(index, e)}
            >
              <img src={image} alt={`Thumbnail ${index + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
