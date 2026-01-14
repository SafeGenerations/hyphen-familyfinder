// ===== MobileCanvas.js - COMPLETE FILE WITH POINTER EVENTS =====
// src/src-modern/components/Canvas/MobileCanvas.js
import React, { useRef, useState, useEffect } from 'react';
import { useGenogram } from '../../contexts/GenogramContext';
import Person from '../Shapes/Person';
import Relationship from '../Shapes/Relationship';
import Household from '../Shapes/Household';
import TextBox from '../Shapes/TextBox';
import Grid from './Grid';

const MobileCanvas = ({ onDragStateChange }) => {
  const { state, actions } = useGenogram();
  const svgRef = useRef(null);
  const [isPinching, setIsPinching] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [pointerCache, setPointerCache] = useState([]);
  const [lastPinchDistance, setLastPinchDistance] = useState(0);
  const [pointerStartTime, setPointerStartTime] = useState(0);
  const [pointerStartPos, setPointerStartPos] = useState({ x: 0, y: 0 });
  const [lastTap, setLastTap] = useState({ time: 0, x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const longPressTimerRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const draggedItemRef = useRef(null);
  const hasMovedRef = useRef(false);
  const primaryPointerId = useRef(null);
  
  // Notify parent about drag state changes
  useEffect(() => {
    if (onDragStateChange) {
      onDragStateChange(isDraggingItem);
    }
  }, [isDraggingItem, onDragStateChange]);
  
  const {
    people,
    relationships,
    households,
    textBoxes,
    pan,
    zoom,
    snapToGrid,
    highlightNetwork,
    isDrawingHousehold,
    selectedPerson,
    selectedRelationship,
    selectedHousehold,
    selectedTextBox
  } = state;

  // Constants for better touch detection
  const LONG_PRESS_DURATION = 750;
  const MOVEMENT_THRESHOLD = 15; // Increased for better touch handling
  const DOUBLE_TAP_DELAY = 300;
  const DOUBLE_TAP_THRESHOLD = 30;
  const DRAG_THRESHOLD = 15; // Increased to prevent accidental cancellation of long press

  // Cleanup long press timer
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Helper to measure distance from point to line segment
  const pointToSegmentDistance = (px, py, x1, y1, x2, y2) => {
    const lineLenSq = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
    if (lineLenSq === 0) {
      return Math.hypot(px - x1, py - y1);
    }
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lineLenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return Math.hypot(px - projX, py - projY);
  };

  // Helper to check if point is inside polygon (for household detection)
  const pointInPolygon = (x, y, points) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      if (((points[i].y > y) !== (points[j].y > y)) &&
          (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Check what's at a given position
  const getItemAtPosition = (x, y) => {
    const TOUCH_RADIUS = 40;
    
    // Check for person
    const person = people.find(p => {
      const dx = x - (p.x + 30);
      const dy = y - (p.y + 30);
      return Math.sqrt(dx * dx + dy * dy) < TOUCH_RADIUS;
    });
    if (person) return { type: 'person', item: person };
    
    // Check for text box
    const textBox = textBoxes.find(t => {
      return x >= t.x && x <= t.x + t.width && 
             y >= t.y && y <= t.y + t.height;
    });
    if (textBox) return { type: 'textBox', item: textBox };
    
    // Check for household - improved with point-in-polygon detection
    const household = households.find(h => {
      // First do a quick bounding box check for performance
      const minX = Math.min(...h.points.map(p => p.x));
      const maxX = Math.max(...h.points.map(p => p.x));
      const minY = Math.min(...h.points.map(p => p.y));
      const maxY = Math.max(...h.points.map(p => p.y));
      
      if (x < minX || x > maxX || y < minY || y > maxY) {
        return false; // Outside bounding box
      }
      
      // If inside bounding box, do accurate point-in-polygon test
      return pointInPolygon(x, y, h.points);
    });
    if (household) return { type: 'household', item: household };

    // Check for relationship line
    for (const rel of relationships) {
      if (rel.type === 'child') {
        const parentRel = relationships.find(r => r.id === rel.from);
        const child = people.find(p => p.id === rel.to);
        const p1 = people.find(p => p.id === parentRel?.from);
        const p2 = people.find(p => p.id === parentRel?.to);
        if (!parentRel || !child || !p1 || !p2) continue;

        const x1 = p1.x + 30;
        const y1 = p1.y + 30;
        const x2 = p2.x + 30;
        const y2 = p2.y + 30;
        const bubble = parentRel.bubblePosition || 0.5;
        const midX = x1 + (x2 - x1) * bubble;
        const midY = y1 + (y2 - y1) * bubble;
        const dropY = midY + 60;
        const childX = child.x + 30;
        const childY = child.y + 30;

        const d1 = pointToSegmentDistance(x, y, midX, midY, midX, dropY);
        const d2 = pointToSegmentDistance(x, y, midX, dropY, childX, dropY);
        const d3 = pointToSegmentDistance(x, y, childX, dropY, childX, childY);
        if (Math.min(d1, d2, d3) < 20) return { type: 'relationship', item: rel };
      } else {
        const fromPerson = people.find(p => p.id === rel.from);
        const toPerson = people.find(p => p.id === rel.to);
        if (!fromPerson || !toPerson) continue;

        const x1 = fromPerson.x + 30;
        const y1 = fromPerson.y + 30;
        const x2 = toPerson.x + 30;
        const y2 = toPerson.y + 30;

        const distance = pointToSegmentDistance(x, y, x1, y1, x2, y2);
        if (distance < 20) return { type: 'relationship', item: rel };
      }
    }

    return null;
  };

  // Update pointer cache
  const updatePointerCache = (e) => {
    const index = pointerCache.findIndex(p => p.pointerId === e.pointerId);
    const pointer = { pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY };
    
    if (index === -1) {
      setPointerCache([...pointerCache, pointer]);
    } else {
      const newCache = [...pointerCache];
      newCache[index] = pointer;
      setPointerCache(newCache);
    }
  };

  // Remove from pointer cache
  const removePointerCache = (e) => {
    setPointerCache(pointerCache.filter(p => p.pointerId !== e.pointerId));
  };

  // Calculate pinch distance
  const getPinchDistance = (pointers) => {
    if (pointers.length < 2) return 0;
    const dx = pointers[0].clientX - pointers[1].clientX;
    const dy = pointers[0].clientY - pointers[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle pointer down
  const handlePointerDown = (e) => {
    // Capture the pointer
    e.currentTarget.setPointerCapture(e.pointerId);
    
    updatePointerCache(e);
    
    if (e.isPrimary) {
      primaryPointerId.current = e.pointerId;
      setPointerStartTime(Date.now());
      setPointerStartPos({ x: e.clientX, y: e.clientY });
      setHasMoved(false);
      hasMovedRef.current = false;
    }
    
    const currentPointers = [...pointerCache, { pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY }];
    
    if (currentPointers.length === 2) {
      // Start pinch zoom
      setIsPinching(true);
      setIsPanning(false);
      setIsDraggingItem(false);
      clearTimeout(longPressTimerRef.current);
      
      setLastPinchDistance(getPinchDistance(currentPointers));
    } else if (currentPointers.length === 1 && e.isPrimary) {
      // Get canvas coordinates
      const rect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      
      // Check what we're touching
      const touchedItem = getItemAtPosition(x, y);
      
      // Store initial position for drag
      dragStartPos.current = { x, y };
      
      // Check for double tap
      const now = Date.now();
      if (now - lastTap.time < DOUBLE_TAP_DELAY && 
          Math.abs(e.clientX - lastTap.x) < DOUBLE_TAP_THRESHOLD &&
          Math.abs(e.clientY - lastTap.y) < DOUBLE_TAP_THRESHOLD) {
        // Double tap detected
        handleDoubleTap();
        clearTimeout(longPressTimerRef.current);
      } else {
        // Start long press timer
        clearTimeout(longPressTimerRef.current);
        const longPressClientX = e.clientX;
        const longPressClientY = e.clientY;
        console.log('🔥 Starting long press timer');
        longPressTimerRef.current = setTimeout(() => {
          console.log('🔥 Long press timer fired', {
            hasMoved: hasMovedRef.current,
            isDragging: isDraggingItem,
            isPanning: isPanning
          });
          if (!hasMovedRef.current && !isDraggingItem && !isPanning) {
            console.log('🔥 Executing long press');
            handleLongPress(longPressClientX, longPressClientY);
          } else {
            console.log('🔥 Long press canceled - conditions not met');
          }
        }, LONG_PRESS_DURATION);
        
        if (touchedItem) {
          // Store the item AND its initial position for dragging
          setDraggedItem(touchedItem);
          draggedItemRef.current = {
            type: touchedItem.type,
            id: touchedItem.item.id,
            initialX: touchedItem.item.x,
            initialY: touchedItem.item.y,
            initialPoints: touchedItem.type === 'household' ? 
              touchedItem.item.points.map(p => ({...p})) : null
          };
        } else {
          // Touching empty space
          setDraggedItem(null);
          draggedItemRef.current = null;
        }
      }
      
      setLastTap({ time: now, x: e.clientX, y: e.clientY });
    }
  };

  // Handle pointer move
  const handlePointerMove = (e) => {
    // Update cache first
    const index = pointerCache.findIndex(p => p.pointerId === e.pointerId);
    if (index !== -1) {
      const newCache = [...pointerCache];
      newCache[index] = { pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY };
      setPointerCache(newCache);
    }
    
    // Only process moves for the primary pointer for single-touch gestures
    if (e.pointerId !== primaryPointerId.current && pointerCache.length < 2) return;
    
    // Calculate movement from start
    if (e.isPrimary) {
      const dx = Math.abs(e.clientX - pointerStartPos.x);
      const dy = Math.abs(e.clientY - pointerStartPos.y);
      
      if ((dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) && !hasMovedRef.current) {
        console.log('🔥 Movement detected, canceling long press', { dx, dy });
        hasMovedRef.current = true;
        setHasMoved(true);
        clearTimeout(longPressTimerRef.current); // Cancel long press if we start moving
      }
    }
    
    if (isPinching && pointerCache.length >= 2) {
      // Handle pinch zoom
      const distance = getPinchDistance(pointerCache);
      
      if (lastPinchDistance > 0) {
        const scale = distance / lastPinchDistance;
        const newZoom = Math.max(0.3, Math.min(3, zoom * scale));
        
        const centerX = (pointerCache[0].clientX + pointerCache[1].clientX) / 2;
        const centerY = (pointerCache[0].clientY + pointerCache[1].clientY) / 2;
        
        const rect = svgRef.current.getBoundingClientRect();
        const x = centerX - rect.left;
        const y = centerY - rect.top;
        
        const newPan = {
          x: x - (x - pan.x) * (newZoom / zoom),
          y: y - (y - pan.y) * (newZoom / zoom)
        };
        
        actions.setZoom(newZoom);
        actions.setPan(newPan);
      }
      
      setLastPinchDistance(distance);
    } else if (e.isPrimary && !isPinching) {
      const rect = svgRef.current.getBoundingClientRect();
      const currentX = (e.clientX - rect.left - pan.x) / zoom;
      const currentY = (e.clientY - rect.top - pan.y) / zoom;
      
      if (draggedItemRef.current && hasMovedRef.current) {
        // Drag the item
        setIsDraggingItem(true);
        
        // Calculate delta from initial touch position
        const deltaX = currentX - dragStartPos.current.x;
        const deltaY = currentY - dragStartPos.current.y;
        
        if (draggedItemRef.current.type === 'person') {
          // Use stored initial position for absolute positioning
          const newX = draggedItemRef.current.initialX + deltaX;
          const newY = draggedItemRef.current.initialY + deltaY;
          
          actions.updatePerson(draggedItemRef.current.id, {
            x: snapToGrid ? Math.round(newX / 20) * 20 : newX,
            y: snapToGrid ? Math.round(newY / 20) * 20 : newY
          });
        } else if (draggedItemRef.current.type === 'textBox') {
          const newX = draggedItemRef.current.initialX + deltaX;
          const newY = draggedItemRef.current.initialY + deltaY;
          
          actions.updateTextBox(draggedItemRef.current.id, {
            x: snapToGrid ? Math.round(newX / 20) * 20 : newX,
            y: snapToGrid ? Math.round(newY / 20) * 20 : newY
          });
        } else if (draggedItemRef.current.type === 'household') {
          if (draggedItemRef.current.initialPoints) {
            const newPoints = draggedItemRef.current.initialPoints.map(point => ({
              x: snapToGrid ? Math.round((point.x + deltaX) / 20) * 20 : point.x + deltaX,
              y: snapToGrid ? Math.round((point.y + deltaY) / 20) * 20 : point.y + deltaY
            }));
            actions.updateHousehold(draggedItemRef.current.id, { points: newPoints });
          }
        }
      } else if (!draggedItemRef.current && hasMovedRef.current && !isDrawingHousehold) {
        // Pan the canvas
        setIsPanning(true);
        
        const deltaX = e.clientX - lastTap.x;
        const deltaY = e.clientY - lastTap.y;
        
        actions.setPan({
          x: pan.x + deltaX,
          y: pan.y + deltaY
        });
        
        setLastTap({ time: lastTap.time, x: e.clientX, y: e.clientY });
      }
    }
  };


  // Handle pointer up/cancel
  const handlePointerUp = (e) => {
    // Release pointer capture safely
    try {
      if (e.currentTarget && typeof e.currentTarget.releasePointerCapture === 'function') {
        if (e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      }
    } catch (err) {
      // Ignore errors - pointer may have already been released
    }
    
    // Remove from cache before checking
    const updatedCache = pointerCache.filter(p => p.pointerId !== e.pointerId);
    setPointerCache(updatedCache);
    
    clearTimeout(longPressTimerRef.current);
    
    const pointerDuration = Date.now() - pointerStartTime;
    
    if (updatedCache.length === 0) {
      // Last pointer up
      
      // If we were dragging an item, save to history
      if (isDraggingItem) {
        actions.saveToHistory({
          people: state.people,
          relationships: state.relationships,
          households: state.households,
          textBoxes: state.textBoxes
        });
      }
      
      // If we have a dragged item that wasn't moved, select it
      if (draggedItemRef.current && !hasMovedRef.current && e.isPrimary) {
        handleTap(e.clientX, e.clientY);
      }
      
      setIsPinching(false);
      setIsPanning(false);
      setIsDraggingItem(false);
      setDraggedItem(null);
      draggedItemRef.current = null;
      hasMovedRef.current = false;
      setLastPinchDistance(0);
      primaryPointerId.current = null;
      
      // Only register as tap if it was quick, didn't move, and wasn't dragging
      if (pointerDuration < LONG_PRESS_DURATION && !hasMoved && !isPanning && !isPinching && !isDraggingItem && e.isPrimary) {
        handleTap(e.clientX, e.clientY);
      }
    }
  };

  // Handle tap (for selection)
  const handleTap = (clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    
    // Check what we tapped
    const tappedItem = getItemAtPosition(x, y);
    
    if (tappedItem) {
      // Visual feedback for tap
      showTapFeedback(clientX, clientY);
      
      // Select the item (will handle network toggling automatically if highlight mode is on)
      if (tappedItem.type === 'person') {
        // In mobile mode, single tap only selects without opening edit panel
        actions.selectPerson({ person: tappedItem.item, openPanel: false });
      } else if (tappedItem.type === 'textBox') {
        // In mobile mode, single tap only selects without opening edit panel
        actions.selectTextBox({ textBox: tappedItem.item, openPanel: false });
      } else if (tappedItem.type === 'household') {
        actions.selectHousehold(tappedItem.item);
      }
          } else {
        // Tapped empty space - clear selection and close menus
        if (!isDrawingHousehold) {
          actions.clearSelection();
          actions.setContextMenu(null);
          actions.setMobileMenuOpen(false);
        }
      }
  };

  // Handle long press (context menu)
  const handleLongPress = (clientX, clientY) => {
    console.log('🔥 handleLongPress called', { clientX, clientY });
    const rect = svgRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;

    const item = getItemAtPosition(x, y);
    console.log('🔥 Long press item found:', item);

    // Vibrate if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    if (item?.type === 'person') {
      // Only show context menu, don't open edit panel
      actions.setContextMenu({
        type: 'person',
        person: item.item,
        x: clientX,
        y: clientY
      });
    } else if (item?.type === 'relationship') {
      // Only show context menu, don't open edit panel
      actions.setContextMenu({
        type: 'relationship',
        relationship: item.item,
        x: clientX,
        y: clientY
      });
    } else if (item?.type === 'household') {
      // Show household context menu - THIS WAS MISSING!
      actions.setContextMenu({
        type: 'household',
        household: item.item,
        x: clientX,
        y: clientY
      });
      // Also select the household
      actions.selectHousehold(item.item);
    } else {
      actions.setContextMenu({
        type: 'canvas',
        x: clientX,
        y: clientY,
        canvasX: x,
        canvasY: y
      });
    }
  };

  // Show visual feedback for taps
  const showTapFeedback = (x, y) => {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: 40px;
      height: 40px;
      margin-left: -20px;
      margin-top: -20px;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.2);
      border: 2px solid rgba(59, 130, 246, 0.4);
      pointer-events: none;
      animation: tapRipple 0.4s ease-out;
      z-index: 9999;
    `;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      document.body.removeChild(feedback);
    }, 400);
  };

  // Handle double tap (fit to screen)
  const handleDoubleTap = () => {
    // Fit to screen
    if (people.length === 0) return;
    
    const padding = 50;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    people.forEach(person => {
      minX = Math.min(minX, person.x);
      minY = Math.min(minY, person.y);
      maxX = Math.max(maxX, person.x + 60);
      maxY = Math.max(maxY, person.y + 60);
    });
    
    const width = maxX - minX;
    const height = maxY - minY;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - 120; // Account for toolbars
    
    const scaleX = (viewportWidth - padding * 2) / width;
    const scaleY = (viewportHeight - padding * 2) / height;
    const newZoom = Math.min(scaleX, scaleY, 2);
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    actions.setZoom(newZoom);
    actions.setPan({
      x: viewportWidth / 2 - centerX * newZoom,
      y: viewportHeight / 2 - centerY * newZoom
    });
  };

  // Canvas click handler
  const handleCanvasClick = (e) => {
    // Only handle if clicking directly on canvas or grid
    if (e.target === svgRef.current || e.target.classList.contains('grid-line')) {
      if (!isDrawingHousehold) {
        actions.clearSelection();
      }
    }
  };

  // Highlighted people logic
  const highlightedPeople = new Set();
  if (highlightNetwork || state.selectedPerson || state.selectedRelationship) {
    people.forEach(person => {
      if (highlightNetwork && !person.networkMember) return;
      if (!highlightNetwork || person.networkMember) {
        highlightedPeople.add(person.id);
      }
    });
  } else {
    people.forEach(person => highlightedPeople.add(person.id));
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      overflow: 'hidden',
      touchAction: 'none',
      position: 'relative'
    }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ 
          cursor: isDrawingHousehold ? 'crosshair' : (isPanning ? 'grabbing' : 'grab'),
          background: '#fafbfc',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          touchAction: 'none'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleCanvasClick}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Grid */}
          {snapToGrid && <Grid />}
          
          {/* Households */}
          {households.map(household => (
            <Household key={household.id} household={household} />
          ))}
          
          {/* Relationships */}
          {relationships.map(relationship => (
            <Relationship 
              key={relationship.id} 
              relationship={relationship}
              people={people}
              relationships={relationships}
              isHighlighted={
                highlightedPeople.has(relationship.from) && 
                highlightedPeople.has(relationship.to)
              }
            />
          ))}
          
          {/* People */}
          {people.map(person => (
            <Person 
              key={person.id} 
              person={person}
              isHighlighted={highlightedPeople.has(person.id)}
            />
          ))}
          
          {/* Text boxes */}
          {textBoxes.map(textBox => (
            <TextBox key={textBox.id} textBox={textBox} />
          ))}
        </g>
      </svg>
      
      {/* Drag indicator */}
      {isDraggingItem && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(59, 130, 246, 0.9)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '600',
          pointerEvents: 'none',
          zIndex: 100
        }}>
          Dragging...
        </div>
      )}
      
      {/* Zoom indicator */}
      <div style={{
        position: 'absolute',
        bottom: '80px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        pointerEvents: 'none',
        opacity: isPinching ? 1 : 0,
        transition: 'opacity 0.2s'
      }}>
        {Math.round(zoom * 100)}%
      </div>
      
      {/* Touch hints */}
      {people.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '16px',
          padding: '20px',
          maxWidth: '300px'
        }}>
          <p style={{ marginBottom: '16px' }}>👆 Tap the Add button to start</p>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            Pinch to zoom • Drag to pan • Long press for options
          </p>
        </div>
      )}
      
      {/* Visual feedback for long press */}
      {pointerStartTime > 0 && !hasMoved && !isPanning && !isPinching && !isDraggingItem && (
        <div style={{
          position: 'absolute',
          left: pointerStartPos.x - 30,
          top: pointerStartPos.y - 30,
          width: 60,
          height: 60,
          borderRadius: '50%',
          border: '3px solid #3b82f6',
          opacity: 0.3,
          pointerEvents: 'none',
          animation: 'pulse 0.5s ease-out infinite'
        }} />
      )}
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes tapRipple {
          0% {
            opacity: 1;
            transform: scale(0.5);
          }
          100% {
            opacity: 0;
            transform: scale(2);
          }
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
};

export default MobileCanvas;