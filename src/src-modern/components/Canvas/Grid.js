// ===== Grid.js - COMPLETE FILE =====
// src/src-modern/components/Canvas/Grid.js
import React from 'react';
import { useResponsive, getGridSize } from '../../utils/responsive';

const Grid = () => {
  const { breakpoint } = useResponsive();
  const gridSize = getGridSize(breakpoint);
  
  // Create grid pattern
  const patternId = 'grid-pattern';
  
  // Adjust grid appearance based on screen size
  const strokeWidth = breakpoint === 'xs' ? 0.3 : 0.5;
  const opacity = breakpoint === 'xs' ? 0.15 : 0.2;
  
  return (
    <g style={{ pointerEvents: 'none' }}>
      <defs>
        <pattern
          id={patternId}
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          {/* Horizontal line */}
          <line
            x1="0"
            y1={gridSize}
            x2={gridSize}
            y2={gridSize}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            opacity={opacity}
            className="grid-line"
          />
          {/* Vertical line */}
          <line
            x1={gridSize}
            y1="0"
            x2={gridSize}
            y2={gridSize}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            opacity={opacity}
            className="grid-line"
          />
          
          {/* Major grid lines every 5 cells */}
          {gridSize === 20 && (
            <>
              <line
                x1="0"
                y1="0"
                x2={gridSize}
                y2="0"
                stroke="#e5e7eb"
                strokeWidth={strokeWidth * 1.5}
                opacity={opacity * 1.5}
                className="grid-line"
                strokeDasharray="1,0"
              />
              <line
                x1="0"
                y1="0"
                x2="0"
                y2={gridSize}
                stroke="#e5e7eb"
                strokeWidth={strokeWidth * 1.5}
                opacity={opacity * 1.5}
                className="grid-line"
                strokeDasharray="1,0"
              />
            </>
          )}
        </pattern>
        
        {/* Major grid pattern */}
        <pattern
          id={`${patternId}-major`}
          width={gridSize * 5}
          height={gridSize * 5}
          patternUnits="userSpaceOnUse"
        >
          <rect
            width={gridSize * 5}
            height={gridSize * 5}
            fill={`url(#${patternId})`}
          />
          {/* Major grid lines */}
          <line
            x1="0"
            y1="0"
            x2={gridSize * 5}
            y2="0"
            stroke="#d1d5db"
            strokeWidth={strokeWidth * 2}
            opacity={opacity * 1.5}
            className="grid-line"
          />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2={gridSize * 5}
            stroke="#d1d5db"
            strokeWidth={strokeWidth * 2}
            opacity={opacity * 1.5}
            className="grid-line"
          />
        </pattern>
      </defs>
      
      {/* Apply grid pattern to large rect */}
      <rect
        x="-10000"
        y="-10000"
        width="20000"
        height="20000"
        fill={`url(#${patternId}-major)`}
        className="grid-background"
      />
    </g>
  );
};

export default Grid;