import { useState, useEffect } from 'react';

// Responsive breakpoints
export const breakpoints = {
  xs: 640,   // Small phones
  sm: 768,   // Large phones
  md: 1024,  // Tablets
  lg: 1280,  // Small laptops
  xl: 1536,  // Standard desktops
  xxl: 1920  // Large desktops
};

// Get current breakpoint
export const getCurrentBreakpoint = () => {
  const width = window.innerWidth;
  if (width < breakpoints.xs) return 'xs';
  if (width < breakpoints.sm) return 'sm';
  if (width < breakpoints.md) return 'md';
  if (width < breakpoints.lg) return 'lg';
  if (width < breakpoints.xl) return 'xl';
  return 'xxl';
};

// Responsive scaling factors
export const getScalingFactor = () => {
  const width = window.innerWidth;
  if (width < breakpoints.sm) return 0.85;
  if (width < breakpoints.md) return 0.9;
  if (width < breakpoints.lg) return 0.95;
  return 1;
};

// Get responsive dimensions
export const getResponsiveDimensions = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const scale = getScalingFactor();
  void scale;
  
  return {
    // Side panel width
    sidePanelWidth: width < breakpoints.md ? Math.min(width * 0.9, 320) : 
                    width < breakpoints.lg ? 340 : 384,
    
    // Modal dimensions
    modalMaxWidth: width < breakpoints.sm ? '95%' : 
                   width < breakpoints.md ? '90%' : 
                   width < breakpoints.lg ? '600px' : '700px',
    
    // Toolbar dimensions
    toolbarIconSize: width < breakpoints.md ? 32 : 40,
    toolbarPadding: width < breakpoints.md ? '8px' : '12px',
    
    // Font sizes
    baseFontSize: width < breakpoints.sm ? 13 : 
                  width < breakpoints.md ? 14 : 
                  width < breakpoints.lg ? 15 : 16,
    
    titleFontSize: width < breakpoints.sm ? 18 : 
                   width < breakpoints.md ? 20 : 
                   width < breakpoints.lg ? 22 : 24,
    
    // Spacing
    baseSpacing: width < breakpoints.md ? 16 : 
                 width < breakpoints.lg ? 20 : 24,
    
    compactSpacing: width < breakpoints.md ? 8 : 
                    width < breakpoints.lg ? 10 : 12,
    
    // Header height
    headerHeight: width < breakpoints.md ? 56 : 72,
    
    // Safe area margins
    safeAreaTop: 20,
    safeAreaBottom: 20,
    safeAreaLeft: width < breakpoints.md ? 10 : 20,
    safeAreaRight: width < breakpoints.md ? 10 : 20,
    
    // Canvas zoom limits
    minZoom: width < breakpoints.md ? 0.3 : 0.2,
    maxZoom: width < breakpoints.md ? 3 : 5,
    
    // Person/shape sizes
    personSize: width < breakpoints.md ? 50 : 60,
    
    // Quick add modal
    quickAddWidth: width < breakpoints.sm ? '95%' : 
                   width < breakpoints.md ? '90%' : '400px',
    
    // Context menu
    contextMenuWidth: width < breakpoints.md ? 180 : 200,
    
    // Floating toolbar position constraints
    toolbarMinX: width < breakpoints.md ? 100 : 200,
    toolbarMaxX: width - (width < breakpoints.md ? 100 : 200),
    toolbarMinY: (width < breakpoints.md ? 56 : 72) + 20,
    toolbarMaxY: height - 100,
    
    // Edit panel field sizes
    inputHeight: width < breakpoints.md ? 40 : 48,
    buttonHeight: width < breakpoints.md ? 40 : 44,
    
    // Animation durations
    transitionDuration: width < breakpoints.md ? '0.2s' : '0.3s',
    
    // Touch target sizes (minimum 44px for mobile)
    minTouchTarget: width < breakpoints.lg ? 44 : 36
  };
};

