import React, { useState, useCallback, useRef } from 'react';
import { useGenogram } from '../../../contexts/GenogramContext';
import { useResponsive, getRelationshipLineWidth } from '../../../utils/responsive';
import { getAttributeById, getAttributeColor, getAttributeIcon } from '../../../utils/relationshipAttributes';
import { ConnectionStatus, getConnectionStatusConfig, getPlacementStatusConfig } from '../../../constants/connectionStatus';

// RelationshipDragHandle component - placed BEFORE the main Relationship component
const RelationshipDragHandle = ({ x1, y1, x2, y2, relationship, onDrag, isSelected, color, lineWidth }) => {
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef(null);
  
  // Calculate middle point of the line
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  // Calculate angle for the handle orientation
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
  
  const handlePointerDown = (e) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    
    const element = e.currentTarget;
    elementRef.current = element;
    
    setIsDragging(true);
    
    const handlePointerMove = (moveEvent) => {
      // Handle is being dragged - visual feedback only
    };
    
    const handlePointerUp = () => {
      setIsDragging(false);
      elementRef.current = null;
      
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
    
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    
    // Call the parent's drag handler
    onDrag(e, true);
  };
  
  return (
    <g 
      transform={`translate(${midX}, ${midY}) rotate(${angle})`}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
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

// Main Relationship component
const Relationship = ({ relationship, people, relationships, isHighlighted }) => {
  const { state, actions } = useGenogram();
  const { selectedRelationship, zoom, isConnecting, connectingFrom, connectingType, showConnectionBadges, showPlacementBadges, showRelationshipBubbles } = state;
  const { breakpoint } = useResponsive();
  const [isDraggingBubble, setIsDraggingBubble] = useState(false);
  const elementRef = useRef(null);
  const svgRef = useRef(null);
  const hasPointerCapture = useRef(false);
  
  // Detect Mac platform for special handling
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  
  // Get responsive line width
  const isSelected = selectedRelationship?.id === relationship.id;
  const baseLineWidth = getRelationshipLineWidth(breakpoint, isSelected);
  
  // handleRelationshipDrag handler - FIXED VERSION
  const handleRelationshipDrag = useCallback((e, startDrag = false) => {
    if (startDrag) {
      e.stopPropagation();
      
      const element = e.currentTarget;
      const svg = element?.closest('svg');
      
      if (!svg || !element) return;
      
      svgRef.current = svg;
      
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgCoords = pt.matrixTransform(svg.getScreenCTM().inverse());
      
      // Convert to canvas coordinates
      const startCanvasX = (svgCoords.x - state.pan.x) / state.zoom;
      const startCanvasY = (svgCoords.y - state.pan.y) / state.zoom;
      
      // Get all connected people and their families
      const connectedPeople = new Map();
      
      // Add the two people in the relationship
      const person1 = people.find(p => p.id === relationship.from);
      const person2 = people.find(p => p.id === relationship.to);
      
      if (person1) connectedPeople.set(person1.id, { x: person1.x, y: person1.y });
      if (person2) connectedPeople.set(person2.id, { x: person2.x, y: person2.y });
      
      // Add children of this relationship
      relationships.filter(r => r.type === 'child' && r.from === relationship.id).forEach(childRel => {
        const child = people.find(p => p.id === childRel.to);
        if (child) {
          connectedPeople.set(child.id, { x: child.x, y: child.y });
          
          // Add child's spouse and their children
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
          
          relationships.filter(r => 
            (r.from === child.id || r.to === child.id) && 
            PARENT_RELATIONSHIP_TYPES.includes(r.type)
          ).forEach(spouseRel => {
            const spouseId = spouseRel.from === child.id ? spouseRel.to : spouseRel.from;
            const spouse = people.find(p => p.id === spouseId);
            if (spouse) {
              connectedPeople.set(spouse.id, { x: spouse.x, y: spouse.y });
              
              // Add their children
              relationships.filter(r => r.type === 'child' && r.from === spouseRel.id).forEach(grandchildRel => {
                const grandchild = people.find(p => p.id === grandchildRel.to);
                if (grandchild) {
                  connectedPeople.set(grandchild.id, { x: grandchild.x, y: grandchild.y });
                }
              });
            }
          });
        }
      });
      
      const handlePointerMove = (moveEvent) => {
        if (!svgRef.current) return;
        
        const pt = svgRef.current.createSVGPoint();
        pt.x = moveEvent.clientX;
        pt.y = moveEvent.clientY;
        const currentCoords = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
        
        const currentCanvasX = (currentCoords.x - state.pan.x) / state.zoom;
        const currentCanvasY = (currentCoords.y - state.pan.y) / state.zoom;
        
        const deltaX = currentCanvasX - startCanvasX;
        const deltaY = currentCanvasY - startCanvasY;
        
        // Update all connected people
        connectedPeople.forEach((initialPos, personId) => {
          actions.updatePerson(personId, {
            x: initialPos.x + deltaX,
            y: moveEvent.shiftKey ? initialPos.y : initialPos.y + deltaY
          });
        });
      };
      
      const handlePointerUp = () => {
        // Save to history
        actions.saveToHistory({
          people: state.people,
          relationships: state.relationships,
          households: state.households,
          textBoxes: state.textBoxes
        });
        
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        svgRef.current = null;
      };
      
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    }
  }, [relationship, relationships, people, actions, state]);
  
  // FIXED handleBubblePointerDown
  const handleBubblePointerDown = useCallback((e, x1, y1, x2, y2) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingBubble(true);

    const element = e.currentTarget;
    const svg = element?.closest('svg');
    const pointerId = e.pointerId;

    if (!svg || !element) return;

    elementRef.current = element;
    svgRef.current = svg;

    // Safely set pointer capture
    hasPointerCapture.current = false;
    try {
      element.setPointerCapture(pointerId);
      hasPointerCapture.current = true;
    } catch (err) {
      // Continue without capture
    }

    const handlePointerMove = (moveEvent) => {
      moveEvent.stopPropagation();
      moveEvent.preventDefault();

      if (!svgRef.current) return;

      const pt = svgRef.current.createSVGPoint();
      pt.x = moveEvent.clientX;
      pt.y = moveEvent.clientY;
      const svgCoords = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());

      // Convert SVG screen coordinates to canvas coordinates
      const canvasX = (svgCoords.x - state.pan.x) / state.zoom;
      const canvasY = (svgCoords.y - state.pan.y) / state.zoom;

      // Calculate position along line (0 to 1) using canvas coordinates
      const lenSq = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
      let t = 0.5;
      if (lenSq > 0) {
        t = ((canvasX - x1) * (x2 - x1) + (canvasY - y1) * (y2 - y1)) / lenSq;
      }
      t = Math.max(0, Math.min(1, t));

      actions.updateRelationship(relationship.id, { bubblePosition: t });
    };

    const handlePointerUp = (upEvent) => {
      upEvent.stopPropagation();
      upEvent.preventDefault();

      // Safely release pointer capture
      if (hasPointerCapture.current && elementRef.current) {
        try {
          if (document.body.contains(elementRef.current) && elementRef.current.releasePointerCapture) {
            elementRef.current.releasePointerCapture(pointerId);
          }
        } catch (err) {
          // Ignore if already released
        }
      }

      setIsDraggingBubble(false);
      hasPointerCapture.current = false;
      elementRef.current = null;
      svgRef.current = null;

      // Remove event listeners
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);

      // Save to history
      actions.saveToHistory({
        people: state.people,
        relationships: state.relationships,
        households: state.households,
        textBoxes: state.textBoxes
      });
    };

    // Use document-level event listeners
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
  }, [relationship.id, actions, state]);

  const handleLineClick = useCallback((e) => {
    e.stopPropagation();
    if (!isDraggingBubble) {
      actions.selectRelationship(relationship);
      if (!state.sidePanelOpen) {
        actions.toggleSidePanel();
      }
    }
  }, [relationship, actions, isDraggingBubble, state.sidePanelOpen]);

  const handleBubbleClick = useCallback((e) => {
    e.stopPropagation();
    
    if (isConnecting && connectingFrom && connectingType === 'child') {
      // Child is trying to connect to parent relationship - complete the connection
      const childPerson = state.people.find(p => p.id === connectingFrom);
      if (childPerson) {
        console.log('Connecting child', childPerson.name, 'to relationship', relationship.id);
        actions.createChildRelationship(relationship.id, childPerson.id);
        actions.cancelConnection();
      }
    } else if (!isDraggingBubble) {
      // When not in connection mode, clicking the bubble should start child mode
      console.log('Starting child connection from relationship:', relationship.id);
      actions.startConnection(null, relationship.id, 'child');
      actions.selectRelationship(relationship);
    }
  }, [isConnecting, connectingFrom, connectingType, relationship, actions, isDraggingBubble, state.people]);

  const handleLineRightClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    actions.setContextMenu({
      type: 'relationship',
      relationship: relationship,
      x: e.clientX,
      y: e.clientY
    });
    
    // Select without opening edit panel on right-click
    actions.selectRelationship({ relationship, openPanel: false });
  }, [relationship, actions]);
  
  // FIXED handleLinePointerDown
  const handleLinePointerDown = useCallback((e) => {
    e.stopPropagation();
    
    // Don't start drag if clicking with right button or if in connecting mode
    if (e.button !== 0 || isConnecting) return;
    
    const element = e.currentTarget;
    const svg = element?.closest('svg');
    const pointerId = e.pointerId;
    
    if (!svg || !element) return;
    
    elementRef.current = element;
    svgRef.current = svg;
    
    // Safely set pointer capture
    hasPointerCapture.current = false;
    try {
      element.setPointerCapture(pointerId);
      hasPointerCapture.current = true;
    } catch (err) {
      // Continue without capture
    }
    
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgCoords = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    // Convert to canvas coordinates accounting for pan/zoom
    const startCanvasX = (svgCoords.x - state.pan.x) / state.zoom;
    const startCanvasY = (svgCoords.y - state.pan.y) / state.zoom;
    
    // Store initial positions of both people
    const initialFromPerson = people.find(p => p.id === relationship.from);
    const initialToPerson = people.find(p => p.id === relationship.to);
    
    if (!initialFromPerson || !initialToPerson) return;
    
    const initialPositions = {
      from: { x: initialFromPerson.x, y: initialFromPerson.y },
      to: { x: initialToPerson.x, y: initialToPerson.y }
    };
    
    // Track if we've moved enough to start dragging
    let hasDragged = false;
    const DRAG_THRESHOLD = 5;
    
    const handlePointerMove = (moveEvent) => {
      if (!svgRef.current) return;
      
      const pt = svgRef.current.createSVGPoint();
      pt.x = moveEvent.clientX;
      pt.y = moveEvent.clientY;
      const currentCoords = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
      
      const currentCanvasX = (currentCoords.x - state.pan.x) / state.zoom;
      const currentCanvasY = (currentCoords.y - state.pan.y) / state.zoom;
      
      const deltaX = currentCanvasX - startCanvasX;
      const deltaY = currentCanvasY - startCanvasY;
      
      // Check if we've moved enough to start dragging
      if (!hasDragged && (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD)) {
        hasDragged = true;
      }
      
      if (hasDragged) {
        // Update both people positions
        actions.updatePerson(relationship.from, {
          x: initialPositions.from.x + deltaX,
          y: moveEvent.shiftKey ? initialPositions.from.y : initialPositions.from.y + deltaY
        });
        
        actions.updatePerson(relationship.to, {
          x: initialPositions.to.x + deltaX,
          y: moveEvent.shiftKey ? initialPositions.to.y : initialPositions.to.y + deltaY
        });
        
        // Move their children too
        relationships.filter(r => r.type === 'child' && r.from === relationship.id).forEach(childRel => {
          const child = people.find(p => p.id === childRel.to);
          if (child) {
            const initialChildPos = people.find(p => p.id === child.id);
            if (initialChildPos) {
              actions.updatePerson(child.id, {
                x: initialChildPos.x + deltaX,
                y: moveEvent.shiftKey ? initialChildPos.y : initialChildPos.y + deltaY
              });
            }
          }
        });
      }
    };
    
    const handlePointerUp = (upEvent) => {
      // Safely release pointer capture
      if (hasPointerCapture.current && elementRef.current) {
        try {
          if (document.body.contains(elementRef.current) && elementRef.current.releasePointerCapture) {
            elementRef.current.releasePointerCapture(pointerId);
          }
        } catch (err) {
          // Ignore if already released
        }
      }
      
      if (hasDragged) {
        // Save to history
        actions.saveToHistory({
          people: state.people,
          relationships: state.relationships,
          households: state.households,
          textBoxes: state.textBoxes
        });
      } else {
        // It was a click, not a drag
        actions.selectRelationship(relationship);
      }
      
      hasPointerCapture.current = false;
      elementRef.current = null;
      svgRef.current = null;
      
      // Remove event listeners
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
    
    // Use document-level event listeners
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
  }, [relationship, relationships, people, isConnecting, actions, state]);
  
  // Enhanced pointer down handler with right-click detection for Mac
  const handleLinePointerDownWithRightClick = useCallback((e) => {
    e.stopPropagation();
    
    // Handle right-click (button 2) as fallback for Mac two-finger click
    if (e.button === 2) {
      e.preventDefault();
      
      actions.setContextMenu({
        type: 'relationship',
        relationship: relationship,
        x: e.clientX,
        y: e.clientY
      });
      
      // Select without opening edit panel on right-click
      actions.selectRelationship({ relationship, openPanel: false });
      return;
    }
    
    // Handle regular pointer down for dragging
    handleLinePointerDown(e);
  }, [relationship, actions, handleLinePointerDown]);

  // Enhanced bubble pointer down handler with right-click detection for Mac
  const handleBubblePointerDownWithRightClick = useCallback((e, x1, y1, x2, y2) => {
    e.stopPropagation();
    
    // Handle right-click (button 2) as fallback for Mac two-finger click
    if (e.button === 2) {
      e.preventDefault();
      
      actions.setContextMenu({
        type: 'relationship',
        relationship: relationship,
        x: e.clientX,
        y: e.clientY
      });
      
      // Select without opening edit panel on right-click
      actions.selectRelationship({ relationship, openPanel: false });
      return;
    }
    
    // Handle regular pointer down for dragging
    handleBubblePointerDown(e, x1, y1, x2, y2);
  }, [relationship, actions, handleBubblePointerDown]);
  
  // Handle child relationships separately
  if (relationship.type === 'child') {
    return <ChildRelationship 
      relationship={relationship} 
      people={people} 
      relationships={relationships}
      isHighlighted={isHighlighted}
      breakpoint={breakpoint}
    />;
  }

  const fromPerson = people.find(p => p.id === relationship.from);
  const toPerson = people.find(p => p.id === relationship.to);
  
  if (!fromPerson || !toPerson) return null;

  const x1 = fromPerson.x + 30;
  const y1 = fromPerson.y + 30;
  const x2 = toPerson.x + 30;
  const y2 = toPerson.y + 30;

  const isRelationshipHighlighted = isHighlighted || (isConnecting && connectingFrom && connectingType === 'child' && 
                       ['marriage', 'partner', 'cohabitation'].includes(relationship.type));

  // Enhanced line rendering function
  const renderRelationshipLines = (x1, y1, x2, y2, relationship, strokeColor, strokeWidth, strokeDasharray) => {
    const lines = [];
    
    // Check if we have a custom line style override first
    const lineStyle = relationship.lineStyle || 'default';
    
    // Handle custom line style overrides that should take priority
    if (lineStyle !== 'default') {
      switch (lineStyle) {
        case 'double-line':
          const spacing = 8;
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const perpX = Math.cos(angle + Math.PI/2) * spacing/2;
          const perpY = Math.sin(angle + Math.PI/2) * spacing/2;
          
          lines.push(
            <line key="line1" x1={x1 + perpX} y1={y1 + perpY} x2={x2 + perpX} y2={y2 + perpY} stroke={strokeColor} strokeWidth={strokeWidth} style={{ pointerEvents: 'none' }} />
          );
          lines.push(
            <line key="line2" x1={x1 - perpX} y1={y1 - perpY} x2={x2 - perpX} y2={y2 - perpY} stroke={strokeColor} strokeWidth={strokeWidth} style={{ pointerEvents: 'none' }} />
          );
          return lines;
          
        case 'toxic-zigzag':
          const segments = 10;
          const amplitude = 12;
          let pathData = `M ${x1} ${y1}`;
          for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t + (i % 2 === 0 ? amplitude : -amplitude);
            pathData += ` L ${x} ${y}`;
          }
          lines.push(<path key="zigzag" d={pathData} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" style={{ pointerEvents: 'none' }} />);
          return lines;
          
        case 'wavy':
          const waveAmplitude = 8;
          const frequency = 3;
          const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          const steps = Math.max(30, length / 8);
          let wavePath = `M ${x1} ${y1}`;
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const baseX = x1 + (x2 - x1) * t;
            const baseY = y1 + (y2 - y1) * t;
            const waveAngle = Math.atan2(y2 - y1, x2 - x1) + Math.PI/2;
            const waveOffset = Math.sin(t * Math.PI * frequency) * waveAmplitude;
            const x = baseX + Math.cos(waveAngle) * waveOffset;
            const y = baseY + Math.sin(waveAngle) * waveOffset;
            wavePath += ` L ${x} ${y}`;
          }
          lines.push(<path key="wave" d={wavePath} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" style={{ pointerEvents: 'none' }} />);
          return lines;
          
        case 'on-off-segments':
          const totalLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          const segmentCount = 8;
          const segmentLength = totalLength / segmentCount;
          const lineAngle = Math.atan2(y2 - y1, x2 - x1);
          
          for (let i = 0; i < segmentCount; i++) {
            const startX = x1 + Math.cos(lineAngle) * segmentLength * i;
            const startY = y1 + Math.sin(lineAngle) * segmentLength * i;
            const endX = x1 + Math.cos(lineAngle) * segmentLength * (i + 1);
            const endY = y1 + Math.sin(lineAngle) * segmentLength * (i + 1);
            
            lines.push(
              <line
                key={`segment-${i}`}
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={i % 2 === 0 ? '' : '6,4'}
                style={{ pointerEvents: 'none' }}
              />
            );
          }
          return lines;
          
        case 'triple-line':
          const depAngle = Math.atan2(y2 - y1, x2 - x1);
          const depPerpX = Math.cos(depAngle + Math.PI/2) * 4;
          const depPerpY = Math.sin(depAngle + Math.PI/2) * 4;
          lines.push(<line key="dep1" x1={x1 + depPerpX} y1={y1 + depPerpY} x2={x2 + depPerpX} y2={y2 + depPerpY} stroke={strokeColor} strokeWidth="1" style={{ pointerEvents: 'none' }} />);
          lines.push(<line key="dep2" x1={x1} y1={y1} x2={x2} y2={y2} stroke={strokeColor} strokeWidth="3" style={{ pointerEvents: 'none' }} />);
          lines.push(<line key="dep3" x1={x1 - depPerpX} y1={y1 - depPerpY} x2={x2 - depPerpX} y2={y2 - depPerpY} stroke={strokeColor} strokeWidth="1" style={{ pointerEvents: 'none' }} />);
          return lines;
          
        case 'curved-arrow':
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2 - 25;
          
          lines.push(
            <path
              key="curve"
              d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
              style={{ pointerEvents: 'none' }}
            />
          );
          
          const arrowAngle = Math.atan2(y2 - midY, x2 - midX);
          const arrowSize = 8;
          lines.push(
            <polygon
              key="arrow"
              points={`${x2 - Math.cos(arrowAngle - 0.5) * arrowSize},${y2 - Math.sin(arrowAngle - 0.5) * arrowSize} ${x2},${y2} ${x2 - Math.cos(arrowAngle + 0.5) * arrowSize},${y2 - Math.sin(arrowAngle + 0.5) * arrowSize}`}
              fill={strokeColor}
              style={{ pointerEvents: 'none' }}
            />
          );
          return lines;
          
        case 'gentle-curve':
          const supportMidX = (x1 + x2) / 2;
          const supportMidY = (y1 + y2) / 2 - 15;
          
          lines.push(
            <path
              key="support"
              d={`M ${x1} ${y1} Q ${supportMidX} ${supportMidY} ${x2} ${y2}`}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
              style={{ pointerEvents: 'none' }}
            />
          );
          return lines;
          
        case 'parallel':
          const compAngle = Math.atan2(y2 - y1, x2 - x1);
          const compPerpX = Math.cos(compAngle + Math.PI/2) * 5;
          const compPerpY = Math.sin(compAngle + Math.PI/2) * 5;
          
          lines.push(
            <line
              key="comp1"
              x1={x1 + compPerpX} y1={y1 + compPerpY}
              x2={x2 + compPerpX} y2={y2 + compPerpY}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              style={{ pointerEvents: 'none' }}
            />
          );
          lines.push(
            <line
              key="comp2"
              x1={x1 - compPerpX} y1={y1 - compPerpY}
              x2={x2 - compPerpX} y2={y2 - compPerpY}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              style={{ pointerEvents: 'none' }}
            />
          );
          return lines;
          
        case 'angular-warning':
          const abusiveSegments = 6;
          const harshness = 15;
          let abusivePath = `M ${x1} ${y1}`;
          
          for (let i = 1; i <= abusiveSegments; i++) {
            const t = i / abusiveSegments;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * harshness;
            abusivePath += ` L ${x} ${y}`;
          }
          
          lines.push(
            <path
              key="abusive"
              d={abusivePath}
              stroke="#dc2626"
              strokeWidth={strokeWidth + 1}
              fill="none"
              style={{ pointerEvents: 'none' }}
            />
          );
          
          const midAbusiveX = (x1 + x2) / 2;
          const midAbusiveY = (y1 + y2) / 2;
          lines.push(
            <polygon
              key="warning"
              points={`${midAbusiveX},${midAbusiveY-8} ${midAbusiveX-6},${midAbusiveY+4} ${midAbusiveX+6},${midAbusiveY+4}`}
              fill="#dc2626"
              stroke="#ffffff"
              strokeWidth="1"
              style={{ pointerEvents: 'none' }}
            />
          );
          lines.push(
            <text
              key="exclamation"
              x={midAbusiveX}
              y={midAbusiveY + 2}
              textAnchor="middle"
              style={{ fontSize: '8px', fill: '#ffffff', fontWeight: 'bold', pointerEvents: 'none' }}
            >
              !
            </text>
          );
          return lines;
          
        case 'shield':
          const protectMidX = (x1 + x2) / 2;
          const protectMidY = (y1 + y2) / 2;
          
          lines.push(
            <line
              key="protect"
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={strokeColor}
              strokeWidth={strokeWidth + 1}
              style={{ pointerEvents: 'none' }}
            />
          );
          
          lines.push(
            <path
              key="shield"
              d={`M ${protectMidX-6} ${protectMidY-8} L ${protectMidX+6} ${protectMidY-8} L ${protectMidX+6} ${protectMidY+2} L ${protectMidX} ${protectMidY+8} L ${protectMidX-6} ${protectMidY+2} Z`}
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="1"
              style={{ pointerEvents: 'none' }}
            />
          );
          return lines;
          
        case 'heart-arrow':
          lines.push(
            <line
              key="care"
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              style={{ pointerEvents: 'none' }}
            />
          );
          
          const careAngle = Math.atan2(y2 - y1, x2 - x1);
          const careArrowSize = 10;
          lines.push(
            <polygon
              key="carearrow"
              points={`${x2 - Math.cos(careAngle - 0.3) * careArrowSize},${y2 - Math.sin(careAngle - 0.3) * careArrowSize} ${x2},${y2} ${x2 - Math.cos(careAngle + 0.3) * careArrowSize},${y2 - Math.sin(careAngle + 0.3) * careArrowSize}`}
              fill={strokeColor}
              style={{ pointerEvents: 'none' }}
            />
          );
          
          const heartX = x1 + (x2 - x1) * 0.3;
          const heartY = y1 + (y2 - y1) * 0.3;
          lines.push(
            <text
              key="heart"
              x={heartX}
              y={heartY}
              textAnchor="middle"
              style={{ fontSize: '12px', fill: '#ec4899', pointerEvents: 'none' }}
            >
              ♥
            </text>
          );
          return lines;
          
        case 'dollar-signs':
          lines.push(
            <line
              key="financial"
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray="8,4"
              style={{ pointerEvents: 'none' }}
            />
          );
          
          for (let i = 1; i <= 2; i++) {
            const t = i / 3;
            const dollarX = x1 + (x2 - x1) * t;
            const dollarY = y1 + (y2 - y1) * t;
            
            lines.push(
              <text
                key={`dollar-${i}`}
                x={dollarX}
                y={dollarY - 5}
                textAnchor="middle"
                style={{ fontSize: '10px', fill: '#10b981', fontWeight: 'bold', pointerEvents: 'none' }}
              >
                $
              </text>
            );
          }
          return lines;
          
        case 'supervision-eye':
          lines.push(
            <line
              key="supervised"
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray="6,6"
              style={{ pointerEvents: 'none' }}
            />
          );
          
          const supervisionMidX = (x1 + x2) / 2;
          const supervisionMidY = (y1 + y2) / 2;
          
          lines.push(
            <ellipse
              key="eye"
              cx={supervisionMidX}
              cy={supervisionMidY}
              rx="8"
              ry="5"
              fill="#ffffff"
              stroke={strokeColor}
              strokeWidth="1"
              style={{ pointerEvents: 'none' }}
            />
          );
          lines.push(
            <circle
              key="pupil"
              cx={supervisionMidX}
              cy={supervisionMidY}
              r="3"
              fill={strokeColor}
              style={{ pointerEvents: 'none' }}
            />
          );
          return lines;
          
        // For basic stroke patterns, fall through to default handling
        default:
          lines.push(
            <line
              key="default"
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              style={{ pointerEvents: 'none' }}
            />
          );
          return lines;
      }
    }
    
    // Now handle relationship type-based styles (original logic) only if no custom line style
    switch (relationship.type) {
      case 'best-friends':
      case 'hate':
        // Double lines with proper spacing (8px apart for better visibility)
        const spacing = 8;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const perpX = Math.cos(angle + Math.PI/2) * spacing/2;
        const perpY = Math.sin(angle + Math.PI/2) * spacing/2;
        
        lines.push(
          <line 
            key="line1"
            x1={x1 + perpX} 
            y1={y1 + perpY} 
            x2={x2 + perpX} 
            y2={y2 + perpY} 
            stroke={strokeColor} 
            strokeWidth={strokeWidth} 
            strokeDasharray={strokeDasharray} 
            style={{ pointerEvents: 'none' }} 
          />
        );
        lines.push(
          <line 
            key="line2"
            x1={x1 - perpX} 
            y1={y1 - perpY} 
            x2={x2 - perpX} 
            y2={y2 - perpY} 
            stroke={strokeColor} 
            strokeWidth={strokeWidth} 
            strokeDasharray={strokeDasharray} 
            style={{ pointerEvents: 'none' }} 
          />
        );
        break;
        
      case 'toxic':
        // Jagged/zigzag line for toxic relationships
        const segments = 10;
        const amplitude = 12;
        let pathData = `M ${x1} ${y1}`;
        
        for (let i = 1; i <= segments; i++) {
          const t = i / segments;
          const x = x1 + (x2 - x1) * t;
          const y = y1 + (y2 - y1) * t + (i % 2 === 0 ? amplitude : -amplitude);
          pathData += ` L ${x} ${y}`;
        }
        
        lines.push(
          <path
            key="zigzag"
            d={pathData}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            style={{ pointerEvents: 'none' }}
          />
        );
        break;
        
      case 'on-off':
        // Alternating solid/dashed segments
        const totalLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const segmentCount = 8;
        const segmentLength = totalLength / segmentCount;
        const lineAngle = Math.atan2(y2 - y1, x2 - x1);
        
        for (let i = 0; i < segmentCount; i++) {
          const startX = x1 + Math.cos(lineAngle) * segmentLength * i;
          const startY = y1 + Math.sin(lineAngle) * segmentLength * i;
          const endX = x1 + Math.cos(lineAngle) * segmentLength * (i + 1);
          const endY = y1 + Math.sin(lineAngle) * segmentLength * (i + 1);
          
          lines.push(
            <line
              key={`segment-${i}`}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={i % 2 === 0 ? '' : '6,4'}
              style={{ pointerEvents: 'none' }}
            />
          );
        }
        break;
        
      case 'complicated':
        // Wavy line for complicated relationships
        const waveAmplitude = 8;
        const frequency = 3;
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const steps = Math.max(30, length / 8);
        
        let wavePath = `M ${x1} ${y1}`;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const baseX = x1 + (x2 - x1) * t;
          const baseY = y1 + (y2 - y1) * t;
          
          // Add perpendicular wave
          const waveAngle = Math.atan2(y2 - y1, x2 - x1) + Math.PI/2;
          const waveOffset = Math.sin(t * Math.PI * frequency) * waveAmplitude;
          const x = baseX + Math.cos(waveAngle) * waveOffset;
          const y = baseY + Math.sin(waveAngle) * waveOffset;
          
          wavePath += ` L ${x} ${y}`;
        }
        
        lines.push(
          <path
            key="wave"
            d={wavePath}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            style={{ pointerEvents: 'none' }}
          />
        );
        break;
        
      case 'dependency':
      case 'codependent':
        // Triple line to show dependency/codependency
        const depAngle = Math.atan2(y2 - y1, x2 - x1);
        const depPerpX = Math.cos(depAngle + Math.PI/2) * 4;
        const depPerpY = Math.sin(depAngle + Math.PI/2) * 4;
        
        lines.push(
          <line 
            key="dep1" 
            x1={x1 + depPerpX} y1={y1 + depPerpY} 
            x2={x2 + depPerpX} y2={y2 + depPerpY} 
            stroke={strokeColor} 
            strokeWidth="1" 
            style={{ pointerEvents: 'none' }} 
          />
        );
        lines.push(
          <line 
            key="dep2" 
            x1={x1} y1={y1} 
            x2={x2} y2={y2} 
            stroke={strokeColor} 
            strokeWidth="3" 
            style={{ pointerEvents: 'none' }} 
          />
        );
        lines.push(
          <line 
            key="dep3" 
            x1={x1 - depPerpX} y1={y1 - depPerpY} 
            x2={x2 - depPerpX} y2={y2 - depPerpY} 
            stroke={strokeColor} 
            strokeWidth="1" 
            style={{ pointerEvents: 'none' }} 
          />
        );
        break;
        
      case 'manipulative':
        // Curved line with arrow showing manipulation direction
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 - 25; // Curve upward
        
        lines.push(
          <path
            key="curve"
            d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            style={{ pointerEvents: 'none' }}
          />
        );
        
        // Add arrow marker showing direction of manipulation
        const arrowAngle = Math.atan2(y2 - midY, x2 - midX);
        const arrowSize = 8;
        lines.push(
          <polygon
            key="arrow"
            points={`${x2 - Math.cos(arrowAngle - 0.5) * arrowSize},${y2 - Math.sin(arrowAngle - 0.5) * arrowSize} ${x2},${y2} ${x2 - Math.cos(arrowAngle + 0.5) * arrowSize},${y2 - Math.sin(arrowAngle + 0.5) * arrowSize}`}
            fill={strokeColor}
            style={{ pointerEvents: 'none' }}
          />
        );
        break;
        
      case 'supportive':
        // Gentle curved line upward
        const supportMidX = (x1 + x2) / 2;
        const supportMidY = (y1 + y2) / 2 - 15;
        
        lines.push(
          <path
            key="support"
            d={`M ${x1} ${y1} Q ${supportMidX} ${supportMidY} ${x2} ${y2}`}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            style={{ pointerEvents: 'none' }}
          />
        );
        break;
        
      case 'competitive':
        // Double line with proper spacing showing competition
        const compAngle = Math.atan2(y2 - y1, x2 - x1);
        const compPerpX = Math.cos(compAngle + Math.PI/2) * 5;
        const compPerpY = Math.sin(compAngle + Math.PI/2) * 5;
        
        lines.push(
          <line
            key="comp1"
            x1={x1 + compPerpX} y1={y1 + compPerpY}
            x2={x2 + compPerpX} y2={y2 + compPerpY}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            style={{ pointerEvents: 'none' }}
          />
        );
        lines.push(
          <line
            key="comp2"
            x1={x1 - compPerpX} y1={y1 - compPerpY}
            x2={x2 - compPerpX} y2={y2 - compPerpY}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            style={{ pointerEvents: 'none' }}
          />
        );
        break;
        
      case 'abusive':
        // Sharp angular line with harsh markers
        const abusiveSegments = 6;
        const harshness = 15;
        let abusivePath = `M ${x1} ${y1}`;
        
        for (let i = 1; i <= abusiveSegments; i++) {
          const t = i / abusiveSegments;
          const x = x1 + (x2 - x1) * t;
          const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * harshness;
          abusivePath += ` L ${x} ${y}`;
        }
        
        lines.push(
          <path
            key="abusive"
            d={abusivePath}
            stroke="#dc2626"
            strokeWidth={strokeWidth + 1}
            fill="none"
            style={{ pointerEvents: 'none' }}
          />
        );
        
        // Add warning triangles
        const midAbusiveX = (x1 + x2) / 2;
        const midAbusiveY = (y1 + y2) / 2;
        lines.push(
          <polygon
            key="warning"
            points={`${midAbusiveX},${midAbusiveY-8} ${midAbusiveX-6},${midAbusiveY+4} ${midAbusiveX+6},${midAbusiveY+4}`}
            fill="#dc2626"
            stroke="#ffffff"
            strokeWidth="1"
            style={{ pointerEvents: 'none' }}
          />
        );
        lines.push(
          <text
            key="exclamation"
            x={midAbusiveX}
            y={midAbusiveY + 2}
            textAnchor="middle"
            style={{ fontSize: '8px', fill: '#ffffff', fontWeight: 'bold', pointerEvents: 'none' }}
          >
            !
          </text>
        );
        break;
        
      case 'protective':
        // Shield-like styling
        const protectMidX = (x1 + x2) / 2;
        const protectMidY = (y1 + y2) / 2;
        
        lines.push(
          <line
            key="protect"
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={strokeColor}
            strokeWidth={strokeWidth + 1}
            style={{ pointerEvents: 'none' }}
          />
        );
        
        // Shield symbol
        lines.push(
          <path
            key="shield"
            d={`M ${protectMidX-6} ${protectMidY-8} L ${protectMidX+6} ${protectMidY-8} L ${protectMidX+6} ${protectMidY+2} L ${protectMidX} ${protectMidY+8} L ${protectMidX-6} ${protectMidY+2} Z`}
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth="1"
            style={{ pointerEvents: 'none' }}
          />
        );
        break;
        
      case 'caregiver':
        // One-way arrow with heart
        lines.push(
          <line
            key="care"
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            style={{ pointerEvents: 'none' }}
          />
        );
        
        // Arrow pointing to care recipient
        const careAngle = Math.atan2(y2 - y1, x2 - x1);
        const careArrowSize = 10;
        lines.push(
          <polygon
            key="carearrow"
            points={`${x2 - Math.cos(careAngle - 0.3) * careArrowSize},${y2 - Math.sin(careAngle - 0.3) * careArrowSize} ${x2},${y2} ${x2 - Math.cos(careAngle + 0.3) * careArrowSize},${y2 - Math.sin(careAngle + 0.3) * careArrowSize}`}
            fill={strokeColor}
            style={{ pointerEvents: 'none' }}
          />
        );
        
        // Heart symbol
        const heartX = x1 + (x2 - x1) * 0.3;
        const heartY = y1 + (y2 - y1) * 0.3;
        lines.push(
          <text
            key="heart"
            x={heartX}
            y={heartY}
            textAnchor="middle"
            style={{ fontSize: '12px', fill: '#ec4899', pointerEvents: 'none' }}
          >
            ♥
          </text>
        );
        break;
        
      case 'financial-dependency':
        // Line with $ symbols
        lines.push(
          <line
            key="financial"
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray="8,4"
            style={{ pointerEvents: 'none' }}
          />
        );
        
        // Dollar signs along the line
        for (let i = 1; i <= 2; i++) {
          const t = i / 3;
          const dollarX = x1 + (x2 - x1) * t;
          const dollarY = y1 + (y2 - y1) * t;
          
          lines.push(
            <text
              key={`dollar-${i}`}
              x={dollarX}
              y={dollarY - 5}
              textAnchor="middle"
              style={{ fontSize: '10px', fill: '#10b981', fontWeight: 'bold', pointerEvents: 'none' }}
            >
              $
            </text>
          );
        }
        break;
        
      case 'supervised-contact':
        // Dashed line with supervision markers
        lines.push(
          <line
            key="supervised"
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray="6,6"
            style={{ pointerEvents: 'none' }}
          />
        );
        
        // Eye symbol for supervision
        const supervisionMidX = (x1 + x2) / 2;
        const supervisionMidY = (y1 + y2) / 2;
        
        lines.push(
          <ellipse
            key="eye"
            cx={supervisionMidX}
            cy={supervisionMidY}
            rx="8"
            ry="5"
            fill="#ffffff"
            stroke={strokeColor}
            strokeWidth="1"
            style={{ pointerEvents: 'none' }}
          />
        );
        lines.push(
          <circle
            key="pupil"
            cx={supervisionMidX}
            cy={supervisionMidY}
            r="3"
            fill={strokeColor}
            style={{ pointerEvents: 'none' }}
          />
        );
        break;
        
      default:
        // Standard single line
        lines.push(
          <line
            key="default"
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            style={{ pointerEvents: 'none' }}
          />
        );
        break;
    }
    
    return lines;
  };

  // Handle bubble dragging with pointer events
  const bubblePointerDownHandler = (e) => handleBubblePointerDownWithRightClick(e, x1, y1, x2, y2);

  // Determine line style
  let strokeDasharray = '';
  const lineStyle = relationship.lineStyle || 'default';
  
  if (lineStyle !== 'default') {
    // Handle enhanced line styles that override the main rendering
    const enhancedStyles = [
      'double-line', 'toxic-zigzag', 'wavy', 'on-off-segments', 
      'triple-line', 'curved-arrow', 'gentle-curve', 'parallel',
      'angular-warning', 'shield', 'heart-arrow', 'dollar-signs', 'supervision-eye'
    ];
    
    if (enhancedStyles.includes(lineStyle)) {
      // These will be handled by renderRelationshipLines with the lineStyle override
    } else {
      // Basic stroke patterns
      const lineStyles = {
        'solid': '',
        'dashed': '6,4',
        'dotted': '2,2',
        'long-dash': '12,6',
        'dash-dot': '8,4,2,4',
        'dash-dot-dot': '8,4,2,4,2,4',
        'long-short': '12,3,3,3',
        'sparse-dots': '2,8',
        'dense-dots': '1,3'
      };
      strokeDasharray = lineStyles[lineStyle] || '';
    }
  } else {
    // Default styles based on relationship type
    const typeStyles = {
      'engagement': '5,5',
      'dating': '5,5',
      'cohabitation': '3,3',
      'distant': '10,5',
      'separation': '10,5',
      'cutoff': '2,2'
    };
    strokeDasharray = typeStyles[relationship.type] || '';
  }

  // Enhanced color handling
  let strokeColor = relationship.color || '#000000';
  let strokeWidth = baseLineWidth;
  
  // NOTE: Connection status is now shown via badges, not line style
  // This preserves line styles for relationship semantics (toxic, distant, etc.)
  
  // Color overrides for specific relationship types
  const colorOverrides = {
    'toxic': '#7c2d12',
    'abusive': '#dc2626',
    'conflict': '#dc2626',
    'cutoff': '#dc2626',
    'hostile': '#dc2626',
    'hate': '#b91c1c',
    'manipulative': '#9333ea',
    'best-friends': '#10b981',
    'supportive': '#06d6a0',
    'love': '#ec4899',
    'protective': '#10b981',
    'caregiver': '#ec4899',
    'financial-dependency': '#10b981',
    'supervised-contact': '#f59e0b',
    'dependency': '#6366f1',
    'codependent': '#6366f1',
    'complicated': '#f59e0b',
    'on-off': '#f97316',
    'competitive': '#8b5cf6',
    'indifferent': '#6b7280'
  };
  
  if (colorOverrides[relationship.type] && !relationship.color) {
    strokeColor = colorOverrides[relationship.type];
  }
  
  // Width overrides for certain types
  const widthOverrides = {
    'marriage': 1.5,
    'separation': 1.5,
    'divorce': 1.5,
    'conflict': 1.5,
    'cutoff': 1.5,
    'fused': 2,
    'hate': 1.5,
    'widowed': 1.5,
    'toxic': 1.5,
    'abusive': 2
  };
  
  const widthMultiplier = widthOverrides[relationship.type] || 1;
  strokeWidth = baseLineWidth * widthMultiplier;

  // Calculate bubble position
  const bubblePos = relationship.bubblePosition || 0.5;
  const bubbleX = x1 + (x2 - x1) * bubblePos;
  const bubbleY = y1 + (y2 - y1) * bubblePos;

  // Format dates for label
  const formatDateForLabel = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.getFullYear().toString();
    } catch (e) {
      return '';
    }
  };

  const startYear = formatDateForLabel(relationship.startDate);
  const endYear = formatDateForLabel(relationship.endDate);
  
  let dateLabel = '';
  if (startYear && endYear) {
    dateLabel = `${startYear}-${endYear}`;
  } else if (startYear) {
    dateLabel = startYear;
  } else if (endYear) {
    dateLabel = `Ended ${endYear}`;
  }

  const fullLabel = [relationship.abbr, dateLabel].filter(Boolean).join(' ');

  // Get responsive sizes
  const bubbleRadius = breakpoint === 'xs' ? 12 : 10;
  const labelFontSize = breakpoint === 'xs' ? '12px' : '11px';

  return (
    <g style={{ opacity: isRelationshipHighlighted ? 1 : 0.3 }}>
      {/* Invisible wider line for easier interaction */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="transparent"
        strokeWidth={breakpoint === 'xs' ? '30' : '20'}
        style={{ cursor: isConnecting ? 'not-allowed' : 'pointer', touchAction: 'none' }}
        onClick={handleLineClick}
        onPointerDown={handleLinePointerDownWithRightClick}
        onContextMenu={handleLineRightClick}
      />
      
      {/* Title/tooltip for the line */}
      <title>
        {relationship.type} relationship • Click to select • Drag handle to move family • Right-click for options
      </title>
      
      {/* Render the enhanced relationship lines */}
      {renderRelationshipLines(x1, y1, x2, y2, relationship, strokeColor, strokeWidth, strokeDasharray)}
      
      {/* Connection Status Badge for Family Finding */}
      {showConnectionBadges && (() => {
        const connectionStatus = relationship.connectionStatus || 'confirmed';
        if (connectionStatus === 'confirmed') return null; // No badge for confirmed connections
        
        const statusConfig = getConnectionStatusConfig(connectionStatus);
        const badgeSize = 20;
        
        // Position badge at 1/4 along the line (away from bubble at 0.5)
        const badgePos = 0.25;
        const badgeCenterX = x1 + (x2 - x1) * badgePos;
        const badgeCenterY = y1 + (y2 - y1) * badgePos;
        
        // Calculate perpendicular offset (to the side of the line)
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lineLength = Math.sqrt(dx * dx + dy * dy);
        const perpX = -dy / lineLength;
        const perpY = dx / lineLength;
        const offsetDistance = 25; // pixels to offset from line
        
        const badgeX = badgeCenterX + perpX * offsetDistance;
        const badgeY = badgeCenterY + perpY * offsetDistance;
        
        // Icon based on status
        let icon = '?';
        if (connectionStatus === ConnectionStatus.POTENTIAL) icon = '?';
        else if (connectionStatus === ConnectionStatus.EXPLORING) icon = '🔍';
        else if (connectionStatus === ConnectionStatus.RULED_OUT) icon = '✗';
        
        return (
          <g style={{ pointerEvents: 'none' }}>
            {/* Leader line connecting badge to relationship line */}
            <line
              x1={badgeCenterX}
              y1={badgeCenterY}
              x2={badgeX}
              y2={badgeY}
              stroke={statusConfig.color}
              strokeWidth="1.5"
              strokeDasharray="2,2"
              opacity="0.6"
            />
            {/* Badge background circle with subtle shadow */}
            <circle
              cx={badgeX}
              cy={badgeY}
              r={badgeSize / 2 + 2}
              fill="rgba(0,0,0,0.15)"
              style={{ filter: 'blur(3px)' }}
            />
            <circle
              cx={badgeX}
              cy={badgeY}
              r={badgeSize / 2}
              fill={statusConfig.color}
              stroke="white"
              strokeWidth="2.5"
              opacity="0.95"
            />
            {/* Icon/text */}
            <text
              x={badgeX}
              y={badgeY + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontSize: '12px',
                fill: 'white',
                fontWeight: 'bold',
                pointerEvents: 'none',
                userSelect: 'none'
              }}
            >
              {icon}
            </text>
            {/* Tooltip title */}
            <title>{statusConfig.label} Connection</title>
          </g>
        );
      })()}
      
      {/* Placement Status Badge for Family Finding */}
      {showPlacementBadges && (() => {
        const placementStatus = relationship.placementStatus;
        if (!placementStatus || placementStatus === 'not_applicable') return null;
        
        const statusConfig = getPlacementStatusConfig(placementStatus);
        const badgeSize = 22;
        
        // Position badge at 3/4 along the line (opposite side from connection badge)
        const badgePos = 0.75;
        const badgeCenterX = x1 + (x2 - x1) * badgePos;
        const badgeCenterY = y1 + (y2 - y1) * badgePos;
        
        // Calculate perpendicular offset (opposite side from connection badge)
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lineLength = Math.sqrt(dx * dx + dy * dy);
        const perpX = -dy / lineLength;
        const perpY = dx / lineLength;
        const offsetDistance = 28; // pixels to offset from line
        
        const badgeX = badgeCenterX + perpX * offsetDistance;
        const badgeY = badgeCenterY + perpY * offsetDistance;
        
        // Icon based on status (from config)
        const icon = statusConfig.icon || '●';
        
        return (
          <g style={{ pointerEvents: 'none' }}>
            {/* Leader line connecting badge to relationship line */}
            <line
              x1={badgeCenterX}
              y1={badgeCenterY}
              x2={badgeX}
              y2={badgeY}
              stroke={statusConfig.color}
              strokeWidth="1.5"
              strokeDasharray="2,2"
              opacity="0.6"
            />
            {/* Badge background circle with subtle shadow */}
            <circle
              cx={badgeX}
              cy={badgeY}
              r={badgeSize / 2 + 2}
              fill="rgba(0,0,0,0.15)"
              style={{ filter: 'blur(3px)' }}
            />
            <circle
              cx={badgeX}
              cy={badgeY}
              r={badgeSize / 2}
              fill={statusConfig.color}
              stroke="white"
              strokeWidth="2.5"
              opacity="0.95"
            />
            {/* Icon/text */}
            <text
              x={badgeX}
              y={badgeY + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontSize: '13px',
                fill: 'white',
                fontWeight: 'bold',
                pointerEvents: 'none',
                userSelect: 'none'
              }}
            >
              {icon}
            </text>
            {/* Tooltip title */}
            <title>{statusConfig.label}</title>
          </g>
        );
      })()}
      
      {/* Standard relationship-specific decorations that aren't handled by renderRelationshipLines */}
      {relationship.type === 'separation' && (
        <line 
          x1={bubbleX - 5} 
          y1={bubbleY - 5} 
          x2={bubbleX + 5} 
          y2={bubbleY + 5} 
          stroke="#000000" 
          strokeWidth={baseLineWidth * 1.5} 
        />
      )}
      
      {relationship.type === 'divorce' && (
        <>
          <line 
            x1={bubbleX - 8} 
            y1={bubbleY - 8} 
            x2={bubbleX + 8} 
            y2={bubbleY + 8} 
            stroke="#000" 
            strokeWidth={baseLineWidth * 1.5} 
          />
          <line 
            x1={bubbleX - 8} 
            y1={bubbleY + 8} 
            x2={bubbleX + 8} 
            y2={bubbleY - 8} 
            stroke="#000" 
            strokeWidth={baseLineWidth * 1.5} 
          />
        </>
      )}
      
      {relationship.type === 'cutoff' && (
        <>
          <line 
            x1={bubbleX - 6} 
            y1={bubbleY - 10} 
            x2={bubbleX - 6} 
            y2={bubbleY + 10} 
            stroke="#dc2626" 
            strokeWidth={baseLineWidth * 1.5} 
          />
          <line 
            x1={bubbleX + 6} 
            y1={bubbleY - 10} 
            x2={bubbleX + 6} 
            y2={bubbleY + 10} 
            stroke="#dc2626" 
            strokeWidth={baseLineWidth * 1.5} 
          />
        </>
      )}
      
      {relationship.type === 'love' && (
        <text 
          x={bubbleX} 
          y={bubbleY - 4} 
          textAnchor="middle" 
          style={{ fontSize: '14px', fill: strokeColor, pointerEvents: 'none' }}
        >
          ❤
        </text>
      )}
      
      {relationship.type === 'fused' && (
        <circle 
          cx={bubbleX} 
          cy={bubbleY} 
          r="8" 
          fill={strokeColor} 
          style={{ pointerEvents: 'none' }} 
        />
      )}
      
      {relationship.type === 'adoption' && (
        <polygon 
          points={`${bubbleX},${bubbleY} ${bubbleX - 8},${bubbleY - 8} ${bubbleX - 8},${bubbleY + 8}`} 
          fill={strokeColor} 
          style={{ pointerEvents: 'none' }} 
        />
      )}
      
      {/* Date/abbreviation label */}
      {fullLabel && showRelationshipBubbles !== 'hidden' && (
        <g>
          <rect
            x={bubbleX - (fullLabel.length * 4)}
            y={bubbleY - 25}
            width={fullLabel.length * 8}
            height={16}
            fill="rgba(255, 255, 255, 0.9)"
            rx="4"
            style={{ pointerEvents: 'none' }}
          />
          <text
            x={bubbleX}
            y={bubbleY - 14}
            textAnchor="middle"
            style={{ 
              fontSize: labelFontSize, 
              fontWeight: '600', 
              fill: '#374151', 
              pointerEvents: 'none' 
            }}
          >
            {fullLabel}
          </text>
        </g>
      )}
      
      {/* Draggable bubble for all relationships (except child) */}
      {relationship.type !== 'child' && showRelationshipBubbles !== 'hidden' && (
        <g>
          {/* Mac-specific: Add a larger invisible hit area for better right-click detection */}
          {isMac && (
            <circle
              cx={bubbleX}
              cy={bubbleY}
              r={bubbleRadius + 10}
              fill="transparent"
              style={{ 
                cursor: isDraggingBubble ? 'grabbing' : 'grab', 
                touchAction: 'none',
                pointerEvents: 'all'
              }}
              onPointerDown={(e) => {
                if (e.button === 2) {
                  // Right-click handling
                  e.preventDefault();
                  e.stopPropagation();
                  
                  actions.setContextMenu({
                    type: 'relationship',
                    relationship: relationship,
                    x: e.clientX,
                    y: e.clientY
                  });
                  
                  actions.selectRelationship(relationship);
                } else {
                  // Handle regular bubble interaction
                  bubblePointerDownHandler(e);
                }
              }}
              onContextMenu={handleLineRightClick}
            />
          )}
          
          {/* Regular partnership bubble - only show circle if mode is 'full' */}
          {showRelationshipBubbles === 'full' && (
            <circle
              cx={bubbleX}
              cy={bubbleY}
              r={isRelationshipHighlighted ? bubbleRadius + 2 : bubbleRadius}
              fill="white"
              stroke={isRelationshipHighlighted ? '#f59e0b' : strokeColor}
              strokeWidth={isRelationshipHighlighted ? 3 : 2}
              style={{ cursor: isDraggingBubble ? 'grabbing' : 'grab', touchAction: 'none' }}
              onPointerDown={(e) => {
              if (e.button === 0) { // Left button
                e.stopPropagation();
                e.preventDefault();

                // Store initial position
                const startX = e.clientX;
                const startY = e.clientY;
                let hasMoved = false;
                const DRAG_THRESHOLD = 3; // pixels to move before considering it a drag

                const handlePointerMove = (moveEvent) => {
                  // Calculate distance moved
                  const currentX = moveEvent.clientX;
                  const currentY = moveEvent.clientY;
                  const deltaX = Math.abs(currentX - startX);
                  const deltaY = Math.abs(currentY - startY);

                  // Mark as moved if exceeded threshold
                  if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
                    hasMoved = true;
                  }
                };

                const handlePointerUp = (upEvent) => {
                  // Clean up listeners
                  document.removeEventListener('pointermove', handlePointerMove);
                  document.removeEventListener('pointerup', handlePointerUp);
                  document.removeEventListener('pointercancel', handlePointerUp);

                  // If we didn't move, this was just a click
                  if (!hasMoved) {
                    handleBubbleClick(e);
                  }
                };

                // Set up temporary listeners to detect click vs drag
                document.addEventListener('pointermove', handlePointerMove);
                document.addEventListener('pointerup', handlePointerUp);
                document.addEventListener('pointercancel', handlePointerUp);

                // Immediately call the drag handler - it will handle the actual dragging
                bubblePointerDownHandler(e);
              }
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              
              console.log('Bubble double-clicked - adding child');
              console.log('actions.addChildToRelationship exists?', !!actions.addChildToRelationship);
              console.log('relationship.id:', relationship.id);
              
              // If a connection was started from the first click of the
              // double-click sequence, cancel it so the child can be added
              if (isConnecting) {
                console.log('Cancelling connection mode for double click');
                if (actions.cancelConnection) {
                  actions.cancelConnection();
                }
              }
              
              // Direct child creation on double-click
              if (actions && actions.addChildToRelationship) {
                console.log('Calling addChildToRelationship...');
                actions.addChildToRelationship(relationship.id);
              } else {
                console.error('addChildToRelationship action not available');
              }
            }}
            onContextMenu={handleLineRightClick}
          />
          )}
          
          {/* Hint text */}
          <title>Drag to move • Double-click to add child • Right-click for menu</title>
          
          {/* Add "A" label for adoption relationships */}
          {relationship.type === 'adoption' && (
            <text
              x={relationship.from === relationship.to ? fromPerson.x + 60 : bubbleX}
              y={relationship.from === relationship.to ? fromPerson.y + 35 : bubbleY + 5}
              textAnchor="middle"
              style={{ 
                fontSize: breakpoint === 'xs' ? '11px' : '10px', 
                fill: strokeColor, 
                pointerEvents: 'none',
                fontWeight: 'bold'
              }}
            >
              A
            </text>
          )}
        </g>
      )}

      {/* Relationship Attributes Icons */}
      {relationship.attributes && relationship.attributes.length > 0 && (
        <g>
          {relationship.attributes.slice(0, 3).map((attrId, index) => {
            const attr = getAttributeById(attrId, state.customAttributes || []);
            if (!attr) return null;

            const iconSize = 14;
            const spacing = 18;
            const startX = bubbleX - (relationship.attributes.slice(0, 3).length * spacing) / 2 + (index * spacing);
            const iconY = bubbleY + 20;

            return (
              <g key={attrId}>
                {/* Icon background circle */}
                <circle
                  cx={startX}
                  cy={iconY}
                  r={iconSize / 2}
                  fill="white"
                  stroke={attr.color}
                  strokeWidth="1.5"
                  style={{ pointerEvents: 'none' }}
                />
                {/* Icon text/emoji */}
                <text
                  x={startX}
                  y={iconY + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontSize: '9px',
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                >
                  {attr.icon}
                </text>
              </g>
            );
          })}
          {/* Show "+N" if more than 3 attributes */}
          {relationship.attributes.length > 3 && (
            <g>
              <circle
                cx={bubbleX + ((relationship.attributes.slice(0, 3).length * 18) / 2) + 9}
                cy={bubbleY + 20}
                r={7}
                fill="#e2e8f0"
                stroke="#94a3b8"
                strokeWidth="1"
                style={{ pointerEvents: 'none' }}
              />
              <text
                x={bubbleX + ((relationship.attributes.slice(0, 3).length * 18) / 2) + 9}
                y={bubbleY + 21}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontSize: '8px',
                  fill: '#64748b',
                  fontWeight: '600',
                  pointerEvents: 'none'
                }}
              >
                +{relationship.attributes.length - 3}
              </text>
            </g>
          )}
        </g>
      )}

      {/* Delete button when selected */}
      {isSelected && (
        <g
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            actions.setDeleteConfirmation({
              type: 'relationship',
              title: 'Delete Relationship',
              message: `Delete this ${relationship.type} relationship?`,
              onConfirm: () => {
                actions.deleteRelationship(relationship.id);
                actions.setDeleteConfirmation(null);
              },
              onCancel: () => actions.setDeleteConfirmation(null)
            });
          }}
        >
          <circle
            cx={bubbleX}
            cy={bubbleY - 30}
            r={breakpoint === 'xs' ? 10 : 8}
            fill="#ffffff"
            stroke="#ef4444"
            strokeWidth="2"
          />
          <text
            x={bubbleX}
            y={bubbleY - (breakpoint === 'xs' ? 25 : 26)}
            textAnchor="middle"
            style={{ 
              fontSize: breakpoint === 'xs' ? '14px' : '12px', 
              fill: '#ef4444', 
              pointerEvents: 'none', 
              fontWeight: 'bold' 
            }}
          >
            ×
          </text>
        </g>
      )}
    </g>
  );
};

