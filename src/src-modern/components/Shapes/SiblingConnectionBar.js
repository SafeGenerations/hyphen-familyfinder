// src/src-modern/components/Shapes/SiblingConnectionBar.js
import React, { useState, useCallback } from 'react';
import { useGenogram } from '../../contexts/GenogramContext';

const SiblingConnectionBar = ({ parentRelationship, siblings, relationships, people }) => {
  const { state, actions } = useGenogram();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const handleMouseDown = useCallback((e) => {
    e.stopPropagation();
    setIsDragging(true);
    
    const svg = e.currentTarget.closest('svg');
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgCoords = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    // Convert to canvas coordinates accounting for pan/zoom
    const canvasX = (svgCoords.x - state.pan.x) / state.zoom;
    const canvasY = (svgCoords.y - state.pan.y) / state.zoom;
    
    const initialPositions = siblings.map(s => ({ id: s.id, x: s.x, y: s.y }));
    
    const handleMouseMove = (e) => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const currentCoords = pt.matrixTransform(svg.getScreenCTM().inverse());
      
      const currentCanvasX = (currentCoords.x - state.pan.x) / state.zoom;
      const currentCanvasY = (currentCoords.y - state.pan.y) / state.zoom;
      
      const deltaX = currentCanvasX - canvasX;
      const deltaY = currentCanvasY - canvasY;
      
      // Update all sibling positions
      initialPositions.forEach(({ id, x, y }) => {
        actions.updatePerson(id, {
          x: x + deltaX,
          y: e.shiftKey ? y : y + deltaY // Hold shift to constrain to horizontal movement
        });
      });
      
      // Also move their spouses and children
      siblings.forEach(sibling => {
        // Find spouse relationships
        const PARENT_RELATIONSHIP_TYPES = [
          // Romantic relationships
          'marriage', 'partner', 'cohabitation', 'engagement', 'dating', 'love-affair', 'secret-affair', 'single-encounter',
          // Ended relationships (they can still have children from when they were together)
          'divorce', 'separation', 'nullity', 'widowed',
          // Complex dynamics (can still have children)
          'complicated', 'on-off', 'toxic', 'dependency', 'codependent',
          // Special family relationships
          'adoption', 'step-relationship',
          // Emotional relationships that might have children
          'close', 'love', 'best-friends',
          // Social services relationships
          'caregiver', 'supportive'
        ];
        
        const spouseRels = relationships.filter(r => 
          (r.from === sibling.id || r.to === sibling.id) && 
          PARENT_RELATIONSHIP_TYPES.includes(r.type)
        );
        
        spouseRels.forEach(rel => {
          const spouseId = rel.from === sibling.id ? rel.to : rel.from;
          const spouse = people.find(p => p.id === spouseId);
          if (spouse) {
            const originalSpouse = people.find(p => p.id === spouseId);
            actions.updatePerson(spouseId, {
              x: originalSpouse.x + deltaX,
              y: e.shiftKey ? originalSpouse.y : originalSpouse.y + deltaY
            });
            
            // Move children of this sibling
            const childRels = relationships.filter(r => 
              r.type === 'child' && r.from === rel.id
            );
            
            childRels.forEach(childRel => {
              const child = people.find(p => p.id === childRel.to);
              if (child) {
                actions.updatePerson(child.id, {
                  x: child.x + deltaX,
                  y: e.shiftKey ? child.y : child.y + deltaY
                });
              }
            });
          }
        });
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Save to history
      actions.saveToHistory({
        people: state.people,
        relationships: state.relationships,
        households: state.households,
        textBoxes: state.textBoxes
      });
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [siblings, people, relationships, actions, state]);
  
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (!isDragging) {
      // Select all siblings
      console.log('Selected sibling group:', siblings.map(s => s.name));
      // You could implement a multi-select feature here
      // For now, just select the first sibling
      actions.selectPerson(siblings[0]);
    }
  }, [isDragging, siblings, actions]);
  
  const handleRightClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    actions.setContextMenu({
      type: 'sibling-group',
      siblings: siblings,
      parentRelationship: parentRelationship,
      x: e.clientX,
      y: e.clientY
    });
  }, [siblings, parentRelationship, actions]);
  
  // Don't render if less than 2 siblings - MOVED AFTER HOOKS
  if (!parentRelationship || siblings.length < 2) return null;
  
  // Find parent positions
  const parent1 = people.find(p => p.id === parentRelationship.from);
  const parent2 = people.find(p => p.id === parentRelationship.to);
  
  if (!parent1 || !parent2) return null;
  
  // Calculate parent bubble position
  const x1 = parent1.x + 30;
  const y1 = parent1.y + 30;
  const x2 = parent2.x + 30;
  const y2 = parent2.y + 30;
  
  const bubblePos = parentRelationship.bubblePosition || 0.5;
  const parentX = x1 + (x2 - x1) * bubblePos;
  const parentY = y1 + (y2 - y1) * bubblePos;
  
  // Sort siblings by X position
  const sortedSiblings = [...siblings].sort((a, b) => a.x - b.x);
  
  // Find leftmost and rightmost sibling positions
  const leftmostX = sortedSiblings[0].x + 30;
  const rightmostX = sortedSiblings[sortedSiblings.length - 1].x + 30;
  const barY = parentY + 60; // The horizontal bar position
  
  // Check if any sibling is selected
  const isSelected = siblings.some(s => state.selectedPerson?.id === s.id);
  
  return (
    <g>
      {/* Invisible wider line for easier interaction */}
      <line
        x1={leftmostX}
        y1={barY}
        x2={rightmostX}
        y2={barY}
        stroke="transparent"
        strokeWidth="20"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onContextMenu={handleRightClick}
      />
      
      {/* Visible connection bar */}
      <line
        x1={leftmostX}
        y1={barY}
        x2={rightmostX}
        y2={barY}
        stroke={isSelected ? '#3b82f6' : (parentRelationship.color || '#6b7280')}
        strokeWidth={isSelected ? "4" : "3"}
        strokeDasharray="2,2"
        opacity={isSelected ? "0.7" : "0.5"}
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Drag handle in the middle */}
      <g
        transform={`translate(${(leftmostX + rightmostX) / 2}, ${barY})`}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
      >
        <rect
          x="-15"
          y="-8"
          width="30"
          height="16"
          rx="4"
          fill="white"
          stroke={isSelected ? '#3b82f6' : (parentRelationship.color || '#6b7280')}
          strokeWidth="2"
          opacity="0.9"
        />
        <text
          x="0"
          y="4"
          textAnchor="middle"
          style={{ 
            fontSize: '10px', 
            fill: isSelected ? '#3b82f6' : (parentRelationship.color || '#6b7280'),
            pointerEvents: 'none',
            userSelect: 'none',
            fontWeight: '600'
          }}
        >
          ⋮⋮
        </text>
      </g>
      
      {/* Sibling count badge */}
      <g transform={`translate(${rightmostX + 10}, ${barY})`}>
        <circle
          r="10"
          fill="white"
          stroke={isSelected ? '#3b82f6' : (parentRelationship.color || '#6b7280')}
          strokeWidth="2"
        />
        <text
          y="4"
          textAnchor="middle"
          style={{ 
            fontSize: '10px', 
            fill: isSelected ? '#3b82f6' : (parentRelationship.color || '#6b7280'),
            pointerEvents: 'none',
            userSelect: 'none',
            fontWeight: '600'
          }}
        >
          {siblings.length}
        </text>
      </g>
      
      {/* Hover hint */}
      <title>
        {siblings.length} siblings • Drag to move all • Shift+drag for horizontal only • Right-click for options
      </title>
    </g>
  );
};

export default SiblingConnectionBar;