import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2, Minimize2 } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import { useResponsive, shouldShow } from '../../utils/responsive';
import NodeEditPanel from '../EditPanels/NodeEditPanel';
import RelationshipEditPanel from '../EditPanels/RelationshipEditPanel';
import HouseholdEditPanel from '../EditPanels/HouseholdEditPanel';
import TextBoxEditPanel from '../EditPanels/TextBoxEditPanel';

const ResponsiveSidePanel = () => {
  const { state, actions } = useGenogram();
  const { dimensions, breakpoint } = useResponsive();
  const panelRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [pointerStart, setPointerStart] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const pointerId = useRef(null);
  
  const {
    sidePanelOpen,
    selectedPerson,
    selectedRelationship,
    selectedHousehold,
    selectedTextBox
  } = state;

  // Don't show if nothing is selected
  const hasSelection = selectedPerson || selectedRelationship || selectedHousehold || selectedTextBox;
  if (!hasSelection) return null;

  // Auto full-screen on mobile
  const shouldBeFullScreen = isFullScreen || breakpoint === 'xs' || breakpoint === 'sm';
  const showToggleButton = shouldShow('sidePanel', breakpoint) && !shouldBeFullScreen;

  // Get title based on selection
  const getTitle = () => {
    if (selectedPerson) return selectedPerson.name;
    if (selectedRelationship) return 'Edit Relationship';
    if (selectedHousehold) return selectedHousehold.name || 'Edit Household';
    if (selectedTextBox) return 'Edit Text';
    return 'Details';
  };

  // Get icon based on selection
  const getIcon = () => {
    if (selectedPerson) return '👤';
    if (selectedRelationship) return '💞';
    if (selectedHousehold) return '🏠';
    if (selectedTextBox) return '📝';
    return '📋';
  };

  // Render appropriate edit panel
  const renderContent = () => {
  if (selectedPerson) return <NodeEditPanel />;
    if (selectedRelationship) return <RelationshipEditPanel />;
    if (selectedHousehold) return <HouseholdEditPanel />;
    if (selectedTextBox) return <TextBoxEditPanel />;
    return null;
  };

  // Handle pointer events for swipe gestures
  const handlePointerDown = (e) => {
    if (shouldBeFullScreen && e.button === 0) {
      pointerId.current = e.pointerId;
      setPointerStart(e.clientX);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (shouldBeFullScreen && pointerStart !== null && e.pointerId === pointerId.current) {
      const currentX = e.clientX;
      const diff = currentX - pointerStart;
      if (diff > 0) {
        setSwipeOffset(diff);
      }
    }
  };

  const handlePointerUp = (e) => {
    if (e.pointerId === pointerId.current && e.currentTarget) {
      try {
        if (typeof e.currentTarget.releasePointerCapture === 'function') {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch (err) {
        // Ignore if already released
      }
      
      if (swipeOffset > 100) {
        actions.toggleSidePanel();
      }
      setSwipeOffset(0);
      setPointerStart(null);
      pointerId.current = null;
    }
  };

  const handlePointerCancel = (e) => {
    if (e.pointerId === pointerId.current && e.currentTarget) {
      try {
        if (typeof e.currentTarget.releasePointerCapture === 'function') {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch (err) {
        // Ignore if already released
      }
      setSwipeOffset(0);
      setPointerStart(null);
      pointerId.current = null;
    }
  };

  // Panel styles
  const panelStyle = {
    position: 'fixed',
    right: shouldBeFullScreen ? 0 : (sidePanelOpen ? 0 : -dimensions.sidePanelWidth),
    top: 0,
    height: '100%',
    background: 'white',
    boxShadow: shouldBeFullScreen ? 'none' : '-4px 0 15px rgba(0,0,0,0.1)',
    zIndex: shouldBeFullScreen ? 45 : 35,
    transform: sidePanelOpen ? 
      `translateX(${swipeOffset}px)` : 
      `translateX(${shouldBeFullScreen ? '100%' : dimensions.sidePanelWidth + 'px'})`,
    transition: swipeOffset > 0 ? 'none' : `transform ${dimensions.transitionDuration} ease-out`,
    width: shouldBeFullScreen ? '100%' : `${dimensions.sidePanelWidth}px`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    touchAction: 'none' // Prevent browser touch behaviors
  };

  const headerStyle = {
    padding: dimensions.baseSpacing,
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: dimensions.minTouchTarget + 16,
    backgroundColor: 'white',
    position: 'sticky',
    top: 0,
    zIndex: 1
  };

  const titleStyle = {
    fontSize: `${dimensions.baseFontSize + 2}px`,
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    maxWidth: '70%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  };

  const contentStyle = {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: dimensions.baseSpacing,
    fontSize: `${dimensions.baseFontSize}px`,
    WebkitOverflowScrolling: 'touch',
    paddingBottom: dimensions.safeAreaBottom + dimensions.baseSpacing,
    touchAction: 'pan-y' // Allow vertical scrolling only
  };

  const buttonStyle = {
    padding: dimensions.compactSpacing,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: dimensions.minTouchTarget,
    minHeight: dimensions.minTouchTarget,
    transition: 'all 0.2s',
    touchAction: 'manipulation' // Prevent double-tap zoom
  };

  // Toggle button for desktop
  const toggleButtonStyle = {
    position: 'fixed',
    right: sidePanelOpen ? dimensions.sidePanelWidth : 0,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 40,
    background: 'white',
    borderRadius: '8px 0 0 8px',
    boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
    padding: dimensions.compactSpacing,
    border: '1px solid #e2e8f0',
    borderRight: 'none',
    cursor: 'pointer',
    transition: `all ${dimensions.transitionDuration} ease-out`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <>
      {/* Desktop toggle button */}
      {showToggleButton && (
        <button
          onClick={actions.toggleSidePanel}
          style={toggleButtonStyle}
          aria-label={sidePanelOpen ? 'Close panel' : 'Open panel'}
        >
          {sidePanelOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      )}
      
      {/* Full screen overlay for mobile */}
      {shouldBeFullScreen && sidePanelOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 44,
            transition: `opacity ${dimensions.transitionDuration} ease-out`,
            touchAction: 'none'
          }}
          onClick={() => actions.toggleSidePanel()}
        />
      )}
      
      {/* Main panel */}
      <div 
        ref={panelRef}
        style={panelStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {/* Swipe indicator for mobile */}
        {shouldBeFullScreen && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.3
          }}>
            <ChevronRight size={16} />
          </div>
        )}
        
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={titleStyle}>
            <span>{getIcon()}</span>
            <span>{getTitle()}</span>
          </h2>
          
          <div style={{ display: 'flex', gap: dimensions.compactSpacing / 2 }}>
            {/* Full screen toggle for tablets */}
            {breakpoint === 'md' && !shouldBeFullScreen && (
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                style={buttonStyle}
                aria-label="Toggle fullscreen"
                onPointerEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onPointerLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
            )}
            
            {/* Close button */}
            <button
              onClick={() => {
                if (shouldBeFullScreen) {
                  actions.toggleSidePanel();
                } else {
                  actions.clearSelection();
                }
              }}
              style={buttonStyle}
              aria-label="Close"
              onPointerEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onPointerLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div style={contentStyle} className="panel-content">
          {renderContent()}
        </div>
        
        {/* Action bar for mobile */}
        {shouldBeFullScreen && (
          <div style={{
            padding: dimensions.baseSpacing,
            borderTop: '1px solid #f1f5f9',
            background: 'white',
            display: 'flex',
            gap: dimensions.compactSpacing,
            justifyContent: 'stretch'
          }}>
            <button
              onClick={() => actions.toggleSidePanel()}
              style={{
                flex: 1,
                padding: dimensions.baseSpacing * 0.75,
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: `${dimensions.baseFontSize}px`,
                fontWeight: '500',
                cursor: 'pointer',
                touchAction: 'manipulation'
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .panel-content::-webkit-scrollbar {
          width: 6px;
        }
        
        .panel-content::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        
        .panel-content::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        .panel-content::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        @media (max-width: 768px) {
          .panel-content::-webkit-scrollbar {
            width: 0;
          }
        }
      `}</style>
    </>
  );
};

export default ResponsiveSidePanel;