// src/hooks/useRelationshipHandlers.js
import { useCallback } from 'react';

export const useRelationshipHandlers = ({
  relationship,
  relationships,
  people,
  state,
  actions,
  isDraggingBubble,
  setIsDraggingBubble
}) => {
  const { isConnecting, connectingFrom, connectingType } = state;

  // Handle dragging entire family groups
  const handleRelationshipDrag = useCallback((e, startDrag = false) => {
    if (startDrag) {
      e.stopPropagation();
      
      const svg = e.currentTarget.closest('svg');
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgCoords = pt.matrixTransform(svg.getScreenCTM().inverse());
      
      // Convert to canvas coordinates
      const canvasX = (svgCoords.x - state.pan.x) / state.zoom;
      const canvasY = (svgCoords.y - state.pan.y) / state.zoom;
      
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
      
      const handleMouseMove = (e) => {
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const currentCoords = pt.matrixTransform(svg.getScreenCTM().inverse());
        
        const currentCanvasX = (currentCoords.x - state.pan.x) / state.zoom;
        const currentCanvasY = (currentCoords.y - state.pan.y) / state.zoom;
        
        const deltaX = currentCanvasX - canvasX;
        const deltaY = currentCanvasY - canvasY;
        
        // Update all connected people
        connectedPeople.forEach((initialPos, personId) => {
          actions.updatePerson(personId, {
            x: initialPos.x + deltaX,
            y: e.shiftKey ? initialPos.y : initialPos.y + deltaY
          });
        });
      };
      
      const handleMouseUp = () => {
        // Save to history
        actions.saveToHistory({
          people: state.people,
          relationships: state.relationships,
          households: state.households,
          textBoxes: state.textBoxes
        });
        
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [relationship, relationships, people, actions, state]);

  // Handle bubble dragging along the line
  const handleBubbleMouseDown = useCallback((e, x1, y1, x2, y2) => {
    e.stopPropagation();
    setIsDraggingBubble(true);

    const svg = e.currentTarget.closest('svg');

    const handleMouseMove = (e) => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgCoords = pt.matrixTransform(svg.getScreenCTM().inverse());
      
      // Calculate position along line (0 to 1)
      const lenSq = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
      let t = 0.5;
      if (lenSq > 0) {
        t = ((svgCoords.x - x1) * (x2 - x1) + (svgCoords.y - y1) * (y2 - y1)) / lenSq;
      }
      t = Math.max(0, Math.min(1, t));
      
      actions.updateRelationship(relationship.id, { bubblePosition: t });
    };

    const handleMouseUp = () => {
      setIsDraggingBubble(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [relationship.id, actions, setIsDraggingBubble]);

  // Handle line click
  const handleLineClick = useCallback((e) => {
    e.stopPropagation();
    if (!isDraggingBubble) {
      actions.selectRelationship(relationship);
    }
  }, [relationship, actions, isDraggingBubble]);

  // Handle bubble click
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

  // Handle right click context menu
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

  // Handle direct line dragging (without drag handle)
  const handleLineMouseDown = useCallback((e) => {
    e.stopPropagation();
    
    // Don't start drag if clicking with right button or if in connecting mode
    if (e.button !== 0 || isConnecting) return;
    
    const svg = e.currentTarget.closest('svg');
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgCoords = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    // Convert to canvas coordinates accounting for pan/zoom
    const canvasX = (svgCoords.x - state.pan.x) / state.zoom;
    const canvasY = (svgCoords.y - state.pan.y) / state.zoom;
    
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
    
    const handleMouseMove = (e) => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const currentCoords = pt.matrixTransform(svg.getScreenCTM().inverse());
      
      const currentCanvasX = (currentCoords.x - state.pan.x) / state.zoom;
      const currentCanvasY = (currentCoords.y - state.pan.y) / state.zoom;
      
      const deltaX = currentCanvasX - canvasX;
      const deltaY = currentCanvasY - canvasY;
      
      // Check if we've moved enough to start dragging
      if (!hasDragged && (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD)) {
        hasDragged = true;
      }
      
      if (hasDragged) {
        // Update both people positions
        actions.updatePerson(relationship.from, {
          x: initialPositions.from.x + deltaX,
          y: e.shiftKey ? initialPositions.from.y : initialPositions.from.y + deltaY
        });
        
        actions.updatePerson(relationship.to, {
          x: initialPositions.to.x + deltaX,
          y: e.shiftKey ? initialPositions.to.y : initialPositions.to.y + deltaY
        });
        
        // Move their children too
        relationships.filter(r => r.type === 'child' && r.from === relationship.id).forEach(childRel => {
          const child = people.find(p => p.id === childRel.to);
          if (child) {
            const initialChildPos = people.find(p => p.id === child.id);
            if (initialChildPos) {
              actions.updatePerson(child.id, {
                x: initialChildPos.x + deltaX,
                y: e.shiftKey ? initialChildPos.y : initialChildPos.y + deltaY
              });
            }
          }
        });
      }
    };
    
    const handleMouseUp = () => {
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
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [relationship, relationships, people, isConnecting, actions, state]);

  // Enhanced bubble mouse down with drag threshold
  const handleBubbleMouseDownEnhanced = useCallback((e, x1, y1, x2, y2) => {
    if (e.button === 0) { // Left click
      e.stopPropagation();
      e.preventDefault();
      
      // Capture the SVG element reference immediately
      const svg = e.currentTarget.closest('svg');
      if (!svg) return;
      
      // Store initial mouse position
      const startX = e.clientX;
      const startY = e.clientY;
      let isDragging = false;
      const DRAG_THRESHOLD = 5; // pixels to move before drag starts
      
      const handleMouseMove = (moveEvent) => {
        // Calculate distance moved
        const deltaX = Math.abs(moveEvent.clientX - startX);
        const deltaY = Math.abs(moveEvent.clientY - startY);
        
        // Only start dragging if mouse moved more than threshold
        if (!isDragging && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)) {
          isDragging = true;
          console.log('Starting bubble drag');
          
          // Create a synthetic event with the svg reference
          const syntheticEvent = {
            ...e,
            currentTarget: { closest: () => svg },
            clientX: moveEvent.clientX,
            clientY: moveEvent.clientY,
            stopPropagation: () => {},
            preventDefault: () => {}
          };
          
          handleBubbleMouseDown(syntheticEvent, x1, y1, x2, y2);
          
          // Remove these listeners since handleBubbleMouseDown sets up its own
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        }
      };
      
      const handleMouseUp = () => {
        // If we never started dragging, this was just a click
        if (!isDragging) {
          console.log('Click without drag');
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [handleBubbleMouseDown]);

  return {
    handleRelationshipDrag,
    handleBubbleMouseDown,
    handleLineClick,
    handleBubbleClick,
    handleLineRightClick,
    handleLineMouseDown,
    handleBubbleMouseDownEnhanced
  };
};