// Separate component for child relationships
const ChildRelationship = ({ relationship, people, relationships, isHighlighted, breakpoint }) => {
  const { state, actions } = useGenogram();
  const elementRef = useRef(null);
  const svgRef = useRef(null);
  const hasPointerCapture = useRef(false);
  
  // Handle dragging of child relationship lines - MUST BE BEFORE ANY RETURNS
  const handleChildLinePointerDown = useCallback((e) => {
    e.stopPropagation();
    
    if (e.button !== 0) return; // Only left button
    
    const element = e.currentTarget;
    const svg = element?.closest('svg');
    const pointerId = e.pointerId;
    
    if (!svg || !element) return;
    
    elementRef.current = element;
    svgRef.current = svg;
    
    // Safely set pointer capture
    hasPointerCapture.current = false;
    try {
      element.setPointerCapture(pointerId);
      hasPointerCapture.current = true;
    } catch (err) {
      // Continue without capture
    }
    
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgCoords = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    // Convert to canvas coordinates
    const startCanvasX = (svgCoords.x - state.pan.x) / state.zoom;
    const startCanvasY = (svgCoords.y - state.pan.y) / state.zoom;
    
    // Get child person for this relationship
    const childPerson = people.find(p => p.id === relationship.to);
    if (!childPerson) return;
    
    // Store initial position of child
    const initialChildX = childPerson.x;
    const initialChildY = childPerson.y;
    
    let hasDragged = false;
    const DRAG_THRESHOLD = 5;
    
    const handlePointerMove = (moveEvent) => {
      if (!svgRef.current) return;
      
      const pt = svgRef.current.createSVGPoint();
      pt.x = moveEvent.clientX;
      pt.y = moveEvent.clientY;
      const currentCoords = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
      
      const currentCanvasX = (currentCoords.x - state.pan.x) / state.zoom;
      const currentCanvasY = (currentCoords.y - state.pan.y) / state.zoom;
      
      const deltaX = currentCanvasX - startCanvasX;
      const deltaY = currentCanvasY - startCanvasY;
      
      // Check if we've moved enough
      if (!hasDragged && (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD)) {
        hasDragged = true;
      }
      
      if (hasDragged) {
        // Update child position
        actions.updatePerson(relationship.to, {
          x: initialChildX + deltaX,
          y: moveEvent.shiftKey ? initialChildY : initialChildY + deltaY
        });
      }
    };
    
    const handlePointerUp = (upEvent) => {
      // Safely release pointer capture
      if (hasPointerCapture.current && elementRef.current) {
        try {
          if (document.body.contains(elementRef.current) && elementRef.current.releasePointerCapture) {
            elementRef.current.releasePointerCapture(pointerId);
          }
        } catch (err) {
          // Ignore
        }
      }
      
      if (hasDragged) {
        // Save to history
        actions.saveToHistory({
          people: state.people,
          relationships: state.relationships,
          households: state.households,
          textBoxes: state.textBoxes
        });
      } else {
        // It was a click
        actions.selectRelationship(relationship);
      }
      
      hasPointerCapture.current = false;
      elementRef.current = null;
      svgRef.current = null;
      
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
    
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
  }, [relationship, people, actions, state]);
  
  // NOW we can do the conditional checks
  const parentRel = relationships.find(r => r.id === relationship.from);
  const childPerson = people.find(p => p.id === relationship.to);
  
  if (!parentRel || !childPerson) return null;
  
  const parent1 = people.find(p => p.id === parentRel.from);
  const parent2 = people.find(p => p.id === parentRel.to);
  
  if (!parent1 || !parent2) return null;
  
  // Calculate positions
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
  
  // Get responsive line width
  const lineWidth = getRelationshipLineWidth(breakpoint, false);
  
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
        style={{ cursor: 'pointer', touchAction: 'none' }}
        onPointerDown={handleChildLinePointerDown}
      />
      <line 
        x1={parentX} 
        y1={dropY} 
        x2={childX} 
        y2={dropY} 
        stroke="transparent" 
        strokeWidth="20"
        style={{ cursor: 'pointer', touchAction: 'none' }}
        onPointerDown={handleChildLinePointerDown}
      />
      <line 
        x1={childX} 
        y1={dropY} 
        x2={childX} 
        y2={childY} 
        stroke="transparent" 
        strokeWidth="20"
        style={{ cursor: 'pointer', touchAction: 'none' }}
        onPointerDown={handleChildLinePointerDown}
      />
      
      {/* Visible lines */}
      <line 
        x1={parentX} 
        y1={parentY} 
        x2={parentX} 
        y2={dropY} 
        stroke={parentRel.color || '#3b82f6'} 
        strokeWidth={lineWidth} 
        strokeDasharray={strokeDasharray}
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Horizontal line to child */}
      <line 
        x1={parentX} 
        y1={dropY} 
        x2={childX} 
        y2={dropY} 
        stroke={parentRel.color || '#3b82f6'} 
        strokeWidth={lineWidth} 
        strokeDasharray={strokeDasharray}
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Vertical line to child */}
      <line 
        x1={childX} 
        y1={dropY} 
        x2={childX} 
        y2={childY} 
        stroke={parentRel.color || '#3b82f6'} 
        strokeWidth={lineWidth} 
        strokeDasharray={strokeDasharray}
        style={{ pointerEvents: 'none' }}
      />
      
      <title>Click to select • Drag to move child</title>
    </g>
  );
};

export default Relationship;