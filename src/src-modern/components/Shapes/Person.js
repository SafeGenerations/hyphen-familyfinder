// ===== Person.js - COMPLETE FILE WITH POINTER EVENTS FIXED =====
// src/src-modern/components/Shapes/Person.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useGenogram } from '../../contexts/GenogramContext';
import { useResponsive, getPersonShapeSize } from '../../utils/responsive';
import { DECEASED_SYMBOL_RENDER_MAP } from '../../constants/deceasedSymbols';
import { NodeType, getNodeTypeConfig } from '../../constants/nodeTypes';
import { NODE_ICON_MAP } from '../../constants/nodeIcons';

const NODE_ICON_FALLBACK = {
  [NodeType.ORGANIZATION]: '👥',
  [NodeType.SERVICE_RESOURCE]: '🤝',
  [NodeType.PLACE_LOCATION]: '📍',
  [NodeType.CUSTOM]: '⭐'
};

const Person = ({ person, isHighlighted }) => {
  const { state, actions } = useGenogram();
  const { selectedPerson, isConnecting, connectingFrom, connectingType, snapToGrid, selectedNodes } = state;
  const { breakpoint } = useResponsive();
  const [isDragging, setIsDragging] = useState(false);
  const [, setDragStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const elementRef = useRef(null);
  const hasPointerCapture = useRef(false);
  const longPressTimerRef = useRef(null);
  const longPressStartPos = useRef({ x: 0, y: 0 });
  const LONG_PRESS_DURATION = 750;
  const LONG_PRESS_MOVE_THRESHOLD = 10;
  
  // Track if person was just added (for highlight animation)
  const [justAdded, setJustAdded] = useState(false);
  
  // Check if this person was just added (has searchMetadata and was added recently)
  useEffect(() => {
    if (person.searchMetadata?.addedDate) {
      const addedTime = new Date(person.searchMetadata.addedDate).getTime();
      const now = Date.now();
      const timeSinceAdded = now - addedTime;
      
      // Show animation for first 3 seconds after adding
      if (timeSinceAdded < 3000) {
        setJustAdded(true);
        const timer = setTimeout(() => setJustAdded(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [person.searchMetadata]);
  
  // Detect mobile to disable person long press (MobileToolbar handles long press instead)
  const isMobile = breakpoint === 'xs' || breakpoint === 'sm';
  
  const isSelected = selectedPerson?.id === person.id;
  const isMultiSelected = selectedNodes.includes(person.id);
  const size = getPersonShapeSize(breakpoint);
  const isConnectionSource = isConnecting && connectingFrom === person.id;
  const isConnectionTarget = isConnecting && connectingFrom && connectingFrom !== person.id;

  const nodeType = person.type || NodeType.PERSON;
  const isPersonNode = nodeType === NodeType.PERSON;
  const nodeConfig = getNodeTypeConfig(nodeType);
  const visualStyle = person.visualStyle || {};

  let rawDeceasedSymbol = 'none';
  let gentleTreatment = 'none';

  if (isPersonNode) {
    rawDeceasedSymbol = person.isDeceased ? (person.deceasedSymbol || 'halo') : 'none';
    gentleTreatment = person.isDeceased ? (person.deceasedGentleTreatment || 'none') : 'none';

    if (rawDeceasedSymbol === 'soft-outline') {
      if (gentleTreatment === 'none') {
        gentleTreatment = 'soft-outline';
      }
      rawDeceasedSymbol = 'none';
    }

    if (rawDeceasedSymbol === 'soft-fade') {
      rawDeceasedSymbol = 'none';
    }

    if (gentleTreatment === 'soft-fade') {
      gentleTreatment = 'none';
    }

    if (gentleTreatment !== 'soft-outline') {
      gentleTreatment = 'none';
    }
  }

  const deceasedSymbol = rawDeceasedSymbol;
  const deceasedRenderType = DECEASED_SYMBOL_RENDER_MAP[deceasedSymbol] || 'none';
  

  
  const DRAG_THRESHOLD = 5;



  // Handle pointer down for dragging
  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return; // Only handle left button

    e.stopPropagation();

    if (e.pointerType !== 'mouse' && !isMobile) {
      longPressStartPos.current = { x: e.clientX, y: e.clientY };
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = setTimeout(() => {
        // Check if we're still not dragging and the timer hasn't been cleared
        if (!isDragging && longPressTimerRef.current) {
          actions.setContextMenu({
            type: 'person',
            person: person,
            x: longPressStartPos.current.x,
            y: longPressStartPos.current.y
          });
          if (navigator.vibrate) navigator.vibrate(50);
          longPressTimerRef.current = null;
        }
      }, LONG_PRESS_DURATION);
    }
    
    // Store references
    const element = e.currentTarget;
    const pointerId = e.pointerId;
    elementRef.current = element;
    
    if (!element) return;
    
    // Set pointer capture
    hasPointerCapture.current = false;
    try {
      element.setPointerCapture(pointerId);
      hasPointerCapture.current = true;
    } catch (err) {
      // Continue without capture
    }
    
    const svg = element.closest('svg');
    if (!svg) return;
    
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgCoords = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    const startX = (svgCoords.x - state.pan.x) / state.zoom - person.x;
    const startY = (svgCoords.y - state.pan.y) / state.zoom - person.y;
    
    setDragStart({ x: startX, y: startY });
    setHasDragged(false);
    
    let moved = false;

    const handlePointerMove = (moveEvent) => {
      const pt = svg.createSVGPoint();
      pt.x = moveEvent.clientX;
      pt.y = moveEvent.clientY;
      const currentCoords = pt.matrixTransform(svg.getScreenCTM().inverse());

      const newX = (currentCoords.x - state.pan.x) / state.zoom - startX;
      const newY = (currentCoords.y - state.pan.y) / state.zoom - startY;

      // Check if we've moved enough to start dragging
      if (!moved) {
        const deltaX = Math.abs(newX - person.x);
        const deltaY = Math.abs(newY - person.y);
        if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
          moved = true;
          setHasDragged(true);
          setIsDragging(true);
          // Clear long press timer immediately when dragging starts
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
        }
      }

      if (!moved) {
        const dx = Math.abs(moveEvent.clientX - longPressStartPos.current.x);
        const dy = Math.abs(moveEvent.clientY - longPressStartPos.current.y);
        if (dx > LONG_PRESS_MOVE_THRESHOLD || dy > LONG_PRESS_MOVE_THRESHOLD) {
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
        }
      }

      if (moved) {
        const finalX = snapToGrid ? Math.round(newX / 20) * 20 : newX;
        const finalY = snapToGrid ? Math.round(newY / 20) * 20 : newY;

        // Calculate the delta movement
        const deltaX = finalX - person.x;
        const deltaY = finalY - person.y;

        // If this person is part of a multi-select, move all selected nodes together
        if (isMultiSelected && state.selectedNodes.length > 1) {
          state.selectedNodes.forEach(nodeId => {
            const nodePerson = state.people.find(p => p.id === nodeId);
            if (nodePerson) {
              const newNodeX = nodePerson.x + deltaX;
              const newNodeY = nodePerson.y + deltaY;
              actions.updatePerson(nodeId, { x: newNodeX, y: newNodeY });
            }
          });
        } else {
          // Single person drag
          actions.updatePerson(person.id, { x: finalX, y: finalY });
        }
      }
    };
    
    const handlePointerUp = (upEvent) => {
      // Release pointer capture safely
      if (hasPointerCapture.current && elementRef.current) {
        try {
          // Check if element still exists and has the method
          if (document.body.contains(elementRef.current) && 
              typeof elementRef.current.releasePointerCapture === 'function') {
            elementRef.current.releasePointerCapture(pointerId);
          }
        } catch (err) {
          // Ignore errors
        }
        hasPointerCapture.current = false;
      }

      // Clean up
      setIsDragging(false);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      
      if (moved) {
        // Save to history after dragging
        actions.saveToHistory({
          people: state.people,
          relationships: state.relationships,
          households: state.households,
          textBoxes: state.textBoxes
        });
        
        // Reset hasDragged after a short delay to prevent immediate clicks
        setTimeout(() => {
          setHasDragged(false);
        }, 100);
      }
      // Don't call handleClick here - let the onClick event handle it to avoid duplicates
      
      // Remove event listeners
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
      
      elementRef.current = null;
    };
    
    // Use document-level events for more reliable tracking
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
    
  }, [person, snapToGrid, actions, state, isMobile, isDragging]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent default to avoid any duplicate handling
    
    // Don't handle clicks if we just finished dragging
    if (hasDragged) {
      return;
    }
    
    // Check for Ctrl/Cmd key for multi-select
    const isMultiSelectClick = e.ctrlKey || e.metaKey; // metaKey is Cmd on Mac
    const isShiftClick = e.shiftKey;
    
    // Handle multi-select with Ctrl/Cmd+click
    if (isMultiSelectClick && !isConnecting) {
      actions.toggleNodeSelection(person.id);
      return;
    }
    
    // Handle range selection with Shift+click
    if (isShiftClick && !isConnecting && state.lastSelectedNode) {
      // TODO: Implement range selection
      actions.toggleNodeSelection(person.id);
      return;
    }
    
    // Clear multi-selection when clicking without Ctrl/Shift
    // Best practice: Regular click exits multi-select mode and performs normal action
    if (!isMultiSelectClick && !isShiftClick && !isConnecting && state.selectedNodes.length > 0) {
      actions.clearNodeSelection();
      // Continue to normal click handling (person will be selected via handlePersonClick)
    }
    
    // DEBUG: Log connection state
    console.log('=== PERSON CLICK DEBUG ===');
    console.log('Person:', person.name);
    console.log('isConnecting:', isConnecting);
    console.log('connectingFrom:', connectingFrom);
    console.log('connectingType:', connectingType);
    console.log('hasDragged:', hasDragged);
    
    if (isConnecting) {
      console.log('🔗 IN CONNECTING MODE');
      if (connectingFrom && connectingFrom !== person.id) {
        console.log('✅ Valid connection target');
        if (connectingType === 'child') {
          console.log('👶 Child connection type detected');
          // Check if connectingFrom is a relationship ID (marriage-to-child connection)
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
          
          const parentRel = state.relationships.find(r => 
            r.id === connectingFrom && 
            PARENT_RELATIONSHIP_TYPES.includes(r.type)
          );
          
          if (parentRel) {
            console.log('💑 Marriage-to-child connection');
            actions.createChildRelationship(connectingFrom, person.id);
          } else {
            console.log('👤 Person-to-person child connection');
            // For person-to-person child connections, we need to determine who is the parent and who is the child
            // The person who started the connection (connectingFrom) is the child
            // The person being clicked (person) is the parent
            const childPerson = state.people.find(p => p.id === connectingFrom);
            const parentPerson = person;
            
            console.log('Child:', childPerson?.name, 'Parent:', parentPerson?.name);
            
            // Create a partnership for the parent and connect the existing child to it
            actions.connectExistingPersonAsChild(parentPerson, childPerson);
          }
        } else {
          console.log('🔗 Regular relationship connection');
          actions.createRelationship(connectingFrom, person.id, connectingType);
        }
      } else {
        console.log('❌ Invalid connection - same person or no connectingFrom');
      }
    } else {
      console.log('📝 NOT IN CONNECTING MODE - Opening edit panel');
      // In mobile mode, single click only selects without opening edit panel
      const isMobileMode = breakpoint === 'xs' || breakpoint === 'sm';
      actions.handlePersonClick(person, { openPanel: !isMobileMode });
    }
  }, [isConnecting, connectingFrom, connectingType, person, actions, state.relationships, hasDragged, breakpoint, state.people]);

  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation();
    if (!isConnecting) {
      if (state.highlightNetwork) {
        // In network mode, force edit (bypass network toggle)
        actions.selectPerson(person, true); // forceEdit = true
        actions.setQuickEditOpen(true);
      } else {
        // Double click always opens edit panel regardless of breakpoint
        actions.selectPerson({ person, openPanel: true });
        actions.setQuickEditOpen(true);
      }
    }
  }, [isConnecting, person, actions, state.highlightNetwork]);

  const handleContextMenu = useCallback((e) => {
    console.log('🎯🎯🎯 handleContextMenu FIRED for:', person.name);
    e.preventDefault();
    e.stopPropagation();
    
    // Check if this person is part of a multi-selection
    const hasMultipleSelected = state.selectedNodes.length > 1 && state.selectedNodes.includes(person.id);
    
    console.log('🖱️ Right-click on:', person.name);
    console.log('selectedNodes:', state.selectedNodes);
    console.log('selectedNodes.length:', state.selectedNodes.length);
    console.log('person.id:', person.id);
    console.log('includes person?', state.selectedNodes.includes(person.id));
    console.log('hasMultipleSelected:', hasMultipleSelected);
    console.log('Will show menu type:', hasMultipleSelected ? 'bulk-person' : 'person');
    
    actions.setContextMenu({
      type: hasMultipleSelected ? 'bulk-person' : 'person',
      person: person,
      selectedNodes: hasMultipleSelected ? state.selectedNodes : undefined,
      x: e.clientX,
      y: e.clientY
    });
    
    // Only select the person when right-clicking on desktop/tablet
    // Select without opening edit panel on right-click
    const isMobileMode = breakpoint === 'xs' || breakpoint === 'sm';
    if (!isMobileMode && !hasMultipleSelected) {
      actions.selectPerson({ person, openPanel: false });
    }
  }, [person, actions, breakpoint, state.selectedNodes]);

  // Enhanced pointer down handler with right-click detection for Mac
  const handlePointerDownWithRightClick = useCallback((e) => {
    // Handle right-click (button 2) as fallback for Mac two-finger click
    if (e.button === 2) {
      e.preventDefault();
      e.stopPropagation();
      
      // Use pointer coordinates if available, fallback to client coordinates
      const clientX = e.clientX;
      const clientY = e.clientY;
      
      // Check if this person is part of a multi-selection
      const hasMultipleSelected = state.selectedNodes.length > 1 && state.selectedNodes.includes(person.id);
      
      console.log('🖱️ handlePointerDownWithRightClick - Right-click detected');
      console.log('selectedNodes:', state.selectedNodes);
      console.log('hasMultipleSelected:', hasMultipleSelected);
      
      actions.setContextMenu({
        type: hasMultipleSelected ? 'bulk-person' : 'person',
        person: person,
        selectedNodes: hasMultipleSelected ? state.selectedNodes : undefined,
        x: clientX,
        y: clientY
      });
      
      // Only select the person when right-clicking on desktop/tablet
      // Select without opening edit panel on right-click
      const isMobileMode = breakpoint === 'xs' || breakpoint === 'sm';
      if (!isMobileMode) {
        actions.selectPerson({ person, openPanel: false });
      }
      return;
    }
    
    // Handle regular pointer down for dragging
    handlePointerDown(e);
  }, [person, actions, breakpoint, handlePointerDown]);

  // Detect Mac platform for special handling
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  // Determine fill color
  const getFillColor = () => {
    if (visualStyle.color) return visualStyle.color;
    if (!isPersonNode) return '#ffffff';
    if (!person.isDeceased) return '#ffffff';
    return '#f3f4f6';
  };

  // Determine stroke color based on state
  const getStrokeColor = () => {
    if (isMultiSelected) return '#8b5cf6'; // Purple for multi-selected nodes
    if (isConnectionSource) return '#f59e0b';
    if (isConnectionTarget) return '#10b981';
    if (isSelected) return '#3b82f6';
    if (person.networkMember) return '#10b981'; // Green for network members
    if (visualStyle.borderColor) return visualStyle.borderColor;
    if (isPersonNode && person.isDeceased) {
      if (gentleTreatment === 'soft-outline') return '#94a3b8';
      return '#6b7280';
    }
    return '#1e293b'; // Dark stroke for clear visibility
  };

  const strokeWidth = isSelected || isConnectionSource || isConnectionTarget || person.networkMember || isMultiSelected ? 3 : 2;
  const targetOpacity = isHighlighted ? 1 : 0.3;

  // Get initials for small displays
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const showFullName = size >= 50;
  const baseFontSize = size < 50 ? 12 : 14;

  const hasAgeLabel = isPersonNode && Boolean(person.age || person.birthDate);
  const hasLifeSpanLabel = isPersonNode && Boolean(person.isDeceased && showFullName && (person.birthDate || person.deathDate));
  const showNetworkRole = Boolean(state.highlightNetwork && person.networkMember && person.role);

  const labelBaseY = person.y + size;
  const labelOffset = Math.max(16, size * 0.2); // Pull labels closer to the node to keep them visually connected
  const labelLineSpacing = Math.max(12, size * 0.16);

  let nextLabelY = labelBaseY + labelOffset;

  let lifeSpanLabelY = null;
  if (hasLifeSpanLabel) {
    lifeSpanLabelY = nextLabelY;
    nextLabelY += labelLineSpacing;
  }

  let ageLabelY = null;
  if (hasAgeLabel) {
    ageLabelY = nextLabelY;
    nextLabelY += labelLineSpacing;
  }

  let networkRoleRectY = null;
  let networkRoleTextY = null;
  if (showNetworkRole) {
    networkRoleTextY = nextLabelY;
  networkRoleRectY = networkRoleTextY - 10;
    nextLabelY += labelLineSpacing;
  }

  const nonPersonNameY = person.y + size + Math.max(20, size * 0.35);

  // Helper function to wrap text and adjust font size - prioritize showing actual names
  const getNameDisplay = (name, options = {}) => {
    const {
      allowAbbreviation = true,
      forceFull = false,
      maxLines
    } = options;

    const normalizedName = (name ?? '').trim();
    if (normalizedName.length === 0) {
      return { lines: [''], fontSize: baseFontSize };
    }

    const maxLinesAllowed = typeof maxLines === 'number'
      ? Math.max(1, maxLines)
      : (allowAbbreviation ? 3 : 4);

    if (!showFullName && !forceFull) {
      return { lines: [getInitials(normalizedName)], fontSize: baseFontSize };
    }

    // Estimate character width based on font size (rough approximation)
    const charWidth = baseFontSize * 0.6;
    const maxWidth = size * 0.9; // Leave some padding
    const maxCharsPerLine = Math.max(4, Math.floor(maxWidth / charWidth));

    const words = normalizedName.split(/\s+/).filter(Boolean);

    const forceWrapFullText = (startingFontSize) => {
      let fontSize = Math.max(7, startingFontSize);

      while (fontSize >= 7) {
        const charWidthForced = fontSize * 0.6;
        const maxCharsForced = Math.max(1, Math.floor(maxWidth / charWidthForced));

        const lines = [];
        let remaining = normalizedName;

        while (remaining.length > 0 && lines.length < maxLinesAllowed) {
          let sliceLength = Math.min(maxCharsForced, remaining.length);
          let breakIndex = remaining.lastIndexOf(' ', sliceLength);
          if (breakIndex <= 0) {
            breakIndex = sliceLength;
          }

          const segment = remaining.slice(0, breakIndex).trim() || remaining.slice(0, breakIndex);
          lines.push(segment);
          remaining = remaining.slice(breakIndex).trimStart();
        }

        if (remaining.length === 0 && lines.length > 0) {
          return { lines, fontSize };
        }

        fontSize -= 1;
      }

      const fallbackFont = Math.max(7, startingFontSize);
      const fallbackCharWidth = fallbackFont * 0.6;
      const fallbackMaxChars = Math.max(1, Math.floor(maxWidth / fallbackCharWidth) || 1);
      const fallbackLines = [];
      let remainder = normalizedName;

      while (remainder.length > 0) {
        const sliceLength = Math.min(fallbackMaxChars, remainder.length);
        const segment = remainder.slice(0, sliceLength);
        fallbackLines.push(segment);
        remainder = remainder.slice(sliceLength).trimStart();
      }

      return { lines: fallbackLines, fontSize: fallbackFont };
    };

    // If name fits on one line with base font size, use it
    if (normalizedName.length <= maxCharsPerLine) {
      return { lines: [normalizedName], fontSize: baseFontSize };
    }

    // Try to wrap into two lines with base font
    if (words.length > 1 && maxLinesAllowed >= 2) {
      let middleIndex = Math.ceil(words.length / 2);
      let line1 = words.slice(0, middleIndex).join(' ');
      let line2 = words.slice(middleIndex).join(' ');

      if (line1.length <= maxCharsPerLine && line2.length <= maxCharsPerLine) {
        return { lines: [line1, line2], fontSize: baseFontSize };
      }
    }

    // Try smaller font size (2px smaller)
    let currentFontSize = baseFontSize - 2;
    let currentCharWidth = currentFontSize * 0.6;
    let currentMaxChars = Math.max(4, Math.floor(maxWidth / currentCharWidth));

    if (normalizedName.length <= currentMaxChars) {
      return { lines: [normalizedName], fontSize: currentFontSize };
    }

    if (words.length > 1 && maxLinesAllowed >= 2) {
      let middleIndex = Math.ceil(words.length / 2);
      let line1 = words.slice(0, middleIndex).join(' ');
      let line2 = words.slice(middleIndex).join(' ');

      if (line1.length <= currentMaxChars && line2.length <= currentMaxChars) {
        return { lines: [line1, line2], fontSize: currentFontSize };
      }
    }

    // Try even smaller (4px smaller)
    currentFontSize = baseFontSize - 4;
    currentCharWidth = currentFontSize * 0.6;
    currentMaxChars = Math.max(4, Math.floor(maxWidth / currentCharWidth));

    if (normalizedName.length <= currentMaxChars) {
      return { lines: [normalizedName], fontSize: currentFontSize };
    }

    if (words.length > 1 && maxLinesAllowed >= 2) {
      let middleIndex = Math.ceil(words.length / 2);
      let line1 = words.slice(0, middleIndex).join(' ');
      let line2 = words.slice(middleIndex).join(' ');

      if (line1.length <= currentMaxChars && line2.length <= currentMaxChars) {
        return { lines: [line1, line2], fontSize: currentFontSize };
      }
    }

    // Try three lines with smaller font when allowed
    if (words.length >= 3 && maxLinesAllowed >= 3) {
      const lineSize = Math.ceil(words.length / 3);
      const line1 = words.slice(0, lineSize).join(' ');
      const line2 = words.slice(lineSize, lineSize * 2).join(' ');
      const line3 = words.slice(lineSize * 2).join(' ');

      if (line1.length <= currentMaxChars && line2.length <= currentMaxChars && line3.length <= currentMaxChars) {
        return { lines: [line1, line2, line3], fontSize: currentFontSize };
      }
    }

    // Try smallest practical font (6px smaller)
    currentFontSize = Math.max(8, baseFontSize - 6);
    currentCharWidth = currentFontSize * 0.6;
    currentMaxChars = Math.max(4, Math.floor(maxWidth / currentCharWidth));

    if (normalizedName.length <= currentMaxChars) {
      return { lines: [normalizedName], fontSize: currentFontSize };
    }

    if (words.length > 1 && maxLinesAllowed >= 2) {
      let middleIndex = Math.ceil(words.length / 2);
      let line1 = words.slice(0, middleIndex).join(' ');
      let line2 = words.slice(middleIndex).join(' ');

      if (line1.length <= currentMaxChars && line2.length <= currentMaxChars) {
        return { lines: [line1, line2], fontSize: currentFontSize };
      }
    }

    if (!allowAbbreviation) {
      return forceWrapFullText(currentFontSize);
    }

    // Try "First Last Initial" format if we have multiple words
    if (words.length >= 2) {
      const firstLastInitial = `${words[0]} ${words[words.length - 1][0]}.`;
      if (firstLastInitial.length <= currentMaxChars) {
        return { lines: [firstLastInitial], fontSize: currentFontSize };
      }
    }

    // Try just first name
    if (words.length > 0 && words[0].length <= currentMaxChars) {
      return { lines: [words[0]], fontSize: currentFontSize };
    }

    // Last resort: use initials
    return { lines: [getInitials(normalizedName)], fontSize: baseFontSize };
  };

  const nodeName = person.name && person.name.trim().length > 0 ? person.name : nodeConfig.label;
  const nameDisplay = getNameDisplay(nodeName, {
    allowAbbreviation: isPersonNode,
    forceFull: !isPersonNode
  });

  // Standard genogram shapes based on gender
  const renderShape = () => {
    const fill = getFillColor();
    const stroke = getStrokeColor();
    const cx = person.x + size / 2;
    const cy = person.y + size / 2;
    const r = size / 2;

    const baseShapeStyle = {
      filter: isSelected ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' : 'none',
      cursor: isDragging ? 'grabbing' : (isConnectionTarget ? 'pointer' : (state.highlightNetwork ? 'pointer' : 'grab')),
      touchAction: 'none'
    };

    const genericShapeProps = {
      fill,
      stroke,
      strokeWidth,
      style: baseShapeStyle
    };

    const personShapeProps = gentleTreatment === 'soft-outline' && isPersonNode
      ? {
          ...genericShapeProps,
          strokeDasharray: `${Math.max(4, size * 0.2)} ${Math.max(2, size * 0.12)}`,
          fillOpacity: 0.95
        }
      : genericShapeProps;

    if (!isPersonNode) {
      const shapeKey = visualStyle.shape || nodeConfig.defaultShape || 'rounded-rect';
      switch (shapeKey) {
        case 'circle':
          return (
            <circle
              cx={cx}
              cy={cy}
              r={r}
              {...genericShapeProps}
            />
          );
        case 'diamond':
          return (
            <rect
              x={person.x}
              y={person.y}
              width={size}
              height={size}
              transform={`rotate(45 ${cx} ${cy})`}
              {...genericShapeProps}
            />
          );
        case 'triangle':
          return (
            <polygon
              points={`${cx},${person.y} ${person.x},${person.y + size} ${person.x + size},${person.y + size}`}
              {...genericShapeProps}
            />
          );
        case 'square':
          return (
            <rect
              x={person.x}
              y={person.y}
              width={size}
              height={size}
              {...genericShapeProps}
            />
          );
        case 'rounded-rect':
        default:
          return (
            <rect
              x={person.x}
              y={person.y}
              width={size}
              height={size}
              rx={size * 0.2}
              {...genericShapeProps}
            />
          );
      }
    }

    // Handle gender-based shapes for person nodes
    switch (person.gender) {
      case 'male':
        return (
          <rect
            x={person.x}
            y={person.y}
            width={size}
            height={size}
            {...personShapeProps}
          />
        );
      
      case 'female':
        // Circle
        return (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            {...personShapeProps}
          />
        );
      
      case 'transgender-male':
        // Square with circle inside
        return (
          <g>
            <rect
              x={person.x}
              y={person.y}
              width={size}
              height={size}
              {...personShapeProps}
            />
            <circle
              cx={cx}
              cy={cy}
              r={r * 0.6}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth - 1}
              style={{ pointerEvents: 'none' }}
            />
          </g>
        );
      
      case 'transgender-female':
        // Circle with square inside
        return (
          <g>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              {...personShapeProps}
            />
            <rect
              x={cx - r * 0.6}
              y={cy - r * 0.6}
              width={r * 1.2}
              height={r * 1.2}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth - 1}
              style={{ pointerEvents: 'none' }}
            />
          </g>
        );
      
      case 'non-binary':
        // Triangle pointing up (alternative symbol for non-binary)
        return (
          <polygon
            points={`${cx},${cy - r*0.6} ${cx - r*0.7},${cy + r*0.4} ${cx + r*0.7},${cy + r*0.4}`}
            {...personShapeProps}
          />
        );
      
      case 'genderfluid':
        // Circle with triangle inside
        return (
          <g>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              {...personShapeProps}
            />
            <polygon
              points={`${cx},${cy - r*0.4} ${cx - r*0.5},${cy + r*0.2} ${cx + r*0.5},${cy + r*0.2}`}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth - 1}
              style={{ pointerEvents: 'none' }}
            />
          </g>
        );
      
      case 'agender':
        // Square with circle inside
        return (
          <g>
            <rect
              x={person.x}
              y={person.y}
              width={size}
              height={size}
              {...personShapeProps}
            />
            <circle
              cx={cx}
              cy={cy}
              r={r * 0.6}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth - 1}
              style={{ pointerEvents: 'none' }}
            />
          </g>
        );
      
      case 'institution':
        // House shape
        return (
          <g>
            <polygon
              points={`${cx},${person.y + r*0.3} ${person.x + r*0.3},${cy} ${person.x + size - r*0.3},${cy} ${person.x + size},${person.y + r*0.3} ${person.x + size},${person.y + size} ${person.x},${person.y + size}`}
              {...personShapeProps}
            />
          </g>
        );
      
      case 'pet':
        // Small diamond for pets
        return (
          <rect
            x={person.x + size * 0.1}
            y={person.y + size * 0.1}
            width={size * 0.8}
            height={size * 0.8}
            transform={`rotate(45 ${cx} ${cy})`}
            {...personShapeProps}
          />
        );
      
      case 'unknown':
      default:
        // Diamond/Rhombus (standard symbol for unknown gender)
        return (
          <rect
            x={person.x}
            y={person.y}
            width={size}
            height={size}
            transform={`rotate(45 ${cx} ${cy})`}
              {...personShapeProps}
          />
        );
    }
  };

  // Sexual orientation symbols that appear alongside gender shapes
  const renderSexualOrientationSymbols = () => {
    if (!isPersonNode) return null;
    if (!person.sexualOrientation || person.sexualOrientation === 'not-specified' || person.sexualOrientation === 'heterosexual') {
      return null;
    }

    const cy = person.y + size/2;
    const stroke = getStrokeColor();
    const symbolSize = size * 0.3;
    const offsetX = size + 8; // Position to the right of the gender shape
    
    switch (person.sexualOrientation) {
      case 'gay':
        // Triangle pointing down to the right of shape
        return (
          <polygon
            points={`${person.x + offsetX + symbolSize/2},${cy + symbolSize*0.3} ${person.x + offsetX},${cy - symbolSize*0.3} ${person.x + offsetX + symbolSize},${cy - symbolSize*0.3}`}
            fill={stroke}
            style={{ pointerEvents: 'none' }}
          />
        );
      
      case 'lesbian':
        // Small triangle pointing down inside small circle
        return (
          <g style={{ pointerEvents: 'none' }}>
            <circle 
              cx={person.x + offsetX + symbolSize/2} 
              cy={cy} 
              r={symbolSize/2} 
              fill="none" 
              stroke={stroke} 
              strokeWidth="2"
            />
            <polygon
              points={`${person.x + offsetX + symbolSize/2},${cy + symbolSize*0.2} ${person.x + offsetX + symbolSize*0.2},${cy - symbolSize*0.2} ${person.x + offsetX + symbolSize*0.8},${cy - symbolSize*0.2}`}
              fill={stroke}
            />
          </g>
        );
      
      case 'bisexual':
        // Triangle pointing down
        return (
          <polygon
            points={`${person.x + offsetX + symbolSize/2},${cy + symbolSize*0.3} ${person.x + offsetX},${cy - symbolSize*0.3} ${person.x + offsetX + symbolSize},${cy - symbolSize*0.3}`}
            fill={stroke}
            strokeDasharray="3,2"
            style={{ pointerEvents: 'none' }}
          />
        );
      
      case 'pansexual':
        // Small circle with line through it
        return (
          <g style={{ pointerEvents: 'none' }}>
            <circle 
              cx={person.x + offsetX + symbolSize/2} 
              cy={cy} 
              r={symbolSize/2} 
              fill="none" 
              stroke={stroke} 
              strokeWidth="2"
            />
            <line
              x1={person.x + offsetX}
              y1={cy}
              x2={person.x + offsetX + symbolSize}
              y2={cy}
              stroke={stroke}
              strokeWidth="2"
            />
          </g>
        );
      
      case 'asexual':
        // Small diamond
        return (
          <rect
            x={person.x + offsetX}
            y={cy - symbolSize/2}
            width={symbolSize}
            height={symbolSize}
            transform={`rotate(45 ${person.x + offsetX + symbolSize/2} ${cy})`}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            style={{ pointerEvents: 'none' }}
          />
        );
      
      case 'queer':
      case 'questioning':
        // Question mark symbol
        return (
          <text
            x={person.x + offsetX + symbolSize/2}
            y={cy + symbolSize*0.2}
            textAnchor="middle"
            fontSize={symbolSize}
            fill={stroke}
            fontWeight="bold"
            style={{ pointerEvents: 'none' }}
          >
            ?
          </text>
        );
      
      default:
        return null;
    }
  };

  const renderNodeIcon = () => {
    if (isPersonNode) return null;
  const iconValue = (visualStyle.icon || '').trim();
  const iconKey = iconValue.toLowerCase().replace(/[^a-z0-9]/g, '');
    const IconComponent = NODE_ICON_MAP[iconKey];
    const iconColor = visualStyle.iconColor || getStrokeColor();

    if (IconComponent) {
      const iconSize = Math.max(18, size * 0.55);
      const offset = iconSize / 2;
      return (
        <g style={{ pointerEvents: 'none' }}>
          <g transform={`translate(${person.x + size / 2 - offset}, ${person.y + size / 2 - offset})`}>
            <IconComponent size={iconSize} color={iconColor} strokeWidth={1.8} />
          </g>
        </g>
      );
    }

    const glyph = iconValue || NODE_ICON_FALLBACK[nodeType] || '◆';
    const iconFontSize = Math.max(18, size * 0.5);

    return (
      <text
        x={person.x + size / 2}
        y={person.y + size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={iconFontSize}
        fill={iconColor}
        fontWeight="600"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {glyph}
      </text>
    );
  };

  // Special indicators for multiple cultures and immigration
  const renderSpecialIndicators = () => {
    if (!isPersonNode) return null;
    const cx = person.x + size/2;
    
    if (person.specialStatus === 'multiple-cultures') {
      // Double line above shape
      return (
        <g style={{ pointerEvents: 'none' }}>
          <path
            d={`M ${person.x + 10},${person.y - 5} Q ${cx},${person.y - 15} ${person.x + size - 10},${person.y - 5}`}
            fill="none"
            stroke={getStrokeColor()}
            strokeWidth="2"
          />
          <path
            d={`M ${person.x + 10},${person.y - 10} Q ${cx},${person.y - 20} ${person.x + size - 10},${person.y - 10}`}
            fill="none"
            stroke={getStrokeColor()}
            strokeWidth="2"
          />
        </g>
      );
    }
    
    if (person.specialStatus === 'immigration') {
      // Curved line above shape
      return (
        <path
          d={`M ${person.x + 10},${person.y - 5} Q ${cx},${person.y - 15} ${person.x + size - 10},${person.y - 5}`}
          fill="none"
          stroke={getStrokeColor()}
          strokeWidth="2"
          style={{ pointerEvents: 'none' }}
        />
      );
    }
    
    return null;
  };

  const renderDeceasedMarker = () => {
    if (!isPersonNode) return null;
    if (!person.isDeceased) return null;
    if (deceasedSymbol === 'none' || deceasedRenderType === 'none') return null;

    if (deceasedRenderType === 'outline') {
      return null;
    }

    if (deceasedRenderType === 'above') {
      const centerX = person.x + size / 2;
      const baseY = person.y - Math.max(18, size * 0.4);
      const haloStroke = '#fbbf24';

      if (deceasedSymbol === 'halo') {
        const haloWidth = Math.max(20, size * 0.7);
        const haloHeight = Math.max(6, size * 0.18);
        return (
          <g style={{ pointerEvents: 'none' }}>
            <ellipse
              cx={centerX}
              cy={baseY}
              rx={haloWidth / 2}
              ry={haloHeight / 2}
              fill="none"
              stroke={haloStroke}
              strokeWidth={Math.max(2, size * 0.03)}
              opacity={0.9}
            />
            <ellipse
              cx={centerX}
              cy={baseY}
              rx={haloWidth / 2}
              ry={haloHeight / 2}
              fill={haloStroke}
              opacity={0.12}
            />
          </g>
        );
      }

      if (deceasedSymbol === 'star') {
        const outerRadius = Math.max(12, size * 0.28);
        const innerRadius = outerRadius * 0.45;
        const points = [];
        for (let i = 0; i < 10; i += 1) {
          const angle = Math.PI / 2 + i * (Math.PI / 5);
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          points.push(`${centerX + radius * Math.cos(angle)},${baseY - radius * Math.sin(angle)}`);
        }
        return (
          <g style={{ pointerEvents: 'none' }}>
            <polygon
              points={points.join(' ')}
              fill="#facc15"
              stroke="#f59e0b"
              strokeWidth={Math.max(1, size * 0.02)}
            />
          </g>
        );
      }

      if (deceasedSymbol === 'sparkle') {
        const long = Math.max(16, size * 0.4);
        const short = long * 0.6;
        const strokeWidth = Math.max(1.4, size * 0.03);
        return (
          <g
            style={{ pointerEvents: 'none' }}
            stroke="#fbbf24"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          >
            <line x1={centerX} y1={baseY - long / 2} x2={centerX} y2={baseY + long / 2} />
            <line x1={centerX - long / 2} y1={baseY} x2={centerX + long / 2} y2={baseY} />
            <line x1={centerX - short / 2} y1={baseY - short / 2} x2={centerX + short / 2} y2={baseY + short / 2} />
            <line x1={centerX + short / 2} y1={baseY - short / 2} x2={centerX - short / 2} y2={baseY + short / 2} />
          </g>
        );
      }

      return null;
    }

  const chipRadius = Math.max(10, size * 0.22);
  const chipCx = person.x + size / 2;
  const chipInsideRatio = 0.6; // keep roughly 60% of the badge inside the shape
  const chipCy = person.y + chipRadius * (2 * chipInsideRatio - 1);

    const renderChipBackground = () => (
      <circle
        cx={chipCx}
        cy={chipCy}
        r={chipRadius}
        fill="rgba(255,255,255,0.95)"
        stroke="#d1d5db"
        strokeWidth={1.4}
      />
    );

    switch (deceasedSymbol) {
      case 'classic-x': {
        const stroke = '#6b7280';
        const centerX = person.x + size / 2;
        const subtleChipRadius = Math.max(9, size * 0.18);
        const subtleInsideRatio = 0.6;
        const centerY = person.y + subtleChipRadius * (2 * subtleInsideRatio - 1);
        const crossRadius = subtleChipRadius * 0.55;
        const crossStrokeWidth = Math.max(1.4, size * 0.032);
        return (
          <g style={{ pointerEvents: 'none' }}>
            <circle
              cx={centerX}
              cy={centerY}
              r={subtleChipRadius}
              fill="rgba(255,255,255,0.92)"
              stroke="#d1d5db"
              strokeWidth={1.2}
            />
            <line
              x1={centerX - crossRadius}
              y1={centerY - crossRadius}
              x2={centerX + crossRadius}
              y2={centerY + crossRadius}
              stroke={stroke}
              strokeWidth={crossStrokeWidth}
              strokeLinecap="round"
            />
            <line
              x1={centerX - crossRadius}
              y1={centerY + crossRadius}
              x2={centerX + crossRadius}
              y2={centerY - crossRadius}
              stroke={stroke}
              strokeWidth={crossStrokeWidth}
              strokeLinecap="round"
            />
          </g>
        );
      }
      case 'heart': {
        const heartScale = chipRadius / 20;
        const hx = (value) => chipCx + (value - 32) * heartScale;
        const hy = (value) => chipCy + (value - 34) * heartScale;
        return (
          <g style={{ pointerEvents: 'none' }}>
            {renderChipBackground()}
            <path
              d={`M ${hx(32)} ${hy(22)}
                 C ${hx(26)} ${hy(13)}, ${hx(12)} ${hy(22)}, ${hx(20)} ${hy(32)}
                 C ${hx(26)} ${hy(40)}, ${hx(32)} ${hy(44)}, ${hx(32)} ${hy(44)}
                 C ${hx(32)} ${hy(44)}, ${hx(38)} ${hy(40)}, ${hx(44)} ${hy(32)}
                 C ${hx(52)} ${hy(22)}, ${hx(38)} ${hy(13)}, ${hx(32)} ${hy(22)}`}
              fill="#f472b6"
              stroke="#ec4899"
              strokeWidth={Math.max(1.2, size * 0.025)}
              strokeLinejoin="round"
            />
          </g>
        );
      }
      case 'flower': {
        const petalRadius = chipRadius * 0.38;
        const offsets = [0, 72, 144, 216, 288];
        return (
          <g style={{ pointerEvents: 'none' }}>
            {renderChipBackground()}
            {offsets.map((angle, index) => {
              const radians = (angle * Math.PI) / 180;
              const x = chipCx + Math.cos(radians) * chipRadius * 0.55;
              const y = chipCy + Math.sin(radians) * chipRadius * 0.55;
              return (
                <circle
                  key={`petal-${index}`}
                  cx={x}
                  cy={y}
                  r={petalRadius}
                  fill="#fb7185"
                  opacity={0.88}
                />
              );
            })}
            <circle
              cx={chipCx}
              cy={chipCy}
              r={petalRadius * 0.75}
              fill="#fde68a"
              stroke="#f59e0b"
              strokeWidth={Math.max(1, size * 0.02)}
            />
          </g>
        );
      }
      case 'butterfly': {
        const wingWidth = chipRadius * 0.9;
        const wingHeight = chipRadius * 0.75;
        const bodyHeight = chipRadius * 1.1;
        const bodyWidth = chipRadius * 0.25;
        const antennaHeight = chipRadius * 0.8;
        return (
          <g style={{ pointerEvents: 'none' }}>
            {renderChipBackground()}
            <ellipse
              cx={chipCx - wingWidth * 0.25}
              cy={chipCy}
              rx={wingWidth * 0.45}
              ry={wingHeight}
              fill="#60a5fa"
              opacity={0.85}
            />
            <ellipse
              cx={chipCx + wingWidth * 0.25}
              cy={chipCy}
              rx={wingWidth * 0.45}
              ry={wingHeight}
              fill="#60a5fa"
              opacity={0.85}
            />
            <rect
              x={chipCx - bodyWidth / 2}
              y={chipCy - bodyHeight / 2}
              width={bodyWidth}
              height={bodyHeight}
              rx={bodyWidth / 2}
              fill="#1d4ed8"
            />
            <line
              x1={chipCx - bodyWidth * 0.2}
              y1={chipCy - bodyHeight / 2}
              x2={chipCx - bodyWidth * 0.8}
              y2={chipCy - bodyHeight / 2 - antennaHeight * 0.6}
              stroke="#1d4ed8"
              strokeWidth={Math.max(1, size * 0.02)}
              strokeLinecap="round"
            />
            <line
              x1={chipCx + bodyWidth * 0.2}
              y1={chipCy - bodyHeight / 2}
              x2={chipCx + bodyWidth * 0.8}
              y2={chipCy - bodyHeight / 2 - antennaHeight * 0.6}
              stroke="#1d4ed8"
              strokeWidth={Math.max(1, size * 0.02)}
              strokeLinecap="round"
            />
          </g>
        );
      }
      case 'ribbon': {
        const ribbonScale = chipRadius / 20;
        const rx = (value) => chipCx + (value - 32) * ribbonScale;
        const ry = (value) => chipCy + (value - 34) * ribbonScale;
        const ribbonStroke = Math.max(2.2, size * 0.045);
        return (
          <g style={{ pointerEvents: 'none' }}>
            {renderChipBackground()}
            <path
              d={`M ${rx(32)} ${ry(10)}
                 C ${rx(42)} ${ry(12)}, ${rx(44)} ${ry(24)}, ${rx(32)} ${ry(36)}
                 C ${rx(20)} ${ry(24)}, ${rx(22)} ${ry(12)}, ${rx(32)} ${ry(10)}`}
              stroke="#ec4899"
              strokeWidth={ribbonStroke}
              strokeLinecap="round"
              fill="none"
            />
            <path
              d={`M ${rx(26)} ${ry(32)} L ${rx(38)} ${ry(44)}`}
              stroke="#ec4899"
              strokeWidth={ribbonStroke}
              strokeLinecap="round"
            />
          </g>
        );
      }
      case 'candle': {
        const candleWidth = chipRadius * 0.6;
        const candleHeight = chipRadius * 0.9;
        const candleX = chipCx - candleWidth / 2;
        const candleY = chipCy + chipRadius * 0.3 - candleHeight;
        return (
          <g style={{ pointerEvents: 'none' }}>
            {renderChipBackground()}
            <rect
              x={candleX}
              y={candleY}
              width={candleWidth}
              height={candleHeight}
              rx={candleWidth * 0.2}
              fill="#fde68a"
              stroke="#fbbf24"
              strokeWidth={1.2}
            />
            <path
              d={`M ${chipCx} ${chipCy - chipRadius * 0.9} C ${chipCx + chipRadius * 0.25} ${chipCy - chipRadius * 0.6}, ${chipCx + chipRadius * 0.08} ${chipCy - chipRadius * 0.2}, ${chipCx} ${chipCy - chipRadius * 0.05} C ${chipCx - chipRadius * 0.08} ${chipCy - chipRadius * 0.2}, ${chipCx - chipRadius * 0.25} ${chipCy - chipRadius * 0.6}, ${chipCx} ${chipCy - chipRadius * 0.9}`}
              fill="#f97316"
              stroke="#fb923c"
              strokeWidth={0.9}
            />
          </g>
        );
      }
      case 'angel': {
        const headRadius = chipRadius * 0.28;
        const wingSpan = chipRadius * 1.05;
        const wingHeight = chipRadius * 0.65;
        const wingTop = chipCy - chipRadius * 0.1;
        return (
          <g style={{ pointerEvents: 'none' }}>
            {renderChipBackground()}
            <circle
              cx={chipCx}
              cy={chipCy - chipRadius * 0.1}
              r={headRadius}
              fill="#bfdbfe"
              stroke="#60a5fa"
              strokeWidth={1}
            />
            <path
              d={`M ${chipCx - headRadius * 0.2} ${wingTop} C ${chipCx - wingSpan} ${chipCy - wingHeight}, ${chipCx - wingSpan} ${chipCy + wingHeight}, ${chipCx - headRadius * 0.2} ${chipCy + wingHeight}`}
              fill="none"
              stroke="#60a5fa"
              strokeWidth={Math.max(1.4, size * 0.03)}
              strokeLinecap="round"
            />
            <path
              d={`M ${chipCx + headRadius * 0.2} ${wingTop} C ${chipCx + wingSpan} ${chipCy - wingHeight}, ${chipCx + wingSpan} ${chipCy + wingHeight}, ${chipCx + headRadius * 0.2} ${chipCy + wingHeight}`}
              fill="none"
              stroke="#60a5fa"
              strokeWidth={Math.max(1.4, size * 0.03)}
              strokeLinecap="round"
            />
          </g>
        );
      }
      case 'infinity': {
        const loopRadius = chipRadius * 0.78;
        const control = loopRadius * 0.6;
        return (
          <g style={{ pointerEvents: 'none' }}>
            {renderChipBackground()}
            <path
              d={`M ${chipCx - loopRadius} ${chipCy}
                 C ${chipCx - control} ${chipCy - loopRadius}, ${chipCx - control / 2} ${chipCy - loopRadius}, ${chipCx} ${chipCy}
                 C ${chipCx + control / 2} ${chipCy + loopRadius}, ${chipCx + control} ${chipCy + loopRadius}, ${chipCx + loopRadius} ${chipCy}
                 C ${chipCx + control} ${chipCy - loopRadius}, ${chipCx + control / 2} ${chipCy - loopRadius}, ${chipCx} ${chipCy}
                 C ${chipCx - control / 2} ${chipCy + loopRadius}, ${chipCx - control} ${chipCy + loopRadius}, ${chipCx - loopRadius} ${chipCy}`}
              fill="none"
              stroke="#38bdf8"
              strokeWidth={Math.max(1.6, size * 0.035)}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );
      }
      case 'cross': {
        const crossScale = chipRadius / 20;
        const cx = (value) => chipCx + (value - 32) * crossScale;
        const cy = (value) => chipCy + (value - 34) * crossScale;
        const crossStroke = Math.max(3.2, size * 0.07);
        const strokeColor = '#ef4444';
        return (
          <g style={{ pointerEvents: 'none' }}>
            {renderChipBackground()}
            <line
              x1={cx(32)}
              y1={cy(14)}
              x2={cx(32)}
              y2={cy(48)}
              stroke={strokeColor}
              strokeWidth={crossStroke}
              strokeLinecap="round"
            />
            <line
              x1={cx(20)}
              y1={cy(28)}
              x2={cx(44)}
              y2={cy(28)}
              stroke={strokeColor}
              strokeWidth={crossStroke * 0.8}
              strokeLinecap="round"
            />
          </g>
        );
      }
      case 'praying-hands': {
        const handsScale = chipRadius / 20;
        const hx = (value) => chipCx + (value - 32) * handsScale;
        const hy = (value) => chipCy + (value - 34) * handsScale;
        const strokeWidth = Math.max(1.2, size * 0.026);
        return (
          <g style={{ pointerEvents: 'none' }}>
            {renderChipBackground()}
            <path
              d={`M ${hx(34)} ${hy(16)}
                 C ${hx(36.5)} ${hy(12.5)}, ${hx(39)} ${hy(13.5)}, ${hx(39)} ${hy(18)}
                 L ${hx(39)} ${hy(30)}
                 C ${hx(39)} ${hy(33.5)}, ${hx(42)} ${hy(37)}, ${hx(45)} ${hy(39.5)}
                 L ${hx(45)} ${hy(44)}
                 C ${hx(41)} ${hy(42)}, ${hx(37)} ${hy(39.5)}, ${hx(34.5)} ${hy(36)}
                 Z`}
              fill="#8b5cf6"
              stroke="#6d28d9"
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            <path
              d={`M ${hx(30)} ${hy(16)}
                 C ${hx(27.5)} ${hy(12.5)}, ${hx(25)} ${hy(13.5)}, ${hx(25)} ${hy(18)}
                 L ${hx(25)} ${hy(30)}
                 C ${hx(25)} ${hy(33.5)}, ${hx(22)} ${hy(37)}, ${hx(19)} ${hy(39.5)}
                 L ${hx(19)} ${hy(44)}
                 C ${hx(23)} ${hy(42)}, ${hx(27)} ${hy(39.5)}, ${hx(29.5)} ${hy(36)}
                 Z`}
              fill="#8b5cf6"
              stroke="#6d28d9"
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            <line
              x1={hx(32)}
              y1={hy(20)}
              x2={hx(32)}
              y2={hy(38)}
              stroke="#c4b5fd"
              strokeWidth={strokeWidth * 0.6}
              strokeLinecap="round"
            />
          </g>
        );
      }
      case 'crescent-star': {
        const crescentScale = chipRadius / 20;
        const cx = (value) => chipCx + (value - 32) * crescentScale;
        const cy = (value) => chipCy + (value - 34) * crescentScale;
        const radius = (value) => value * crescentScale;
        const crescentCenterX = cx(36);
        const crescentCenterY = cy(30);
        const outerRadius = radius(12);
        const innerRadius = radius(10);
        const cutoutCenterX = cx(40);
        const starPoints = [
          [44, 26],
          [46.2, 31.8],
          [52.4, 32],
          [47.2, 35.8],
          [48.8, 41.8],
          [44, 38.4],
          [39.2, 41.8],
          [40.8, 35.8],
          [35.6, 32],
          [41.8, 31.8]
        ]
          .map(([x, y]) => `${cx(x)},${cy(y)}`)
          .join(' ');
        return (
          <g style={{ pointerEvents: 'none' }}>
            {renderChipBackground()}
            <circle
              cx={crescentCenterX}
              cy={crescentCenterY}
              r={outerRadius}
              fill="#22c55e"
            />
            <circle
              cx={cutoutCenterX}
              cy={crescentCenterY}
              r={innerRadius}
              fill="rgba(255,255,255,0.95)"
            />
            <polygon points={starPoints} fill="#22c55e" />
          </g>
        );
      }
      case 'star-of-david': {
        const outer = chipRadius * 1.05;
        const inner = outer * 0.55;
        const makeTriangle = (offsetAngle, radius) => Array.from({ length: 3 }).map((_, i) => {
          const angle = offsetAngle + i * (2 * Math.PI / 3);
          return `${chipCx + radius * Math.cos(angle)},${chipCy + radius * Math.sin(angle)}`;
        }).join(' ');
        return (
          <g style={{ pointerEvents: 'none' }}>
            {renderChipBackground()}
            <polygon points={makeTriangle(-Math.PI / 2, outer)} fill="#0ea5e9" opacity={0.85} />
            <polygon points={makeTriangle(Math.PI / 2, outer)} fill="#0ea5e9" opacity={0.85} />
            <polygon
              points={makeTriangle(-Math.PI / 2, inner)}
              fill="none"
              stroke="#0284c7"
              strokeWidth={Math.max(1, size * 0.02)}
            />
            <polygon
              points={makeTriangle(Math.PI / 2, inner)}
              fill="none"
              stroke="#0284c7"
              strokeWidth={Math.max(1, size * 0.02)}
            />
          </g>
        );
      }
      case 'dharma-wheel': {
        const outer = chipRadius * 0.9;
        const inner = outer * 0.45;
        const hub = inner * 0.45;
        const spokeAngles = [0, 45, 90, 135, 180, 225, 270, 315];
        return (
          <g style={{ pointerEvents: 'none' }}>
            {renderChipBackground()}
            <circle cx={chipCx} cy={chipCy} r={outer} fill="none" stroke="#f59e0b" strokeWidth={Math.max(1.4, size * 0.03)} />
            <circle cx={chipCx} cy={chipCy} r={inner} fill="none" stroke="#f59e0b" strokeWidth={Math.max(1.2, size * 0.025)} />
            <circle cx={chipCx} cy={chipCy} r={hub} fill="#f59e0b" />
            {spokeAngles.map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = chipCx + Math.cos(rad) * hub;
              const y1 = chipCy + Math.sin(rad) * hub;
              const x2 = chipCx + Math.cos(rad) * inner;
              const y2 = chipCy + Math.sin(rad) * inner;
              const xCap = chipCx + Math.cos(rad) * (outer + hub * 0.25);
              const yCap = chipCy + Math.sin(rad) * (outer + hub * 0.25);
              return (
                <g key={`wheel-spoke-${angle}`}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#f59e0b"
                    strokeWidth={Math.max(1.1, size * 0.022)}
                    strokeLinecap="round"
                  />
                  <circle cx={xCap} cy={yCap} r={hub * 0.32} fill="#f59e0b" />
                </g>
              );
            })}
          </g>
        );
      }
      default:
        return null;
    }
  };

  const deceasedMarkerNode = renderDeceasedMarker();

  return (
    <g 
      style={{ opacity: targetOpacity, transition: 'opacity 0.25s ease-in-out' }}
      title={state.highlightNetwork ? 
        (person.networkMember ? 'Click to remove from network' : 'Click to add to network') : 
        undefined}
      onPointerDown={handlePointerDownWithRightClick}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Mac-specific: Add a larger invisible hit area for better right-click detection */}
      {isMac && (
        <rect
          x={person.x - 10}
          y={person.y - 10}
          width={size + 20}
          height={size + 20}
          fill="transparent"
          style={{ 
            pointerEvents: 'all',
            cursor: 'pointer'
          }}
          onPointerDown={handlePointerDownWithRightClick}
          onContextMenu={handleContextMenu}
        />
      )}
      
      {/* Special cultural/immigration indicators above shape */}
      {renderSpecialIndicators()}
      
      {/* Main shape */}
      {renderShape()}

  {/* Non-person icon overlay */}
  {renderNodeIcon()}
      
      {/* Sexual orientation symbols */}
      {renderSexualOrientationSymbols()}
      
      {/* Special status icon in top left for adoption/foster/step/unborn */}
      {(person.specialStatus === 'adopted' || person.specialStatus === 'foster' || person.specialStatus === 'step' || person.specialStatus === 'unborn') && (
        <g>
          {person.specialStatus === 'unborn' ? (
            /* Triangle symbol for unborn/fetus */
            <polygon
              points={`${person.x + 8},${person.y + 4} ${person.x + 2},${person.y + 14} ${person.x + 14},${person.y + 14}`}
              fill="white"
              stroke={getStrokeColor()}
              strokeWidth="1.5"
              style={{ pointerEvents: 'none' }}
            />
          ) : (
            <>
              <circle
                cx={person.x + 8}
                cy={person.y + 8}
                r="8"
                fill="white"
                stroke={getStrokeColor()}
                strokeWidth="1.5"
              />
              <text
                x={person.x + 8}
                y={person.y + 12}
                textAnchor="middle"
                fontSize="10"
                fill={getStrokeColor()}
                fontWeight="bold"
                style={{ pointerEvents: 'none' }}
              >
                {person.specialStatus === 'adopted' && 'A'}
                {person.specialStatus === 'foster' && 'F'}
                {person.specialStatus === 'step' && 'S'}
              </text>
            </>
          )}
        </g>
      )}
      
      {/* Twin indicator */}
      {person.twinGroup && (
        <g>
          <rect
            x={person.x - 2}
            y={person.y + size/2 - 6}
            width="4"
            height="12"
            fill={getStrokeColor()}
            rx="2"
          />
          {person.twinType === 'identical' && (
            <rect
              x={person.x - 6}
              y={person.y + size/2 - 2}
              width="12"
              height="4"
              fill={getStrokeColor()}
              rx="2"
            />
          )}
        </g>
      )}
      
      {/* Name/Initials */}
      {isPersonNode ? (
        <text
          x={person.x + size/2}
          y={person.y + size/2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={nameDisplay.fontSize}
          fill="#1e293b"
          style={{ pointerEvents: 'none', userSelect: 'none', fontWeight: '500' }}
        >
          {nameDisplay.lines.length === 1 ? (
            nameDisplay.lines[0]
          ) : nameDisplay.lines.length === 2 ? (
            <>
              <tspan x={person.x + size/2} dy={-nameDisplay.fontSize * 0.5}>
                {nameDisplay.lines[0]}
              </tspan>
              <tspan x={person.x + size/2} dy={nameDisplay.fontSize * 1.1}>
                {nameDisplay.lines[1]}
              </tspan>
            </>
          ) : (
            /* Three lines */
            <>
              <tspan x={person.x + size/2} dy={-nameDisplay.fontSize * 1}>
                {nameDisplay.lines[0]}
              </tspan>
              <tspan x={person.x + size/2} dy={nameDisplay.fontSize * 1.1}>
                {nameDisplay.lines[1]}
              </tspan>
              <tspan x={person.x + size/2} dy={nameDisplay.fontSize * 1.1}>
                {nameDisplay.lines[2]}
              </tspan>
            </>
          )}
        </text>
      ) : (
        <text
          x={person.x + size/2}
          y={nonPersonNameY}
          textAnchor="middle"
          dominantBaseline="hanging"
          fontSize={nameDisplay.fontSize}
          fill="#1f2937"
          fontWeight="600"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {nameDisplay.lines.map((line, index) => (
            <tspan
              key={`node-name-line-${index}`}
              x={person.x + size/2}
              dy={index === 0 ? 0 : nameDisplay.fontSize * 1.1}
            >
              {line}
            </tspan>
          ))}
        </text>
      )}
      
      {/* Remembrance marker for deceased individuals (rendered on top for clarity) */}
      {deceasedMarkerNode}

      {/* Age below shape */}
      {hasAgeLabel && ageLabelY !== null && (
        <text
          x={person.x + size/2}
          y={ageLabelY}
          textAnchor="middle"
          fontSize="10"
          fill="#64748b"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {(() => {
            // Calculate age from birth date if available
            if (person.birthDate) {
              const birthDate = new Date(person.birthDate);
              const currentDate = person.isDeceased && person.deathDate
                ? new Date(person.deathDate)
                : new Date();

              // More accurate age calculation
              let ageInMonths = (currentDate.getFullYear() - birthDate.getFullYear()) * 12 +
                               (currentDate.getMonth() - birthDate.getMonth());

              // Adjust for day of month
              if (currentDate.getDate() < birthDate.getDate()) {
                ageInMonths--;
              }

              // Don't show negative ages
              if (ageInMonths < 0) {
                ageInMonths = 0;
              }

              if (ageInMonths < 24) {
                // Under 2 years - show in months
                return `${ageInMonths} mo`;
              } else {
                // 2+ years - show in years
                const ageInYears = Math.floor(ageInMonths / 12);
                return `${ageInYears} yo`;
              }
            } else if (person.age) {
              // Use manually entered age
              const age = parseInt(person.age, 10);
              if (Number.isNaN(age) || age < 0) {
                return '';
              }
              // Assume manually entered age is in years
              return `${age} yo`;
            }
            return '';
          })()}
        </text>
      )}

      {/* Birth/Death dates below shape - only show for deceased people */}
      {hasLifeSpanLabel && lifeSpanLabelY !== null && (
        <text
          x={person.x + size/2}
          y={lifeSpanLabelY}
          textAnchor="middle"
          fontSize="10"
          fill="#64748b"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {(() => {
            const formatDate = (dateString) => {
              if (!dateString) return '';
              const date = new Date(dateString);
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              return `${months[date.getMonth()]} ${date.getFullYear()}`;
            };

            if (person.birthDate && person.deathDate) {
              // Format: "Jan 1910-Oct 2005"
              return `${formatDate(person.birthDate)}-${formatDate(person.deathDate)}`;
            }
            if (person.birthDate) {
              // Just birth date: "Born: Jan 1910"
              return `Born: ${formatDate(person.birthDate)}`;
            }
            if (person.deathDate) {
              // Just death date: "d. Oct 2005" <- used to say "Died" but "d." is more sensitive
              return `d. ${formatDate(person.deathDate)}`;
            }
            return '';
          })()}
        </text>
      )}

      {/* Network role below age when network highlighting is active */}
      {showNetworkRole && networkRoleRectY !== null && networkRoleTextY !== null && (
        <g>
          {/* Background rectangle for better readability */}
          <rect
            x={person.x + size/2 - (person.role.length * 3)}
            y={networkRoleRectY}
            width={person.role.length * 6}
            height="16"
            rx="3"
            fill="rgba(255, 255, 255, 0.9)"
            stroke="#059669"
            strokeWidth="0.5"
            style={{ pointerEvents: 'none' }}
          />
          <text
            x={person.x + size/2}
            y={networkRoleTextY}
            textAnchor="middle"
            fontSize="11"
            fill="#059669"
            fontWeight="700"
            style={{
              pointerEvents: 'none',
              userSelect: 'none'
            }}
          >
            {person.role}
          </text>
        </g>
      )}
      
      {/* Network member indicator */}
      {person.networkMember && (
        <circle
          cx={person.x + size}
          cy={person.y}
          r="6"
          fill="#10b981"
          stroke="white"
          strokeWidth="2"
          style={{ pointerEvents: 'none' }}
        />
      )}
      
      {/* Multiple births number indicator */}
      {person.multipleBirthOrder && (
        <g>
          <circle
            cx={person.x}
            cy={person.y + size}
            r="10"
            fill="white"
            stroke={getStrokeColor()}
            strokeWidth="2"
          />
          <text
            x={person.x}
            y={person.y + size + 4}
            textAnchor="middle"
            fontSize="12"
            fill={getStrokeColor()}
            fontWeight="bold"
            style={{ pointerEvents: 'none' }}
          >
            {person.multipleBirthOrder}
          </text>
        </g>
      )}
      
      {/* Pregnancy indicator - "PG" badge */}
      {person.isPregnant && (
        <g>
          {/* Badge background */}
          <rect
            x={person.x + size - 22}
            y={person.y - 8}
            width="24"
            height="14"
            rx="7"
            fill="#fbbf24"
            stroke="white"
            strokeWidth="1.5"
            style={{ pointerEvents: 'none' }}
          />
          {/* "PG" text */}
          <text
            x={person.x + size - 10}
            y={person.y - 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fill="white"
            fontWeight="bold"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            PG
          </text>
        </g>
      )}
      
      {/* Carrier status indicator */}
      {person.carrierStatus && (
        <g>
          <circle
            cx={person.x + size/2}
            cy={person.y + size/2}
            r={size/2 - 5}
            fill="none"
            stroke={getStrokeColor()}
            strokeWidth="1"
            strokeDasharray="2,2"
            style={{ pointerEvents: 'none' }}
          />
        </g>
      )}
      
      {/* Medical condition indicator */}
      {person.medicalConditions && person.medicalConditions.length > 0 && (
        <g>
          <rect
            x={person.x + size - 16}
            y={person.y + size - 16}
            width="16"
            height="16"
            rx="3"
            fill="#ef4444"
            stroke="white"
            strokeWidth="2"
          />
          <text
            x={person.x + size - 8}
            y={person.y + size - 6}
            textAnchor="middle"
            fontSize="10"
            fill="white"
            fontWeight="bold"
            style={{ pointerEvents: 'none' }}
          >
            +
          </text>
        </g>
      )}
      
      {/* Custom emoji/icon */}
      {person.customIcon && (
        <text
          x={person.x + size - 10}
          y={person.y + size - 10}
          fontSize="16"
          style={{ pointerEvents: 'none' }}
        >
          {person.customIcon}
        </text>
      )}
      
      {/* "Just Added" pulsing indicator - shows for 3 seconds after adding from search */}
      {justAdded && (
        <g style={{ pointerEvents: 'none' }}>
          {/* Outer pulsing ring - pulses INWARD to draw attention TO the person */}
          <circle
            cx={person.x + size/2}
            cy={person.y + size/2}
            r={size * 1.2}
            fill="none"
            stroke="#10b981"
            strokeWidth="4"
            opacity="0.8"
            style={{
              animation: 'pulse-ring-inward 1.5s ease-in-out infinite',
              transformOrigin: `${person.x + size/2}px ${person.y + size/2}px`
            }}
          />
          {/* Middle pulsing ring */}
          <circle
            cx={person.x + size/2}
            cy={person.y + size/2}
            r={size * 0.9}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            opacity="0.6"
            style={{
              animation: 'pulse-ring-inward 1.5s ease-in-out 0.3s infinite',
              transformOrigin: `${person.x + size/2}px ${person.y + size/2}px`
            }}
          />
          {/* Glow effect around the actual person node */}
          <circle
            cx={person.x + size/2}
            cy={person.y + size/2}
            r={size * 0.6}
            fill="#10b981"
            opacity="0.15"
            style={{
              animation: 'pulse-glow 1s ease-in-out infinite alternate'
            }}
          />
          {/* Badge showing it's from search */}
          <g>
            <rect
              x={person.x + size/2 - 60}
              y={person.y - 40}
              width="120"
              height="28"
              rx="14"
              fill="#10b981"
              style={{
                filter: 'drop-shadow(0 2px 8px rgba(16, 185, 129, 0.5))'
              }}
            />
            <text
              x={person.x + size/2}
              y={person.y - 21}
              textAnchor="middle"
              fontSize="12"
              fill="white"
              fontWeight="bold"
            >
              NEW FROM SEARCH
            </text>
          </g>
        </g>
      )}
      
      {/* Selection indicator */}
      {isSelected && (
        <rect
          x={person.x - 5}
          y={person.y - 5}
          width={size + 10}
          height={size + 10}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="5,5"
          rx={size * 0.2}
          style={{ pointerEvents: 'none' }}
        />
      )}
      
      {/* Connection indicators */}
      {isConnectionSource && (
        <text
          x={person.x + size/2}
          y={person.y - 10}
          textAnchor="middle"
          fontSize="12"
          fill="#f59e0b"
          style={{ pointerEvents: 'none', fontWeight: 'bold' }}
        >
          Connecting from...
        </text>
      )}
      
      {isConnectionTarget && (
        <text
          x={person.x + size/2}
          y={person.y - 10}
          textAnchor="middle"
          fontSize="12"
          fill="#10b981"
          style={{ pointerEvents: 'none', fontWeight: 'bold' }}
        >
          Connect to
        </text>
      )}
      
      {/* Disconnect from parents button when selected and has parents */}
      {isSelected && !isConnecting && (() => {
        const hasParents = state.relationships.some(r => r.type === 'child' && r.to === person.id);
        
        if (!hasParents) return null;
        
        return (
          <g
            style={{ cursor: 'pointer' }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              
              // Find the child relationship
              const childRelationship = state.relationships.find(r => 
                r.type === 'child' && r.to === person.id
              );
              
              if (!childRelationship) return;
              
              // Find the parent relationship to get parent names
              const parentRelationship = state.relationships.find(r => r.id === childRelationship.from);
              if (!parentRelationship) return;
              
              const parent1 = state.people.find(p => p.id === parentRelationship.from);
              const parent2 = state.people.find(p => p.id === parentRelationship.to);
              
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
                message: `Disconnect ${person.name} from ${parentNames}?`,
                onConfirm: () => {
                  actions.deleteRelationship(childRelationship.id);
                  actions.setDeleteConfirmation(null);
                },
                onCancel: () => actions.setDeleteConfirmation(null)
              });
            }}
          >
            {/* Larger invisible clickable area */}
            <circle
              cx={person.x + size - 5}
              cy={person.y + size - 5}
              r="15"
              fill="transparent"
              stroke="transparent"
              style={{ cursor: 'pointer' }}
            />
            {/* Visible disconnect button */}
            <circle
              cx={person.x + size - 5}
              cy={person.y + size - 5}
              r="10"
              fill="#ffffff"
              stroke="#f59e0b"
              strokeWidth="2"
              style={{ 
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                pointerEvents: 'none'
              }}
            />
            <text
              x={person.x + size - 5}
              y={person.y + size - 1}
              textAnchor="middle"
              fontSize="14"
              fill="#f59e0b"
              fontWeight="bold"
              style={{ pointerEvents: 'none' }}
            >
              ⚡
            </text>
          </g>
        );
      })()}

      {/* Tag indicators - show first 3 tags as colored dots */}
      {person.tags && person.tags.length > 0 && (() => {
        const displayTags = person.tags.slice(0, 3);
        const tagSpacing = 8;
        const startX = person.x + 5;
        
        return (
          <g>
            {displayTags.map((tagId, index) => {
              const tagDef = state.tagDefinitions.find(t => t.id === tagId);
              if (!tagDef) return null;
              
              const dotX = startX + (index * tagSpacing);
              const dotY = person.y + 5;
              
              return (
                <g key={tagId}>
                  <circle
                    cx={dotX}
                    cy={dotY}
                    r="3"
                    fill={tagDef.color}
                    stroke="white"
                    strokeWidth="1"
                    style={{ pointerEvents: 'none' }}
                  />
                  <title>{tagDef.name}</title>
                </g>
              );
            })}
            {person.tags.length > 3 && (
              <text
                x={startX + (3 * tagSpacing)}
                y={person.y + 7}
                fontSize="8"
                fill="#6b7280"
                fontWeight="bold"
                style={{ pointerEvents: 'none' }}
              >
                +{person.tags.length - 3}
              </text>
            )}
          </g>
        );
      })()}

      {/* Network Search button when selected - for PERSON nodes only */}
      {isSelected && !isConnecting && isPersonNode && (() => {
        return (
          <g
            style={{ cursor: 'pointer' }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              actions.setSearchingNetworkFor(person);
            }}
          >
            {/* Larger invisible clickable area */}
            <circle
              cx={person.x + size - 5}
              cy={person.y + 25}
              r="15"
              fill="transparent"
              stroke="transparent"
              style={{ cursor: 'pointer' }}
            />
            {/* Visible search button */}
            <circle
              cx={person.x + size - 5}
              cy={person.y + 25}
              r="10"
              fill="#ffffff"
              stroke="#3b82f6"
              strokeWidth="2"
              style={{ 
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                pointerEvents: 'none'
              }}
            />
            {/* Search icon (magnifying glass) */}
            <g style={{ pointerEvents: 'none' }}>
              <circle
                cx={person.x + size - 7}
                cy={person.y + 23}
                r="3.5"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.5"
              />
              <line
                x1={person.x + size - 4.5}
                y1={person.y + 25.5}
                x2={person.x + size - 2}
                y2={person.y + 28}
                stroke="#3b82f6"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>
          </g>
        );
      })()}

      {/* Delete button when selected */}
      {isSelected && !isConnecting && (() => {
        return (
          <g
            style={{ cursor: 'pointer' }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              
              actions.setDeleteConfirmation({
                type: 'person',
                title: 'Delete Person',
                message: `Are you sure you want to delete ${person.name}? This will also remove all their relationships.`,
                onConfirm: () => {
                  actions.deletePerson(person.id);
                  actions.setDeleteConfirmation(null);
                },
                onCancel: () => {
                  actions.setDeleteConfirmation(null);
                }
              });
            }}
          >
            {/* Larger invisible clickable area */}
            <circle
              cx={person.x + size - 5}
              cy={person.y + 5}
              r="15"
              fill="transparent"
              stroke="transparent"
              style={{ cursor: 'pointer' }}
            />
            {/* Visible delete button */}
            <circle
              cx={person.x + size - 5}
              cy={person.y + 5}
              r="10"
              fill="#ffffff"
              stroke="#ef4444"
              strokeWidth="2"
              style={{ 
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                pointerEvents: 'none'
              }}
            />
            <text
              x={person.x + size - 5}
              y={person.y + 9}
              textAnchor="middle"
              fontSize="14"
              fill="#ef4444"
              fontWeight="bold"
              style={{ pointerEvents: 'none' }}
            >
              ×
            </text>
          </g>
        );
      })()}
    </g>
  );
};

export default Person;