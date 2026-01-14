// src/components/Canvas/GridBackground.js
import React from 'react';

const GridBackground = ({ gridSize, zoom, pan }) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.05,
        pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(to right, #94a3b8 1px, transparent 1px), 
          linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
        transform: `translate(${pan.x % (gridSize * zoom)}px, ${pan.y % (gridSize * zoom)}px)`,
        transformOrigin: '0 0'
      }}
    />
  );
};

export default GridBackground;