// Hook for responsive dimensions with debounced resize handling
export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(getResponsiveDimensions());
  const [breakpoint, setBreakpoint] = useState(getCurrentBreakpoint());
  const [isResizing, setIsResizing] = useState(false);
  
  useEffect(() => {
    let resizeTimer;
    
    const handleResize = () => {
      setIsResizing(true);
      clearTimeout(resizeTimer);
      
      resizeTimer = setTimeout(() => {
        setDimensions(getResponsiveDimensions());
        setBreakpoint(getCurrentBreakpoint());
        setIsResizing(false);
      }, 100); // Debounce resize events
    };
    
    window.addEventListener('resize', handleResize);
    
    // Also listen for orientation changes
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);
  
  return { dimensions, breakpoint, isResizing };
};

// Utility function to check if we're on a touch device
export const isTouchDevice = () => {
  return 'ontouchstart' in window || 
         navigator.maxTouchPoints > 0 || 
         navigator.msMaxTouchPoints > 0;
};

// Get responsive person shape size
export const getPersonShapeSize = (breakpoint) => {
  switch (breakpoint) {
    case 'xs':
    case 'sm':
      return 50;
    case 'md':
      return 55;
    default:
      return 60;
  }
};

// Get responsive relationship line width
export const getRelationshipLineWidth = (breakpoint, isSelected = false) => {
  const baseWidth = breakpoint === 'xs' || breakpoint === 'sm' ? 2 : 3;
  return isSelected ? baseWidth + 1 : baseWidth;
};

// Constrain position within viewport
export const constrainToViewport = (x, y, width, height, padding = 20) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  return {
    x: Math.min(Math.max(padding, x), viewportWidth - width - padding),
    y: Math.min(Math.max(padding, y), viewportHeight - height - padding)
  };
};

// Get optimal modal position
export const getModalPosition = (modalWidth, modalHeight, anchorElement = null) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  if (!anchorElement) {
    // Center the modal
    return {
      x: (viewportWidth - modalWidth) / 2,
      y: (viewportHeight - modalHeight) / 2
    };
  }
  
  const anchorRect = anchorElement.getBoundingClientRect();
  let x = anchorRect.left;
  let y = anchorRect.bottom + 10;
  
  // Adjust if modal would go off screen
  if (x + modalWidth > viewportWidth) {
    x = viewportWidth - modalWidth - 20;
  }
  if (y + modalHeight > viewportHeight) {
    y = anchorRect.top - modalHeight - 10;
  }
  
  return constrainToViewport(x, y, modalWidth, modalHeight);
};

// Format text for small screens
export const truncateText = (text, maxLength, breakpoint) => {
  const limits = {
    xs: 15,
    sm: 20,
    md: 30,
    lg: 40,
    xl: 50,
    xxl: 60
  };
  
  const limit = maxLength || limits[breakpoint] || 50;
  
  if (!text || text.length <= limit) return text;
  return text.substring(0, limit) + '...';
};

// Get responsive grid size
export const getGridSize = (breakpoint) => {
  switch (breakpoint) {
    case 'xs':
    case 'sm':
      return 25; // Larger grid for easier touch
    case 'md':
      return 20;
    default:
      return 20;
  }
};

// Check if we should show a UI element based on breakpoint
export const shouldShow = (element, breakpoint) => {
  const visibility = {
    stats: ['md', 'lg', 'xl', 'xxl'],
    fullLogo: ['lg', 'xl', 'xxl'],
    sidePanel: ['sm', 'md', 'lg', 'xl', 'xxl'],
    expandedToolbar: ['md', 'lg', 'xl', 'xxl'],
    tooltips: ['lg', 'xl', 'xxl'],
    shortcuts: ['md', 'lg', 'xl', 'xxl']
  };
  
  return visibility[element] ? visibility[element].includes(breakpoint) : true;
};

// Get responsive canvas controls
export const getCanvasControls = (breakpoint) => {
  const isTouch = isTouchDevice();
  
  return {
    panGesture: isTouch ? 'touch' : 'space+drag',
    zoomGesture: isTouch ? 'pinch' : 'ctrl+scroll',
    minZoom: breakpoint === 'xs' || breakpoint === 'sm' ? 0.3 : 0.2,
    maxZoom: breakpoint === 'xs' || breakpoint === 'sm' ? 3 : 5,
    zoomSpeed: isTouch ? 0.01 : 0.03
  };
};