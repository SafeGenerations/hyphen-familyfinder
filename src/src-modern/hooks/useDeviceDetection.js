// src/src-modern/hooks/useDeviceDetection.js
import { useState, useEffect } from 'react';

const useDeviceDetection = () => {
  const [deviceType, setDeviceType] = useState('desktop');
  const [isTablet, setIsTablet] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [isPrimaryTouch, setIsPrimaryTouch] = useState(false);
  const [isHybrid, setIsHybrid] = useState(false);

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const aspectRatio = screenWidth / screenHeight;
      
      // Check for touch capability
      const hasTouch = 'ontouchstart' in window || 
                      navigator.maxTouchPoints > 0 || 
                      navigator.msMaxTouchPoints > 0;
      
      setIsTouch(hasTouch);
      
      // Check if touch is the PRIMARY input (not just available)
      const hasMouse = window.matchMedia('(hover: hover)').matches;
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
      
      // Primary touch means touch is main input, not just available
      const primaryTouch = hasCoarsePointer && !hasFinePointer;
      setIsPrimaryTouch(primaryTouch);
      
      // Detect hybrid devices (touchscreen laptops)
      const isHybridDevice = hasTouch && hasMouse && hasFinePointer;
      setIsHybrid(isHybridDevice);
      
      // Mobile detection - more strict
      const isMobileUA = /mobile|android|iphone|ipod/.test(userAgent) && 
                        !/ipad/.test(userAgent);
      const isMobileSize = screenWidth < 768;
      const isMobileDevice = (isMobileUA || isMobileSize) && primaryTouch;
      
      // Tablet detection - must be primarily touch-driven
      const isIPad = /ipad/.test(userAgent) || 
                    (navigator.platform === 'MacIntel' && 
                     hasTouch && 
                     !hasMouse && 
                     screenWidth >= 768 && 
                     screenWidth <= 1366);
      
      const isAndroidTablet = /android/.test(userAgent) && 
                             !/mobile/.test(userAgent) && 
                             primaryTouch;
      
      const isWindowsTablet = /windows/.test(userAgent) && 
                             primaryTouch && 
                             screenWidth >= 768 && 
                             screenWidth <= 1366;
      
      // Size-based detection for tablets - but ONLY if primarily touch
      const isTabletSize = screenWidth >= 768 && 
                          screenWidth <= 1366 && 
                          aspectRatio >= 0.74 && 
                          aspectRatio <= 1.35 &&
                          primaryTouch && 
                          !hasMouse;
      
      // Final determination
      if (isMobileDevice) {
        setDeviceType('mobile');
        setIsTablet(false);
        setIsMobile(true);
      } else if ((isIPad || isAndroidTablet || isWindowsTablet || isTabletSize) && !isHybridDevice) {
        setDeviceType('tablet');
        setIsTablet(true);
        setIsMobile(false);
      } else {
        // Desktop (including touchscreen laptops)
        setDeviceType('desktop');
        setIsTablet(false);
        setIsMobile(false);
      }
    };

    detectDevice();
    
    // Re-detect on resize
    window.addEventListener('resize', detectDevice);
    
    // Re-detect on orientation change
    window.addEventListener('orientationchange', detectDevice);
    
    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('orientationchange', detectDevice);
    };
  }, []);

  return {
    deviceType,
    isTablet,
    isMobile,
    isTouch,
    isPrimaryTouch,
    isHybrid,
    isDesktop: !isTablet && !isMobile
  };
};

// Named export
export { useDeviceDetection };

// Default export for backwards compatibility
export default useDeviceDetection;