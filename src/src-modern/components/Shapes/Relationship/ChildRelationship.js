// src/components/Shapes/ChildRelationship.js
import React, { useCallback } from 'react';
import { useGenogram } from '../../../contexts/GenogramContext';
import { useResponsive } from '../../../utils/responsive';

const ChildRelationship = ({ relationship, people, relationships, isHighlighted, breakpoint }) => {
  const { state, actions } = useGenogram();
  const { selectedRelationship } = state;
  const { breakpoint: currentBreakpoint } = useResponsive();
  
  // Use passed breakpoint or current breakpoint
  const activeBreakpoint = breakpoint || currentBreakpoint;
  
  const parentRel = relationships.find((r) => r.id === relationship.from);
  const childPerson = people.find((p) => p.id === relationship.to);
  const parent1 = parentRel ? people.find((p) => p.id === parentRel.from) : null;
  const parent2 = parentRel ? people.find((p) => p.id === parentRel.to) : null;
  const hasRequiredNodes = Boolean(parentRel && childPerson && parent1 && parent2);

  const handleLineClick = useCallback((e) => {
    e.stopPropagation();
    actions.selectRelationship(relationship);
    if (!state.sidePanelOpen) {
      actions.toggleSidePanel();
    }
  }, [relationship, actions, state.sidePanelOpen]);
  
  // Handle right-click context menu
  const handleLineRightClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    actions.setContextMenu({
      type: 'relationship',
      relationship: relationship,
      x: e.clientX,
      y: e.clientY
    });
    
    actions.selectRelationship(relationship);
  }, [relationship, actions]);
  
  // Handle disconnect button click
  const handleDisconnectClick = useCallback((e) => {
    e.stopPropagation();

    if (!childPerson) {
      return;
    }

    let parentNames = '';
    if (parent1 && parent2) {
      parentNames = `${parent1.name} and ${parent2.name}`;
    } else if (parent1) {
      parentNames = parent1.name;
    } else if (parent2) {
      parentNames = parent2.name;
    } else {
      parentNames = 'their parents';
    }

    actions.setDeleteConfirmation({
      type: 'relationship',
      title: 'Disconnect from Parents',
      message: `Disconnect ${childPerson.name} from ${parentNames}?`,
      onConfirm: () => {
        actions.deleteRelationship(relationship.id);
        actions.setDeleteConfirmation(null);
      },
      onCancel: () => actions.setDeleteConfirmation(null)
    });
  }, [relationship, childPerson, parent1, parent2, actions]);

  if (!hasRequiredNodes) {
    return null;
  }

  // Calculate positions now that required nodes are guaranteed
  const x1 = parent1.x + 30;
  const y1 = parent1.y + 30;
  const x2 = parent2.x + 30;
  const y2 = parent2.y + 30;

  const bubblePos = parentRel.bubblePosition || 0.5;
  const parentX = x1 + (x2 - x1) * bubblePos;
  const parentY = y1 + (y2 - y1) * bubblePos;

  const childX = childPerson.x + 30;
  const childY = childPerson.y + 30;

  const dropY = parentY + 60;

  // Line style for special statuses
  let strokeDasharray = '';
  if (childPerson.specialStatus === 'adopted') {
    strokeDasharray = '8,4';
  } else if (childPerson.specialStatus === 'foster') {
    strokeDasharray = '3,3';
  } else if (childPerson.specialStatus === 'unborn') {
    strokeDasharray = '4,4'; // Dotted line for unborn/fetus
  }

  const isSelected = selectedRelationship?.id === relationship.id;
  const lineWidth = activeBreakpoint === 'xs' ? 3 : 2;
  const color = parentRel.color || '#3b82f6';

  // Calculate middle point on the vertical line for the disconnect button
  const midVerticalY = (dropY + childY) / 2;
  
  return (
    <g style={{ opacity: isHighlighted ? 1 : 0.3, transition: 'opacity 0.25s ease-in-out' }}>
      {/* Invisible wider lines for easier interaction */}
      <line 
        x1={parentX} 
        y1={parentY} 
        x2={parentX} 
        y2={dropY} 
        stroke="transparent" 
        strokeWidth="20"
        style={{ cursor: 'pointer' }}
        onClick={handleLineClick}
        onContextMenu={handleLineRightClick}
      />
      <line 
        x1={parentX} 
        y1={dropY} 
        x2={childX} 
        y2={dropY} 
        stroke="transparent" 
        strokeWidth="20"
        style={{ cursor: 'pointer' }}
        onClick={handleLineClick}
        onContextMenu={handleLineRightClick}
      />
      <line 
        x1={childX} 
        y1={dropY} 
        x2={childX} 
        y2={childY} 
        stroke="transparent" 
        strokeWidth="20"
        style={{ cursor: 'pointer' }}
        onClick={handleLineClick}
        onContextMenu={handleLineRightClick}
      />
      
      {/* Visible lines */}
      <line 
        x1={parentX} 
        y1={parentY} 
        x2={parentX} 
        y2={dropY} 
        stroke={isSelected ? '#f59e0b' : color} 
        strokeWidth={isSelected ? lineWidth + 1 : lineWidth} 
        strokeDasharray={strokeDasharray}
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Horizontal line to child */}
      <line 
        x1={parentX} 
        y1={dropY} 
        x2={childX} 
        y2={dropY} 
        stroke={isSelected ? '#f59e0b' : color} 
        strokeWidth={isSelected ? lineWidth + 1 : lineWidth} 
        strokeDasharray={strokeDasharray}
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Vertical line to child */}
      <line 
        x1={childX} 
        y1={dropY} 
        x2={childX} 
        y2={childY} 
        stroke={isSelected ? '#f59e0b' : color} 
        strokeWidth={isSelected ? lineWidth + 1 : lineWidth} 
        strokeDasharray={strokeDasharray}
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Disconnect button on the vertical line to child */}
      <g
        style={{ cursor: 'pointer' }}
        onClick={handleDisconnectClick}
      >
        <circle
          cx={childX}
          cy={midVerticalY}
          r={activeBreakpoint === 'xs' ? 10 : 8}
          fill="#ffffff"
          stroke="#f59e0b"
          strokeWidth="2"
        />
        <text
          x={childX}
          y={midVerticalY + (activeBreakpoint === 'xs' ? 4 : 3)}
          textAnchor="middle"
          style={{ 
            fontSize: activeBreakpoint === 'xs' ? '14px' : '12px', 
            fill: '#f59e0b', 
            pointerEvents: 'none', 
            fontWeight: 'bold' 
          }}
        >
          ⚡
        </text>
      </g>
      
      {/* Delete button when selected (traditional delete) */}
      {isSelected && (
        <g
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            actions.setDeleteConfirmation({
              type: 'relationship',
              title: 'Delete Relationship',
              message: `Delete this parent-child relationship?`,
              onConfirm: () => {
                actions.deleteRelationship(relationship.id);
                actions.setDeleteConfirmation(null);
              },
              onCancel: () => actions.setDeleteConfirmation(null)
            });
          }}
        >
          <circle
            cx={parentX}
            cy={dropY - 20}
            r={activeBreakpoint === 'xs' ? 10 : 8}
            fill="#ffffff"
            stroke="#ef4444"
            strokeWidth="2"
          />
          <text
            x={parentX}
            y={dropY - (activeBreakpoint === 'xs' ? 15 : 16)}
            textAnchor="middle"
            style={{ 
              fontSize: activeBreakpoint === 'xs' ? '14px' : '12px', 
              fill: '#ef4444', 
              pointerEvents: 'none', 
              fontWeight: 'bold' 
            }}
          >
            ×
          </text>
        </g>
      )}
      
      <title>Click to select • Right-click for menu • Orange ⚡ to disconnect from parents</title>
    </g>
  );
};

export default ChildRelationship;