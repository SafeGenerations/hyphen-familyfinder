// ===== GenogramCanvas.js - COMPLETE FILE WITH POINTER EVENTS =====
// src/src-modern/components/Canvas/GenogramCanvas.js
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useGenogram } from '../../contexts/GenogramContext';
import { useResponsive } from '../../utils/responsive';
import Person from '../Shapes/Person';
import Relationship from '../Shapes/Relationship';
import Household from '../Shapes/Household';
import TextBox from '../Shapes/TextBox';
import Grid from './Grid';
import ConnectionLine from './ConnectionLine';
import HouseholdDrawing from './HouseholdDrawing';
import {
  buildFocusGraph,
  getConnectedNodeIds as getFocusConnectedNodeIds,
  createRelationshipLookup,
  getHighlightedRelationshipIds
} from '../../utils/focusMode';

const GenogramCanvas = () => {
  const { state, actions } = useGenogram();
  const { dimensions, breakpoint } = useResponsive();
  const svgRef = useRef(null);
  
  // Detect mobile to disable canvas long press (MobileToolbar handles long press instead)
  const isMobile = breakpoint === 'xs' || breakpoint === 'sm';
  
  // Pointer tracking states
  const [isPanning, setIsPanning] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [pointerCache, setPointerCache] = useState([]);
  const [lastPinchDistance, setLastPinchDistance] = useState(0);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lastPointerPos, setLastPointerPos] = useState({ x: 0, y: 0 });
  const primaryPointerId = useRef(null);
  const spacePressed = useRef(false);
  const activePointers = useRef(new Set());
  
  const {
    people,
    relationships,
    households,
    textBoxes,
    pan,
    zoom,
    isConnecting,
    connectingFrom,
    connectingType,
    connectionPreview,
    snapToGrid,
    highlightNetwork,
    focusedNodeId,
    isDrawingHousehold,
    currentHouseholdPoints,
    filteredNodes
  } = state;

  // Long press detection
  const LONG_PRESS_DURATION = 750;
  const LONG_PRESS_MOVE_THRESHOLD = 10;
  const longPressTimerRef = useRef(null);
  const longPressStartPos = useRef({ x: 0, y: 0 });
  const longPressMovedRef = useRef(false);
  const pointerDownTimeRef = useRef(0);

  const focusGraph = useMemo(() => buildFocusGraph(relationships), [relationships]);
  const relationshipLookup = useMemo(() => createRelationshipLookup(relationships), [relationships]);

  const connectedNodeIds = useMemo(
    () => getFocusConnectedNodeIds(focusedNodeId, focusGraph),
    [focusedNodeId, focusGraph]
  );

  const highlightedNodeIds = useMemo(() => {
    if (focusedNodeId) {
      const ids = new Set([focusedNodeId]);
      connectedNodeIds.forEach((id) => ids.add(id));
      return ids;
    }

    if (highlightNetwork) {
      const networkIds = new Set();
      people.forEach((person) => {
        if (person.networkMember) {
          networkIds.add(person.id);
        }
      });
      return networkIds;
    }

    return new Set(people.map((person) => person.id));
  }, [focusedNodeId, connectedNodeIds, highlightNetwork, people]);

  const relationshipVisibilityIds = (focusedNodeId || highlightNetwork) ? highlightedNodeIds : null;

  const highlightedRelationshipIds = useMemo(
    () =>
      getHighlightedRelationshipIds(
        relationships,
        relationshipVisibilityIds,
        relationshipLookup,
        focusedNodeId
      ),
    [relationships, relationshipVisibilityIds, relationshipLookup, focusedNodeId]
  );

  // Handle keyboard events for space + drag panning
  useEffect(() => {
    const isEditableTarget = (target) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      if (target.matches('input, textarea, select')) {
        return true;
      }

      if (target.isContentEditable) {
        return true;
      }

      const editableAncestor = target.closest('[contenteditable]');
      if (editableAncestor && editableAncestor.getAttribute('contenteditable') !== 'false') {
        return true;
      }

      return false;
    };

    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat && !isEditableTarget(e.target)) {
        e.preventDefault();
        spacePressed.current = true;
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.code === 'Space' && !isEditableTarget(e.target)) {
        e.preventDefault();
        spacePressed.current = false;
        if (isPanning && pointerCache.length === 0) {
          setIsPanning(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPanning, pointerCache.length]);

  // Clean up any lingering pointer captures on unmount
  useEffect(() => {
    const svgNode = svgRef.current;
    const pointerSet = activePointers.current;

    return () => {
      if (svgNode && pointerSet) {
        pointerSet.forEach(pointerId => {
          try {
            if (svgNode.hasPointerCapture && svgNode.hasPointerCapture(pointerId)) {
              svgNode.releasePointerCapture(pointerId);
            }
          } catch (e) {
            // Ignore errors during cleanup
          }
        });
        pointerSet.clear();
      }

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Calculate pinch distance
  const getPinchDistance = (pointers) => {
    if (pointers.length < 2) return 0;
    const dx = pointers[0].clientX - pointers[1].clientX;
    const dy = pointers[0].clientY - pointers[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Get canvas coordinates from client coordinates
  const getCanvasCoords = (clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom
    };
  };

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

  // Check what is under a coordinate
  const getItemAtPosition = (x, y) => {
    const TOUCH_RADIUS = 40;

    const person = people.find(p => {
      const dx = x - (p.x + 30);
      const dy = y - (p.y + 30);
      return Math.sqrt(dx * dx + dy * dy) < TOUCH_RADIUS;
    });
    if (person) return { type: 'person', item: person };

    const textBox = textBoxes.find(t => {
      return x >= t.x && x <= t.x + t.width &&
             y >= t.y && y <= t.y + t.height;
    });
    if (textBox) return { type: 'textBox', item: textBox };

    const household = households.find(h => {
      const minX = Math.min(...h.points.map(p => p.x));
      const maxX = Math.max(...h.points.map(p => p.x));
      const minY = Math.min(...h.points.map(p => p.y));
      const maxY = Math.max(...h.points.map(p => p.y));
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    });
    if (household) return { type: 'household', item: household };

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

  const handleLongPress = (clientX, clientY) => {
    const { x, y } = getCanvasCoords(clientX, clientY);

    const item = getItemAtPosition(x, y);

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

  // Safe pointer capture
  const safeSetPointerCapture = (element, pointerId) => {
    try {
      if (element && typeof element.setPointerCapture === 'function') {
        element.setPointerCapture(pointerId);
        activePointers.current.add(pointerId);
      }
    } catch (e) {
      console.warn('Failed to set pointer capture:', e);
    }
  };

  // Safe pointer release
  const safeReleasePointerCapture = (element, pointerId) => {
    try {
      if (element && typeof element.releasePointerCapture === 'function') {
        if (element.hasPointerCapture && element.hasPointerCapture(pointerId)) {
          element.releasePointerCapture(pointerId);
        }
      }
    } catch (e) {
      // Ignore errors - pointer may have already been released
    }
    activePointers.current.delete(pointerId);
  };

  // Handle pointer down
  const handlePointerDown = (e) => {
    // Capture the pointer
    safeSetPointerCapture(e.currentTarget, e.pointerId);
    
    // Add to pointer cache
    const newPointer = { pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY };
    const updatedCache = [...pointerCache, newPointer];
    setPointerCache(updatedCache);
    
    if (e.isPrimary) {
      primaryPointerId.current = e.pointerId;
      setLastPointerPos({ x: e.clientX, y: e.clientY });
      pointerDownTimeRef.current = Date.now();
    }
    
    // If we're drawing household, only handle click events, not drag/pan
    if (isDrawingHousehold) {
      // Still need to track the pointer for click detection
      return;
    }
    
    // Handle different pointer scenarios
    if (updatedCache.length === 2) {
      // Start pinch zoom
      setIsPinching(true);
      setIsPanning(false);
      setLastPinchDistance(getPinchDistance(updatedCache));
    } else if (updatedCache.length === 1 && e.isPrimary) {
      // Check if we're clicking on empty space
      const isEmptySpace = e.target === svgRef.current || e.target.classList.contains('grid-line');
      
      if (spacePressed.current || (e.pointerType === 'mouse' && e.button === 1)) {
        // Middle mouse button or space+drag for panning
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      } else if (isEmptySpace && e.button === 0) {
        // Left click on empty space - prepare for panning if we drag
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }

      // Start long press timer for touch/pointer devices (but not on mobile - MobileToolbar handles that)
      if (e.pointerType !== 'mouse' && !isMobile) {
        longPressStartPos.current = { x: e.clientX, y: e.clientY };
        longPressMovedRef.current = false;
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = setTimeout(() => {
          if (!longPressMovedRef.current && pointerCache.length === 1) {
            handleLongPress(e.clientX, e.clientY);
          }
        }, LONG_PRESS_DURATION);
      }
    }
  };

  // Handle pointer move
  const handlePointerMove = (e) => {
    // Update pointer cache
    const index = pointerCache.findIndex(p => p.pointerId === e.pointerId);
    if (index !== -1) {
      const newCache = [...pointerCache];
      newCache[index] = { pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY };
      setPointerCache(newCache);
      
      // Don't handle pan/zoom during household drawing
      if (isDrawingHousehold) {
        // Still track long press cancellation
        if (longPressTimerRef.current) {
          const mdx = Math.abs(e.clientX - longPressStartPos.current.x);
          const mdy = Math.abs(e.clientY - longPressStartPos.current.y);
          if (mdx > LONG_PRESS_MOVE_THRESHOLD || mdy > LONG_PRESS_MOVE_THRESHOLD) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
            longPressMovedRef.current = true;
          }
        }
        return;
      }
      
      if (isPinching && newCache.length >= 2) {
        // Handle pinch zoom
        const distance = getPinchDistance(newCache);
        
        if (lastPinchDistance > 0) {
          const rawScale = distance / lastPinchDistance;
          // Extra gentle pinch zoom - only 15% of the original sensitivity
          // This makes pinch zoom very smooth and controlled
          const dampedScale = 1 + (rawScale - 1) * 0.15;
          const newZoom = Math.max(dimensions.minZoom, Math.min(dimensions.maxZoom, zoom * dampedScale));
          
          // Calculate zoom center
          const centerX = (newCache[0].clientX + newCache[1].clientX) / 2;
          const centerY = (newCache[0].clientY + newCache[1].clientY) / 2;
          
          const rect = svgRef.current.getBoundingClientRect();
          const x = centerX - rect.left;
          const y = centerY - rect.top;
          
          // Adjust pan to zoom from center point
          const newPan = {
            x: x - (x - pan.x) * (newZoom / zoom),
            y: y - (y - pan.y) * (newZoom / zoom)
          };
          
          actions.setZoom(newZoom);
          actions.setPan(newPan);
        }
        
        setLastPinchDistance(distance);
      } else if (e.isPrimary && !isPinching) {
        // Check if we've moved enough to start panning
        const dx = Math.abs(e.clientX - lastPointerPos.x);
        const dy = Math.abs(e.clientY - lastPointerPos.y);
        const isEmptySpace = e.target === svgRef.current || e.target.classList.contains('grid-line');

        if (longPressTimerRef.current) {
          const mdx = Math.abs(e.clientX - longPressStartPos.current.x);
          const mdy = Math.abs(e.clientY - longPressStartPos.current.y);
          if (mdx > LONG_PRESS_MOVE_THRESHOLD || mdy > LONG_PRESS_MOVE_THRESHOLD) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
            longPressMovedRef.current = true;
          }
        }

        if (!isPanning && isEmptySpace && (dx > 5 || dy > 5)) {
          // Start panning
          setIsPanning(true);
        }
        
        if (isPanning) {
          // Pan the canvas
          const newPan = {
            x: e.clientX - panStart.x,
            y: e.clientY - panStart.y
          };
          actions.setPan(newPan);
        }
        
        // Update connection preview if connecting
        if (isConnecting) {
          const canvasCoords = getCanvasCoords(e.clientX, e.clientY);
          actions.setConnectionPreview(canvasCoords);
        }
      }
    }
  };

  // Handle pointer up
  const handlePointerUp = (e) => {
    // Release pointer capture safely
    safeReleasePointerCapture(e.currentTarget, e.pointerId);

    // Remove from cache
    const updatedCache = pointerCache.filter(p => p.pointerId !== e.pointerId);
    setPointerCache(updatedCache);

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (updatedCache.length === 0) {
      // Last pointer up
      const pressDuration = Date.now() - pointerDownTimeRef.current;
      if (!isPanning && e.isPrimary && e.button === 0 && pressDuration < LONG_PRESS_DURATION && !longPressMovedRef.current) {
        // It was a click, not a drag
        const canvasCoords = getCanvasCoords(e.clientX, e.clientY);
        handleCanvasClick(e, canvasCoords);
      }

      // Clear connection preview when the pointer is released
      if (isConnecting) {
        actions.setConnectionPreview(null);
      }

      pointerDownTimeRef.current = 0;
      longPressMovedRef.current = false;
      
      setIsPanning(false);
      setIsPinching(false);
      setLastPinchDistance(0);
      primaryPointerId.current = null;
    }
  };

  // Handle pointer cancel (same as up but for edge cases)
  const handlePointerCancel = (e) => {
    handlePointerUp(e);
  };

  // Handle canvas click
  const handleCanvasClick = (e, canvasCoords) => {
    // Only handle clicks on empty space
    if (e.target === svgRef.current || e.target.classList.contains('grid-line')) {
      if (isDrawingHousehold) {
        const newPoint = {
          x: snapToGrid ? Math.round(canvasCoords.x / 20) * 20 : canvasCoords.x,
          y: snapToGrid ? Math.round(canvasCoords.y / 20) * 20 : canvasCoords.y
        };
        
        // Check if we should close the household (clicking near first point with 3+ points)
        if (currentHouseholdPoints.length >= 3) {
          const firstPoint = currentHouseholdPoints[0];
          const distance = Math.sqrt(
            Math.pow(newPoint.x - firstPoint.x, 2) + 
            Math.pow(newPoint.y - firstPoint.y, 2)
          );
          
          if (distance < 30) {
            // Close the household
            actions.finishHousehold();
            
            // Save to history after household creation
            setTimeout(() => {
              actions.saveToHistory({
                people: state.people,
                relationships: state.relationships,
                households: state.households,
                textBoxes: state.textBoxes
              });
            }, 0);
            return;
          }
        }
        
        // Add point to household
        actions.addHouseholdPoint(newPoint);
      } else if (isConnecting) {
        // Cancel connection
        actions.cancelConnection();
      } else {
        // Best practice: Clicking empty space clears all selections
        // Clear multi-selection first
        if (state.selectedNodes && state.selectedNodes.length > 0) {
          actions.clearNodeSelection();
        }
        // Then clear single selection and close menus
        actions.clearSelection();
        actions.setContextMenu(null);
        actions.setMobileMenuOpen(false);
      }
    }
  };

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    // Very gentle zoom: 2% per step for smooth control
    const delta = e.deltaY > 0 ? 0.98 : 1.02;
    const newZoom = Math.max(dimensions.minZoom, Math.min(dimensions.maxZoom, zoom * delta));
    
    // Get mouse position relative to SVG
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Adjust pan to zoom from mouse position
    const newPan = {
      x: x - (x - pan.x) * (newZoom / zoom),
      y: y - (y - pan.y) * (newZoom / zoom)
    };
    
    actions.setZoom(newZoom);
    actions.setPan(newPan);
  }, [zoom, pan, dimensions, actions]);

  // Set up wheel event listener with passive: false
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    svg.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      svg.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Handle context menu
  const handleContextMenu = (e) => {
    e.preventDefault();
    
    const canvasCoords = getCanvasCoords(e.clientX, e.clientY);
    
    // Check if right-clicking on empty space
    if (e.target === svgRef.current || e.target.classList.contains('grid-line')) {
      actions.setContextMenu({
        type: 'canvas',
        x: e.clientX,
        y: e.clientY,
        canvasX: canvasCoords.x,
        canvasY: canvasCoords.y
      });
    }
  };
  // Highlighted node and relationship sets derived from focus/network state
  const highlightedPeople = highlightedNodeIds;
  const highlightedRelationships = highlightedRelationshipIds;

  // Determine cursor
  const getCursor = () => {
    if (isDrawingHousehold) return 'crosshair';
    if (isPanning) return 'grabbing';
    if (spacePressed.current) return 'grab';
    if (isConnecting) return 'crosshair';
    return 'default';
  };

  return (
    <div
      id="genogram-canvas"
      className="genogram-canvas"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        background: '#fafbfc'
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ 
          cursor: getCursor(),
          touchAction: 'none', // Enable touch interactions
          userSelect: 'none'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onContextMenu={handleContextMenu}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Grid */}
          {snapToGrid && <Grid />}
          
          {/* Households - sorted by zIndex */}
          {[...households]
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map(household => (
              <Household key={household.id} household={household} />
            ))}
          
          {/* Relationships */}
          {relationships
            .filter(relationship => {
              // If no node filters applied, show all relationships
              if (!filteredNodes) return true;
              
              // Child relationships: from = parent relationship ID, to = child person ID
              if (relationship.type === 'child') {
                // Child must be visible
                if (!filteredNodes.includes(relationship.to)) return false;
                
                // Find the parent relationship and check if BOTH parents are visible
                const parentRel = relationships.find(r => r.id === relationship.from);
                if (!parentRel) return false; // If parent relationship not found, hide it
                
                // BOTH parents must be visible to show the child relationship line
                return filteredNodes.includes(parentRel.from) && 
                       filteredNodes.includes(parentRel.to);
              } else {
                // Person-to-person relationships: both from and to must be visible
                return filteredNodes.includes(relationship.from) && 
                       filteredNodes.includes(relationship.to);
              }
            })
            .map(relationship => (
              <Relationship 
                key={relationship.id} 
                relationship={relationship}
                people={people}
                relationships={relationships}
                isHighlighted={highlightedRelationships.has(relationship.id)}
              />
            ))}
          
          {/* People - sorted by zIndex */}
          {[...people]
            .filter(person => {
              // If no filters applied, show all
              if (!filteredNodes) return true;
              // If filters applied, only show nodes in filteredNodes array
              return filteredNodes.includes(person.id);
            })
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map(person => (
              <Person 
                key={person.id} 
                person={person}
                isHighlighted={highlightedPeople.has(person.id)}
              />
            ))}
          
          {/* Text boxes - sorted by zIndex */}
          {[...textBoxes]
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map(textBox => (
              <TextBox key={textBox.id} textBox={textBox} />
            ))}
          
          {/* Connection preview line */}
          {isConnecting && connectionPreview && (
            <ConnectionLine 
              from={connectingFrom}
              to={connectionPreview}
              type={connectingType}
              people={people}
            />
          )}
          
          {/* Household drawing preview */}
          {isDrawingHousehold && currentHouseholdPoints.length > 0 && (
            <HouseholdDrawing points={currentHouseholdPoints} />
          )}
        </g>
      </svg>
      
      {/* Zoom indicator */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        pointerEvents: 'none',
        opacity: isPinching || (zoom !== 1) ? 1 : 0,
        transition: 'opacity 0.3s'
      }}>
        {Math.round(zoom * 100)}%
      </div>
      
      {/* Touch gesture hints */}
      {pointerCache.length === 0 && people.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '16px',
          padding: '20px',
          pointerEvents: 'none'
        }}>
          <p style={{ marginBottom: '16px', fontSize: '20px', color: '#475569' }}>
            Start building your genogram
          </p>
          <p style={{ marginBottom: '8px' }}>
            🖱️ Click the Add button or right-click to add people
          </p>
          <p style={{ marginBottom: '8px' }}>
            🔍 Scroll to zoom • Space+drag or middle-click to pan
          </p>
          <p style={{ color: '#94a3b8' }}>
            👆 Touch devices: Pinch to zoom • Drag to pan
          </p>
        </div>
      )}
    </div>
  );
};

export default GenogramCanvas;