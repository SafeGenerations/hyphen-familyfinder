// ===== RelationshipDragHandle.js - COMPLETE FILE =====
// src/src-modern/components/Shapes/Relationship/RelationshipDragHandle.js
import React, { useState } from 'react';

const RelationshipDragHandle = ({ x1, y1, x2, y2, relationship, onDrag, isSelected, color, lineWidth }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  // Calculate middle point of the line
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  // Calculate angle for the handle orientation
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
  
  const handlePointerDown = (e) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    
    setIsDragging(true);
    onDrag(e, true);
  };
  
  return (
    <g 
      transform={`translate(${midX}, ${midY}) rotate(${angle})`}
      style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
      onPointerDown={handlePointerDown}
    >
      {/* Invisible larger hit area */}
      <rect
        x="-20"
        y="-15"
        width="40"
        height="30"
        fill="transparent"
      />
      
      {/* Visible drag handle */}
      <rect
        x="-12"
        y="-6"
        width="24"
        height="12"
        rx="3"
        fill="white"
        stroke={isSelected ? '#3b82f6' : color}
        strokeWidth={lineWidth}
        opacity={isDragging ? "1" : "0.8"}
      />
      
      {/* Grip dots */}
      <text
        x="0"
        y="3"
        textAnchor="middle"
        style={{ 
          fontSize: '8px', 
          fill: isSelected ? '#3b82f6' : color,
          pointerEvents: 'none',
          userSelect: 'none',
          fontWeight: '600'
        }}
      >
        ⋯
      </text>
    </g>
  );
};

export default RelationshipDragHandle;