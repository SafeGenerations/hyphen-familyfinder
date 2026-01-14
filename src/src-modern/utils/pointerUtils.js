// ===== pointerUtils.js - COMPLETE FILE =====
// src/src-modern/utils/pointerUtils.js

/**
 * Safely sets pointer capture on an element
 * @param {Element} element - The DOM element
 * @param {number} pointerId - The pointer ID
 * @returns {boolean} - Whether capture was successful
 */
export const safeSetPointerCapture = (element, pointerId) => {
  if (!element || typeof pointerId !== 'number') {
    return false;
  }
  
  try {
    if (typeof element.setPointerCapture === 'function') {
      element.setPointerCapture(pointerId);
      return true;
    }
  } catch (err) {
    console.warn('Failed to set pointer capture:', err.message);
  }
  
  return false;
};

/**
 * Safely releases pointer capture from an element
 * @param {Element} element - The DOM element
 * @param {number} pointerId - The pointer ID
 * @returns {boolean} - Whether release was successful
 */
export const safeReleasePointerCapture = (element, pointerId) => {
  if (!element || typeof pointerId !== 'number') {
    return false;
  }
  
  try {
    // First check if the element has the capture
    if (typeof element.hasPointerCapture === 'function' && 
        element.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId);
      return true;
    } else if (typeof element.releasePointerCapture === 'function') {
      // Some browsers don't have hasPointerCapture, just try to release
      element.releasePointerCapture(pointerId);
      return true;
    }
  } catch (err) {
    // Silently ignore - this is expected if pointer was already released
    // or if the element was removed from DOM
  }
  
  return false;
};

/**
 * Creates a pointer drag handler with automatic cleanup
 * @param {Object} options - Configuration options
 * @returns {Function} - The pointerdown event handler
 */
export const createPointerDragHandler = ({
  onDragStart,
  onDragMove,
  onDragEnd,
  onClick,
  dragThreshold = 5
}) => {
  return (e) => {
    if (e.button !== 0) return; // Only handle left button
    
    const element = e.currentTarget;
    const pointerId = e.pointerId;
    const startX = e.clientX;
    const startY = e.clientY;
    let hasDragged = false;
    
    // Set pointer capture
    safeSetPointerCapture(element, pointerId);
    
    // Call drag start if provided
    if (onDragStart) {
      onDragStart(e);
    }
    
    const handlePointerMove = (moveEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);
      
      if (!hasDragged && (deltaX > dragThreshold || deltaY > dragThreshold)) {
        hasDragged = true;
      }
      
      if (hasDragged && onDragMove) {
        onDragMove(moveEvent, { startX, startY, hasDragged });
      }
    };
    
    const handlePointerUp = (upEvent) => {
      // Clean up first
      cleanup();
      
      // Then handle the event
      if (hasDragged && onDragEnd) {
        onDragEnd(upEvent, { startX, startY });
      } else if (!hasDragged && onClick) {
        onClick(e);
      }
    };
    
    const cleanup = () => {
      // Remove event listeners
      if (element) {
        element.removeEventListener('pointermove', handlePointerMove);
        element.removeEventListener('pointerup', handlePointerUp);
        element.removeEventListener('pointercancel', handlePointerUp);
        
        // Release pointer capture
        safeReleasePointerCapture(element, pointerId);
      }
      
      // Also try to remove from document in case element was removed
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
    
    // Add event listeners
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', handlePointerUp);
    element.addEventListener('pointercancel', handlePointerUp);
    
    // Also add to document as backup
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
  };
};