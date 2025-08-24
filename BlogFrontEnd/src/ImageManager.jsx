import React, { useState } from 'react';
import './ImageManager.css';

const ImageManager = ({ images, imageItems, onRemove, onReorder }) => {
  const [draggedIndex, setDraggedIndex] = useState(null);

  const itemsToRender = imageItems || images || [];

  if (itemsToRender.length === 0) {
    return null;
  }

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    if (onReorder) {
      onReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="image-manager">
      <div className="image-manager-header">
        <h4>Selected Images ({itemsToRender.length})</h4>
        <p className="image-manager-hint">
          Drag to reorder • Click × to remove
        </p>
      </div>
      
      <div className="image-manager-grid">
        {itemsToRender.map((item, index) => (
          <div
            key={item.id}
            className={`image-manager-item ${draggedIndex === index ? 'dragging' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            <div className="image-manager-preview">
              <img src={item.preview || item} alt={`Selected ${index + 1}`} />
              <div className="image-manager-overlay">
                <button
                  type="button"
                  className="image-remove-btn"
                  onClick={() => onRemove(index)}
                  title="Remove image"
                >
                  ×
                </button>
                <div className="image-order-number">
                  {index + 1}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageManager;
