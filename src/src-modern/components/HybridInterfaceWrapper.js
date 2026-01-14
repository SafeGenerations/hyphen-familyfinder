// src/src-modern/components/HybridInterfaceWrapper.js
import React, { useState, useEffect } from 'react';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { Settings, Monitor, Tablet, Smartphone } from 'lucide-react';

/**
 * This wrapper allows users on hybrid devices (touchscreen laptops)
 * to choose their preferred interface
 */
const HybridInterfaceWrapper = ({ children }) => {
  const { isHybrid, isTouch, deviceType } = useDeviceDetection();
  const [interfaceMode, setInterfaceMode] = useState(null);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    // Check if user has a saved preference
    const savedMode = localStorage.getItem('preferred_interface_mode');
    if (savedMode) {
      setInterfaceMode(savedMode);
    } else if (isHybrid) {
      // Show selector for hybrid devices
      setShowSelector(true);
    }
  }, [isHybrid]);

  const selectMode = (mode) => {
    setInterfaceMode(mode);
    localStorage.setItem('preferred_interface_mode', mode);
    setShowSelector(false);
  };

  const clearPreference = () => {
    localStorage.removeItem('preferred_interface_mode');
    setInterfaceMode(null);
    setShowSelector(true);
  };

  // Interface selector modal
  if (showSelector && isHybrid) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '40px',
          maxWidth: '600px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            margin: '0 0 16px 0',
            fontSize: '28px',
            fontWeight: '700',
            color: '#1e293b'
          }}>
            Choose Your Interface
          </h2>
          
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            marginBottom: '32px',
            lineHeight: 1.6
          }}>
            We detected you're using a device with both touch and mouse input. 
            Which interface would you prefer?
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '24px'
          }}>
            <button
              onClick={() => selectMode('desktop')}
              style={{
                padding: '24px',
                borderRadius: '16px',
                border: '2px solid #e2e8f0',
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(99, 102, 241, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Monitor size={48} color="#6366f1" style={{ marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#1e293b' }}>
                Desktop Mode
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                Traditional interface with mouse and keyboard
              </p>
            </button>

            <button
              onClick={() => selectMode('tablet')}
              style={{
                padding: '24px',
                borderRadius: '16px',
                border: '2px solid #e2e8f0',
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#8b5cf6';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(139, 92, 246, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Tablet size={48} color="#8b5cf6" style={{ marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#1e293b' }}>
                Touch Mode
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                Touch-optimized with larger targets
              </p>
            </button>
          </div>

          <p style={{
            fontSize: '13px',
            color: '#94a3b8'
          }}>
            You can change this later in settings
          </p>
        </div>
      </div>
    );
  }

  // Interface mode indicator (for hybrid devices)
  const InterfaceModeIndicator = () => {
    if (!isHybrid || !interfaceMode) return null;

    return (
      <button
        onClick={clearPreference}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '8px 16px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: '500',
          color: '#64748b',
          cursor: 'pointer',
          transition: 'all 0.2s',
          zIndex: 100
        }}
        title="Click to change interface mode"
      >
        {interfaceMode === 'tablet' ? <Tablet size={16} /> : <Monitor size={16} />}
        {interfaceMode === 'tablet' ? 'Touch' : 'Desktop'} Mode
        <Settings size={14} />
      </button>
    );
  };

  // For hybrid devices, use the selected mode
  const effectiveMode = isHybrid && interfaceMode ? interfaceMode : deviceType;

  // Clone children and pass the effective mode
  return (
    <>
      {React.cloneElement(children, { 
        deviceType: effectiveMode,
        isTablet: effectiveMode === 'tablet',
        isMobile: effectiveMode === 'mobile',
        isDesktop: effectiveMode === 'desktop',
        isHybrid
      })}
      <InterfaceModeIndicator />
    </>
  );
};

export default HybridInterfaceWrapper;