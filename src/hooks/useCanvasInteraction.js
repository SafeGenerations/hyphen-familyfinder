// src/hooks/useCanvasInteraction.js
import React from 'react';
import { useState, useCallback } from 'react';
import { useGenogram } from '../contexts/GenogramContext';

const GRID_SIZE = 20;

export const useCanvasInteraction = (canvasRef) => {
  const { state, actions } = useGenogram();
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  const [draggedPerson, setDraggedPerson] = useState(null);
  const [draggedTextBox, setDraggedTextBox] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Convert screen coordinates to canvas coordinates
  const getCanvasCoords = useCallback((e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const pt = canvasRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(canvasRef.current.getScreenCTM().inverse());
    return {
      x: (svgP.x - state.pan.x) / state.zoom,
      y: (svgP.y - state.pan.y) / state.zoom
    };
  }, [state.pan, state.zoom, canvasRef]);

  // Snap to grid if enabled
  const snapToGrid = useCallback((value) => {
    if (!state.snapToGrid) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, [state.snapToGrid]);

  // Handle mouse down on canvas
  const handleMouseDown = useCallback((e) => {
    if (e.target !== canvasRef.current) return;
    
    if (state.isDrawingHousehold) {
      const point = getCanvasCoords(e);
      actions.addHouseholdPoint({
        x: snapToGrid(point.x),
        y: snapToGrid(point.y)
      });
    } else if (spacePressed || e.button === 1) {
      // Middle mouse button or space+drag for panning
      setIsPanning(true);
      setPanStart({ x: e.clientX - state.pan.x, y: e.clientY - state.pan.y });
    } else if (e.button === 0) {
      // Left mouse button - start panning
      setIsPanning(true);
      setPanStart({ x: e.clientX - state.pan.x, y: e.clientY - state.pan.y });
      // Clear selection when clicking on empty canvas
      actions.clearSelection();
    }
  }, [state.isDrawingHousehold, state.pan, spacePressed, getCanvasCoords, snapToGrid, actions, canvasRef]);

  // Handle mouse move
  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      const newPan = {
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      };
      actions.setPan(newPan);
    } else if (draggedPerson) {
      const coords = getCanvasCoords(e);
      actions.updatePerson(draggedPerson, {
        x: snapToGrid(coords.x - dragOffset.x),
        y: snapToGrid(coords.y - dragOffset.y)
      });
    } else if (draggedTextBox) {
      const coords = getCanvasCoords(e);
      actions.updateTextBox(draggedTextBox, {
        x: snapToGrid(coords.x - dragOffset.x),
        y: snapToGrid(coords.y - dragOffset.y)
      });
    }
  }, [isPanning, panStart, draggedPerson, draggedTextBox, dragOffset, getCanvasCoords, snapToGrid, actions]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggedPerson(null);
    setDraggedTextBox(null);
    
    // Save to history if we were dragging something
    if (draggedPerson || draggedTextBox) {
      actions.saveToHistory({
        people: state.people,
        relationships: state.relationships,
        households: state.households,
        textBoxes: state.textBoxes
      });
    }
  }, [draggedPerson, draggedTextBox, state, actions]);

  // Handle wheel (zoom)
  const handleWheel = useCallback((e) => {
    if (!canvasRef.current) return;
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(5, Math.max(0.2, state.zoom * scaleFactor));
      
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - state.pan.x) / state.zoom;
      const mouseY = (e.clientY - rect.top - state.pan.y) / state.zoom;
      
      actions.setPan({
        x: state.pan.x - (mouseX * newZoom - mouseX * state.zoom),
        y: state.pan.y - (mouseY * newZoom - mouseY * state.zoom)
      });
      
      actions.setZoom(newZoom);
    } else {
      // Pan with mouse wheel
      actions.setPan({
        x: state.pan.x - e.deltaX,
        y: state.pan.y - e.deltaY
      });
    }
  }, [state.zoom, state.pan, actions, canvasRef]);

  // Handle canvas click - removed since we're using mousedown for panning now
  const handleCanvasClick = useCallback((e) => {
    // Do nothing - selection clearing happens in mouseDown
  }, []);

  // Handle canvas right click
  const handleCanvasRightClick = useCallback((e) => {
    e.preventDefault();
    if (e.target === canvasRef.current) {
      const coords = getCanvasCoords(e);
      actions.setContextMenu({
        type: 'canvas',
        x: e.clientX,
        y: e.clientY,
        canvasX: coords.x,
        canvasY: coords.y
      });
    }
  }, [getCanvasCoords, actions, canvasRef]);

  // Setup keyboard listeners
  React.useEffect(() => {
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
      if (e.code === 'Space' && !isEditableTarget(e.target)) {
        e.preventDefault();
        setSpacePressed(true);
        // Change cursor to indicate pan mode
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'grab';
        }
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        // Reset cursor
        if (canvasRef.current && !state.isDrawingHousehold) {
          canvasRef.current.style.cursor = 'default';
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [canvasRef, state.isDrawingHousehold]);

  // Update cursor based on panning state
  React.useEffect(() => {
    if (canvasRef.current) {
      if (isPanning) {
        canvasRef.current.style.cursor = 'grabbing';
      } else if (spacePressed) {
        canvasRef.current.style.cursor = 'grab';
      } else if (state.isDrawingHousehold) {
        canvasRef.current.style.cursor = 'crosshair';
      } else {
        canvasRef.current.style.cursor = 'default';
      }
    }
  }, [isPanning, spacePressed, state.isDrawingHousehold, canvasRef]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleCanvasClick,
    handleCanvasRightClick,
    setDraggedPerson,
    setDraggedTextBox,
    setDragOffset,
    getCanvasCoords,
    snapToGrid
  };
};