// ===== HouseholdDrawing.js - COMPLETE FILE =====
// src/src-modern/components/Canvas/HouseholdDrawing.js
import React from 'react';

const HouseholdDrawing = ({ points, isFinished = false }) => {
  if (!points || points.length === 0) return null;
  
  // Create smooth bezier curve path from points (same logic as Household.js)
  const createSmoothPath = (points, smoothness = 0.25) => {
    if (points.length < 3) {
      // Fallback to simple path for insufficient points
      return points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ') + (points.length > 2 ? ' Z' : '');
    }
    
    // Start the path at the first point
    let path = `M ${points[0].x} ${points[0].y}`;
    
    // Create smooth curves between all points
    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const next = points[(i + 1) % points.length];
      const prev = points[(i - 1 + points.length) % points.length];
      const afterNext = points[(i + 2) % points.length];
      
      // Calculate control points for smooth bezier curves
      const cp1x = current.x + (next.x - prev.x) * smoothness;
      const cp1y = current.y + (next.y - prev.y) * smoothness;
      const cp2x = next.x - (afterNext.x - current.x) * smoothness;
      const cp2y = next.y - (afterNext.y - current.y) * smoothness;
      
      // Add cubic bezier curve to the next point
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    
    return path;
  };
  
  // Create both smooth and simple path data
  const smoothPath = isFinished && points.length >= 3 ? createSmoothPath(points) : null;
  const simplePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ') + (isFinished ? ' Z' : '');
  
  // Use smooth curves for finished shapes, simple lines while drawing
  const finalPath = smoothPath || simplePath;
  
  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Preview path - now with smooth curves when finished! */}
      <path
        d={finalPath}
        fill={isFinished ? 'rgba(99, 102, 241, 0.1)' : 'none'}
        stroke="#6366f1"
        strokeWidth="2"
        strokeDasharray="5,5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      
      {/* Points */}
      {points.map((point, index) => {
        const isFirstPoint = index === 0;
        return (
          <g key={index}>
            {/* Point marker */}
            <circle
              cx={point.x}
              cy={point.y}
              r={isFirstPoint ? 8 : 6}
              fill="#ffffff"
              stroke={isFirstPoint ? "#10b981" : "#6366f1"}
              strokeWidth={isFirstPoint ? 3 : 2}
            />
            
            {/* Point number */}
            <text
              x={point.x}
              y={point.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill={isFirstPoint ? "#10b981" : "#6366f1"}
              fontWeight="bold"
              style={{ userSelect: 'none' }}
            >
              {index + 1}
            </text>
          </g>
        );
      })}
      
      {/* Instructions */}
      {points.length > 0 && !isFinished && (
        <text
          x={points[points.length - 1].x + 15}
          y={points[points.length - 1].y - 15}
          fontSize="12"
          fill="#64748b"
          style={{ userSelect: 'none' }}
        >
          {points.length < 3 
            ? 'Click to add points' 
            : 'Click near start to close or continue adding'}
        </text>
      )}
      
      {/* Close hint when near first point */}
      {points.length >= 3 && !isFinished && (
        <g>
          {(() => {
            const lastPoint = points[points.length - 1];
            const firstPoint = points[0];
            const distance = Math.sqrt(
              Math.pow(lastPoint.x - firstPoint.x, 2) + 
              Math.pow(lastPoint.y - firstPoint.y, 2)
            );
            
            if (distance < 30) {
              return (
                <g>
                  <circle
                    cx={firstPoint.x}
                    cy={firstPoint.y}
                    r="12"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="3,3"
                  />
                  <text
                    x={firstPoint.x + 20}
                    y={firstPoint.y - 20}
                    fontSize="11"
                    fill="#10b981"
                    fontWeight="600"
                    style={{ userSelect: 'none' }}
                  >
                    Click to close
                  </text>
                </g>
              );
            }
            return null;
          })()}
        </g>
      )}
    </g>
  );
};

export default HouseholdDrawing;