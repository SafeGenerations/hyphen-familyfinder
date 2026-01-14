// ===== FILE: src-modern/hooks/useCanvasOperations.js =====
import { useCallback, useRef, useEffect } from 'react';
import { useGenogram } from '../contexts/GenogramContext';
import { useResponsive } from '../utils/responsive';

export const useCanvasOperations = () => {
  const context = useGenogram();
  const { isMobile } = useResponsive();
  const panStartRef = useRef(null);
  const isPanningRef = useRef(false);
  
  // Define all callbacks first (before any conditional logic)
  const fitToCanvas = useCallback(() => {
    // Early exit if context not ready
    if (!context?.state) {
      console.warn('GenogramContext not ready for fitToCanvas');
      return;
    }
    
    const { people = [], relationships = [], households = [], textBoxes = [] } = context.state;
    const { actions } = context;
    
    if (!actions) {
      console.warn('GenogramContext actions not available');
      return;
    }

    // Calculate bounds based on all objects
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let hasObjects = false;

    // Include people
    people.forEach(person => {
      hasObjects = true;
      minX = Math.min(minX, person.x);
      maxX = Math.max(maxX, person.x + 60);
      minY = Math.min(minY, person.y);
      maxY = Math.max(maxY, person.y + 60);
    });

    // Include text boxes
    textBoxes.forEach(textBox => {
      hasObjects = true;
      minX = Math.min(minX, textBox.x);
      maxX = Math.max(maxX, textBox.x + (textBox.width || 150));
      minY = Math.min(minY, textBox.y);
      maxY = Math.max(maxY, textBox.y + (textBox.height || 50));
    });

    // Include households
    households.forEach(household => {
      if (household.points && household.points.length > 0) {
        hasObjects = true;
        household.points.forEach(point => {
          minX = Math.min(minX, point.x);
          maxX = Math.max(maxX, point.x);
          minY = Math.min(minY, point.y);
          maxY = Math.max(maxY, point.y);
        });
      }
    });

    if (!hasObjects) return;

    const padding = isMobile ? 30 : 50;
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - (isMobile ? 120 : 100);
    
    const scaleX = viewportWidth / (contentWidth + 2 * padding);
    const scaleY = viewportHeight / (contentHeight + 2 * padding);
    const scale = Math.min(scaleX, scaleY, 2);
    
    const centerX = minX + contentWidth / 2;
    const centerY = minY + contentHeight / 2;
    
    actions.setZoom(scale);
    actions.setPan({
      x: (viewportWidth / 2 - centerX * scale) / scale,
      y: (viewportHeight / 2 - centerY * scale) / scale
    });
  }, [context, isMobile]);

  const centerCanvas = useCallback(() => {
    if (!context?.state || !context?.actions) {
      console.warn('GenogramContext not ready for centerCanvas');
      return;
    }
    
    const { people = [] } = context.state;
    const { actions } = context;
    
    if (people.length === 0) {
      actions.setPan({ x: 0, y: 0 });
      actions.setZoom(1);
      return;
    }
    
    let totalX = 0, totalY = 0;
    people.forEach(person => {
      totalX += person.x + 30;
      totalY += person.y + 30;
    });
    
    const centerX = totalX / people.length;
    const centerY = totalY / people.length;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    actions.setPan({
      x: viewportWidth / 2 - centerX,
      y: viewportHeight / 2 - centerY
    });
  }, [context]);

  const handleZoom = useCallback((delta, clientX, clientY) => {
    if (!context?.state || !context?.actions) {
      console.warn('GenogramContext not ready for handleZoom');
      return;
    }
    
    const { zoom, pan } = context.state;
    const { actions } = context;
    
    const scaleFactor = delta > 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.1, Math.min(5, zoom * scaleFactor));
    
    if (clientX !== undefined && clientY !== undefined) {
      const rect = document.getElementById('genogram-canvas')?.getBoundingClientRect();
      if (rect) {
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        const worldX = (x - pan.x * zoom) / zoom;
        const worldY = (y - pan.y * zoom) / zoom;
        
        const newPanX = (x - worldX * newZoom) / newZoom;
        const newPanY = (y - worldY * newZoom) / newZoom;
        
        actions.setPan({ x: newPanX, y: newPanY });
      }
    }
    
    actions.setZoom(newZoom);
  }, [context]);

  const handlePan = useCallback((deltaX, deltaY) => {
    if (!context?.state || !context?.actions) {
      console.warn('GenogramContext not ready for handlePan');
      return;
    }
    
    const { zoom, pan } = context.state;
    const { actions } = context;
    
    actions.setPan({
      x: pan.x + deltaX / zoom,
      y: pan.y + deltaY / zoom
    });
  }, [context]);

  const startPan = useCallback((clientX, clientY) => {
    panStartRef.current = { x: clientX, y: clientY };
    isPanningRef.current = true;
  }, []);

  const updatePan = useCallback((clientX, clientY) => {
    if (!isPanningRef.current || !panStartRef.current) return;
    
    const deltaX = clientX - panStartRef.current.x;
    const deltaY = clientY - panStartRef.current.y;
    
    handlePan(deltaX, deltaY);
    panStartRef.current = { x: clientX, y: clientY };
  }, [handlePan]);

  const endPan = useCallback(() => {
    isPanningRef.current = false;
    panStartRef.current = null;
  }, []);

  // Handle case where context is not ready
  if (!context || !context.state) {
    return {
      fitToCanvas: () => console.warn('fitToCanvas called before context ready'),
      centerCanvas: () => console.warn('centerCanvas called before context ready'),
      handleZoom: () => console.warn('handleZoom called before context ready'),
      handlePan: () => console.warn('handlePan called before context ready'),
      startPan: () => console.warn('startPan called before context ready'),
      updatePan: () => console.warn('updatePan called before context ready'),
      endPan: () => console.warn('endPan called before context ready')
    };
  }

  return {
    fitToCanvas,
    centerCanvas,
    handleZoom,
    handlePan,
    startPan,
    updatePan,
    endPan
  };
};