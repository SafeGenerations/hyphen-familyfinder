// src/src-modern/components/Shapes/Household.js
import React, { useState, useCallback } from 'react';
import { useGenogram } from '../../contexts/GenogramContext';

const GRID_SIZE = 20;

const Household = ({ household }) => {
  const { state, actions } = useGenogram();
  const { selectedHousehold, snapToGrid, pan, zoom } = state;
  const [isDragging, setIsDragging] = useState(false);
  const [draggingPointIndex, setDraggingPointIndex] = useState(null);
  
  const isSelected = selectedHousehold?.id === household.id;

  const snapToGridFunc = useCallback((value) => {
    if (!snapToGrid) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, [snapToGrid]);
  
  // Create path string from points with rounded corners option
  const createRoundedPath = useCallback((points, cornerRadius = 10) => {
    if (points.length < 3) return '';
    
    // For now, use simple path and rely on stroke properties for rounding
    // This is more reliable than complex curve calculations
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ') + ' Z';
  }, []);
  
  // Create smooth bezier curve path from points
  const createSmoothPath = useCallback((points, smoothness = 0.2) => {
    if (points.length < 3) {
      // Fallback to simple path for insufficient points
      return points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
        .join(' ') + (points.length > 2 ? ' Z' : '');
    }
    
    try {
      // Start the path at the first point
      let path = `M ${points[0].x} ${points[0].y}`;
      
      // Create smooth curves between all points
      for (let i = 0; i < points.length; i++) {
        const current = points[i];
        const next = points[(i + 1) % points.length];
        const prev = points[(i - 1 + points.length) % points.length];
        const afterNext = points[(i + 2) % points.length];
        
        // Calculate control points for smooth bezier curves with validation
        const cp1x = current.x + (next.x - prev.x) * smoothness;
        const cp1y = current.y + (next.y - prev.y) * smoothness;
        const cp2x = next.x - (afterNext.x - current.x) * smoothness;
        const cp2y = next.y - (afterNext.y - current.y) * smoothness;
        
        // Validate control points aren't NaN or Infinity
        if (isFinite(cp1x) && isFinite(cp1y) && isFinite(cp2x) && isFinite(cp2y)) {
          // Add cubic bezier curve to the next point
          path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
        } else {
          // Fallback to straight line if control points are invalid
          path += ` L ${next.x} ${next.y}`;
        }
      }
      
      // CRITICAL: Properly close the path!
      path += ' Z';
      return path;
    } catch (error) {
      console.warn('Smooth path generation failed, using fallback:', error);
      return null; // Force fallback
    }
  }, []);
  
  // Create fallback path (simple lines)
  const fallbackPathData = household.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ') + ' Z';
  
  // Create path string based on border style
  let finalPathData;
  if (household.borderStyle === 'straight') {
    // Use straight lines for straight border style
    finalPathData = fallbackPathData;
  } else {
    // Use smooth curves for curved border style (default)
    const pathData = createSmoothPath(household.points, household.smoothness || 0.25);
    finalPathData = pathData || fallbackPathData;
  }
  
  // Calculate center position for label based on labelPosition setting
  const labelPosition = household.labelPosition || 'top'; // 'top', 'center', 'bottom', 'left', 'right'
  let centerX, centerY;
  
  if (labelPosition === 'center') {
    centerX = household.points.reduce((sum, p) => sum + p.x, 0) / household.points.length;
    centerY = household.points.reduce((sum, p) => sum + p.y, 0) / household.points.length;
  } else if (labelPosition === 'bottom') {
    centerX = household.points.reduce((sum, p) => sum + p.x, 0) / household.points.length;
    centerY = Math.max(...household.points.map(p => p.y)) + 20;
  } else if (labelPosition === 'left') {
    centerX = Math.min(...household.points.map(p => p.x)) - 10;
    centerY = household.points.reduce((sum, p) => sum + p.y, 0) / household.points.length;
  } else if (labelPosition === 'right') {
    centerX = Math.max(...household.points.map(p => p.x)) + 10;
    centerY = household.points.reduce((sum, p) => sum + p.y, 0) / household.points.length;
  } else { // 'top' (default)
    centerX = household.points.reduce((sum, p) => sum + p.x, 0) / household.points.length;
    centerY = Math.min(...household.points.map(p => p.y)) - 20;
  }

  // Convert screen coordinates to canvas coordinates
  const getCanvasCoords = useCallback((e) => {
    const svg = e.currentTarget.closest('svg');
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgCoords = pt.matrixTransform(svg.getScreenCTM().inverse());
    return {
      x: (svgCoords.x - pan.x) / zoom,
      y: (svgCoords.y - pan.y) / zoom
    };
  }, [pan, zoom]);

  // Handle dragging entire household
  const handleBorderPointerDown = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Capture the pointer to prevent canvas interference
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    const initialCoords = getCanvasCoords(e);
    
    // Calculate offsets for all points
    const offsets = household.points.map(point => ({
      x: initialCoords.x - point.x,
      y: initialCoords.y - point.y
    }));
    
    setIsDragging(true);

    const handlePointerMove = (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      const canvasCoords = getCanvasCoords(e);
      const newPoints = household.points.map((point, idx) => ({
        x: snapToGridFunc(canvasCoords.x - offsets[idx].x),
        y: snapToGridFunc(canvasCoords.y - offsets[idx].y)
      }));
      
      actions.updateHousehold(household.id, { points: newPoints });
    };

    const handlePointerUp = (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      // Release pointer capture
      if (e.currentTarget.releasePointerCapture) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      
      setIsDragging(false);
      e.currentTarget.removeEventListener('pointermove', handlePointerMove);
      e.currentTarget.removeEventListener('pointerup', handlePointerUp);
      e.currentTarget.removeEventListener('pointercancel', handlePointerUp);
      
      // Save to history after household boundary dragging
      actions.saveToHistory({
        people: state.people,
        relationships: state.relationships,
        households: state.households,
        textBoxes: state.textBoxes
      });
    };

    e.currentTarget.addEventListener('pointermove', handlePointerMove);
    e.currentTarget.addEventListener('pointerup', handlePointerUp);
    e.currentTarget.addEventListener('pointercancel', handlePointerUp);
  }, [household, snapToGridFunc, actions, getCanvasCoords, state]);

  // Handle dragging individual points
  const handlePointPointerDown = useCallback((e, pointIndex) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Capture the pointer to prevent canvas interference
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    setDraggingPointIndex(pointIndex);

    const handlePointerMove = (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      const canvasCoords = getCanvasCoords(e);
      const newPoints = household.points.map((point, idx) => {
        if (idx === pointIndex) {
          return {
            x: snapToGridFunc(canvasCoords.x),
            y: snapToGridFunc(canvasCoords.y)
          };
        }
        return point;
      });
      
      actions.updateHousehold(household.id, { points: newPoints });
    };

    const handlePointerUp = (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      // Release pointer capture
      if (e.currentTarget.releasePointerCapture) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      
      setDraggingPointIndex(null);
      e.currentTarget.removeEventListener('pointermove', handlePointerMove);
      e.currentTarget.removeEventListener('pointerup', handlePointerUp);
      e.currentTarget.removeEventListener('pointercancel', handlePointerUp);
      
      // Save to history after household point dragging
      actions.saveToHistory({
        people: state.people,
        relationships: state.relationships,
        households: state.households,
        textBoxes: state.textBoxes
      });
    };

    e.currentTarget.addEventListener('pointermove', handlePointerMove);
    e.currentTarget.addEventListener('pointerup', handlePointerUp);
    e.currentTarget.addEventListener('pointercancel', handlePointerUp);
  }, [household, snapToGridFunc, actions, getCanvasCoords, state]);

  const handleBorderClick = useCallback((e) => {
    e.stopPropagation();
    if (!isDragging && draggingPointIndex === null) {
      actions.selectHousehold(household);
    }
  }, [household, actions, isDragging, draggingPointIndex]);

  const handleBorderRightClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const canvasCoords = getCanvasCoords(e);

    actions.setContextMenu({
      type: 'household',
      household: household,
      x: e.clientX,
      y: e.clientY,
      canvasX: canvasCoords.x,
      canvasY: canvasCoords.y
    });
    
    actions.selectHousehold(household);
  }, [household, actions, getCanvasCoords]);

  const handlePointRightClick = useCallback((e, pointIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    actions.setContextMenu({
      type: 'household-point',
      household: household,
      pointIndex: pointIndex,
      x: e.clientX,
      y: e.clientY
    });
    
    actions.selectHousehold(household);
  }, [household, actions]);
  
  const handleDeletePoint = useCallback((pointIndex) => {
    // Don't allow deleting if there are only 3 points (minimum for polygon)
    if (household.points.length <= 3) {
      alert('A household must have at least 3 points');
      return;
    }
    
    const newPoints = household.points.filter((_, idx) => idx !== pointIndex);
    actions.updateHousehold(household.id, { points: newPoints });
    
    // Save to history after point deletion
    actions.saveToHistory({
      people: state.people,
      relationships: state.relationships,
      households: state.households,
      textBoxes: state.textBoxes
    });
  }, [household, actions, state]);

  return (
    <g>
      {/* Invisible wider path for easier selection */}
      <path
        d={finalPathData}
        fill="none"
        stroke="transparent"
        strokeWidth="20"
        style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
        onPointerDown={handleBorderPointerDown}
        onClick={handleBorderClick}
        onContextMenu={handleBorderRightClick}
      />
      
      {/* Visible boundary */}
      <path
        d={finalPathData}
        fill={`${household.color || '#6366f1'}10`}
        stroke={household.color || '#6366f1'}
        strokeWidth={isSelected ? "3" : "2"}
        strokeDasharray="8,4"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Household name with member count */}
      <text
        x={centerX}
        y={centerY}
        textAnchor="middle"
        style={{ 
          fontSize: '12px', 
          fill: household.labelColor || household.color || '#6366f1', 
          fontWeight: isSelected ? '600' : 'normal',
          pointerEvents: 'none'
        }}
      >
        {household.name}
        {household.members && household.members.length > 0 && (
          <tspan fill="#999" fontWeight="normal">
            {` (${household.members.length})`}
          </tspan>
        )}
      </text>
      
      {/* Edit points when selected */}
      {isSelected && (
        <>
          {/* Draggable points */}
          {household.points.map((pt, idx) => (
            <g key={`pt-${idx}`}>
              {/* Main draggable point */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={8 / zoom}
                fill="#ffffff"
                stroke={household.color || '#6366f1'}
                strokeWidth={2 / zoom}
                style={{ 
                  cursor: draggingPointIndex === idx ? 'grabbing' : 'move',
                  touchAction: 'none'
                }}
                onPointerDown={(e) => handlePointPointerDown(e, idx)}
              />
              
              {/* Delete button on each point (small X in top-right) */}
              <g
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePoint(idx);
                }}
              >
                <circle
                  cx={pt.x + 8 / zoom}
                  cy={pt.y - 8 / zoom}
                  r={6 / zoom}
                  fill="#ef4444"
                  stroke="#ffffff"
                  strokeWidth={1.5 / zoom}
                />
                <text
                  x={pt.x + 8 / zoom}
                  y={pt.y - 8 / zoom + 3.5 / zoom}
                  textAnchor="middle"
                  style={{
                    fontSize: `${10 / zoom}px`,
                    fill: '#ffffff',
                    pointerEvents: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  ×
                </text>
              </g>
            </g>
          ))}
        </>
      )}
    </g>
  );
};

export default Household;