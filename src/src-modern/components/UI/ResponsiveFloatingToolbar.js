// ===== ResponsiveFloatingToolbar.js - COMPLETE FILE =====
// src/src-modern/components/UI/ResponsiveFloatingToolbar.js
import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, FilePlus, Menu, X } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import { useFileOperations } from '../../hooks/useFileOperations';
import { useCanvasOperations } from '../../hooks/useCanvasOperations';
import { useResponsive, constrainToViewport, shouldShow } from '../../utils/responsive';
import { trackFeatureUse, trackEvent } from '../../../utils/analytics';
import { isEmbedded } from '../../../utils/embedIntegration';
import {
  AddPersonIcon,
  TextToolIcon,
  CreateHouseholdIcon,
  AutoArrangeIcon,
  LayoutGridIcon,
  HighlightNetworkIcon,
  FitToScreenIcon,
  UndoIcon,
  RedoIcon,
  ExportImageIcon,
  SaveIcon,
  OpenIcon
} from './FloatingMenuIcons';

const PdfIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <rect x="7" y="12" width="10" height="6" rx="1.5"/>
    <path d="M9 15h2"/>
    <path d="M13 15h2.5"/>
  </svg>
);

const ResponsiveFloatingToolbar = () => {
  const { state, actions } = useGenogram();
  const { handleSave, handleLoad, handleExportSVG, handleExportPDF } = useFileOperations();
  const { autoArrange, fitToCanvas } = useCanvasOperations();
  const { dimensions, breakpoint, isResizing } = useResponsive();
  const { snapToGrid, highlightNetwork, isDrawingHousehold, history, historyIndex } = state;
  
  // Check if embedded
  const embedMode = isEmbedded();

  // Position state with responsive constraints
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('genogram_toolbar_position');
    if (saved) {
      const pos = JSON.parse(saved);
      return constrainToViewport(
        pos.x, 
        pos.y, 
        300, // estimated width
        80,  // estimated height
        dimensions.safeAreaLeft
      );
    }
    return { 
      x: window.innerWidth / 2 - 150, 
      y: dimensions.headerHeight + 20 
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [expanded, setExpanded] = useState(shouldShow('expandedToolbar', breakpoint));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toolbarRef = useRef(null);
  const pointerId = useRef(null);

  // Update expanded state based on breakpoint
  useEffect(() => {
    setExpanded(shouldShow('expandedToolbar', breakpoint));
  }, [breakpoint]);

  // Constrain position on resize
  useEffect(() => {
    if (!isResizing) {
      const newPos = constrainToViewport(
        position.x,
        position.y,
        toolbarRef.current?.offsetWidth || 300,
        toolbarRef.current?.offsetHeight || 80,
        dimensions.safeAreaLeft
      );
      if (newPos.x !== position.x || newPos.y !== position.y) {
        setPosition(newPos);
      }
    }
  }, [isResizing, dimensions]);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem('genogram_toolbar_position', JSON.stringify(position));
  }, [position]);

  // Pointer event handlers
  const handlePointerDown = (e) => {
    if (!e.target.closest('button') && !e.target.closest('.no-drag')) {
      if (e.button !== 0) return; // Only left button
      
      pointerId.current = e.pointerId;
      e.currentTarget.setPointerCapture(e.pointerId);
      
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      e.preventDefault();
    }
  };

  const handlePointerMove = (e) => {
    if (isDragging && e.pointerId === pointerId.current && toolbarRef.current) {
      const newPos = constrainToViewport(
        e.clientX - dragStart.x,
        e.clientY - dragStart.y,
        toolbarRef.current.offsetWidth,
        toolbarRef.current.offsetHeight,
        dimensions.safeAreaLeft
      );
      setPosition(newPos);
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
      setIsDragging(false);
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
      setIsDragging(false);
      pointerId.current = null;
    }
  };

  // Tool configurations
  const mainTools = [
    {
      icon: AddPersonIcon,
      title: 'Add Person',
      shortLabel: 'Add',
      onClick: () => { 
        actions.setQuickAddOpen(true); 
        trackFeatureUse('add_person_modal'); 
        setMobileMenuOpen(false);
      },
      color: '#8b5cf6', 
      hoverColor: '#7c3aed', 
      bgColor: '#ede9fe'
    },
    {
      icon: TextToolIcon,
      title: 'Add Text',
      shortLabel: 'Text',
      onClick: () => { 
        actions.addTextBox({ 
          id: Date.now().toString(), 
          x: window.innerWidth / 2 - 75, 
          y: window.innerHeight / 2 - 25, 
          width: 150, 
          height: 50, 
          html: 'New Text' 
        }); 
        trackFeatureUse('add_text');
        setMobileMenuOpen(false);
      },
      color: '#3b82f6', 
      hoverColor: '#2563eb', 
      bgColor: '#dbeafe'
    },
    {
      icon: CreateHouseholdIcon,
      title: 'Draw Household',
      shortLabel: 'House',
      onClick: () => {
        if (isDrawingHousehold) { 
          actions.cancelDrawingHousehold(); 
          trackEvent('cancel_household','genogram_interaction'); 
        } else { 
          actions.startDrawingHousehold(); 
          trackFeatureUse('draw_household'); 
        }
        setMobileMenuOpen(false);
      },
      active: isDrawingHousehold,
      color: '#10b981', 
      hoverColor: '#059669', 
      bgColor: '#d1fae5'
    },
    {
      icon: HighlightNetworkIcon,
      title: 'Highlight Network',
      shortLabel: 'Network',
      onClick: () => { 
        actions.toggleHighlightNetwork(); 
        trackEvent('toggle_highlight','settings', highlightNetwork?'off':'on');
        setMobileMenuOpen(false);
      },
      active: highlightNetwork,
      color: '#ec4899', 
      hoverColor: '#db2777', 
      bgColor: '#fce7f3'
    }
  ];

  const formattingTools = [
    {
      icon: UndoIcon,
      title: 'Undo',
      shortLabel: 'Undo',
      onClick: actions.undo,
      disabled: historyIndex <= 0,
      color: '#6b7280', 
      hoverColor: '#374151', 
      bgColor: '#f3f4f6'
    },
    {
      icon: RedoIcon,
      title: 'Redo',
      shortLabel: 'Redo',
      onClick: actions.redo,
      disabled: historyIndex >= history.length - 1,
      color: '#6b7280', 
      hoverColor: '#374151', 
      bgColor: '#f3f4f6'
    },
    {
      icon: AutoArrangeIcon,
      title: 'Auto Arrange',
      shortLabel: 'Arrange',
      onClick: () => { 
        autoArrange(); 
        trackFeatureUse('auto_arrange');
        setMobileMenuOpen(false);
      },
      color: '#f59e0b', 
      hoverColor: '#d97706', 
      bgColor: '#fef3c7'
    },

    {
      icon: LayoutGridIcon,
      title: 'Toggle Grid',
      shortLabel: 'Grid',
      onClick: () => { 
        actions.toggleSnapToGrid(); 
        trackEvent('toggle_grid','settings', snapToGrid?'off':'on');
        setMobileMenuOpen(false);
      },
      active: snapToGrid,
      color: '#6366f1', 
      hoverColor: '#4f46e5', 
      bgColor: '#e0e7ff'
    }
  ];

  const fileTools = [
    {
      icon: ExportImageIcon,
      title: embedMode ? 'Export to Parent' : 'Download',
      shortLabel: embedMode ? 'Export' : 'Image',
      onClick: () => {
        handleExportSVG();
        trackFeatureUse('export_svg');
        setMobileMenuOpen(false);
      },
      color: '#8b5cf6', 
      hoverColor: '#7c3aed', 
      bgColor: '#ede9fe'
    },
    {
      icon: PdfIcon,
      title: 'Download PDF Report',
      shortLabel: 'PDF',
      onClick: () => {
        handleExportPDF();
        trackFeatureUse('export_pdf');
        setMobileMenuOpen(false);
      },
      color: '#2563eb',
      hoverColor: '#1d4ed8',
      bgColor: '#dbeafe'
    },
    {
      icon: SaveIcon,
      title: embedMode ? 'Save to Note' : 'Save',
      shortLabel: 'Save',
      onClick: () => {
        handleSave();
        setMobileMenuOpen(false);
      },
      color: '#10b981', 
      hoverColor: '#059669', 
      bgColor: '#d1fae5'
    }
  ];
  
  // Show load/new buttons in all modes (including embedded)
  fileTools.push(
    {
      icon: OpenIcon,
      title: 'Load',
      shortLabel: 'Open',
      onClick: () => {
        handleLoad();
        setMobileMenuOpen(false);
      },
      color: '#f59e0b', 
      hoverColor: '#d97706', 
      bgColor: '#fef3c7'
    },
    {
      icon: FilePlus,
      title: 'New',
      shortLabel: 'New',
      onClick: async () => {
        if (state.isDirty) {
          const shouldSave = window.confirm('Save changes before clearing the genogram?');
          if (shouldSave) {
            const saved = await handleSave();
            if (!saved) return;
          }
        }
        actions.newGenogram();
        setMobileMenuOpen(false);
      },
      color: '#ef4444', 
      hoverColor: '#dc2626', 
      bgColor: '#fee2e2'
    }
  );

  // Responsive styles
  const containerStyle = {
    position: 'fixed',
    top: position.y,
    left: position.x,
    cursor: isDragging ? 'grabbing' : 'default',
    zIndex: 30,
    transition: isResizing ? 'none' : 'box-shadow 0.2s',
    touchAction: 'none' // Prevent browser touch behaviors
  };

  const toolbarStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: dimensions.compactSpacing / 2,
    background: 'rgba(255,255,255,0.98)',
    backdropFilter: 'blur(12px)',
    borderRadius: dimensions.toolbarIconSize < 40 ? '20px' : '28px',
    boxShadow: isDragging ? '0 8px 32px rgba(0,0,0,0.15)' : '0 4px 24px rgba(0,0,0,0.08)',
    border: '1px solid rgba(0,0,0,0.04)',
    padding: dimensions.compactSpacing / 2,
    transition: isDragging ? 'none' : 'box-shadow 0.2s ease'
  };

  const buttonStyle = {
    padding: dimensions.toolbarPadding,
    borderRadius: dimensions.toolbarIconSize < 40 ? '16px' : '22px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    minWidth: dimensions.minTouchTarget,
    minHeight: dimensions.minTouchTarget,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
    position: 'relative',
    touchAction: 'manipulation' // Prevent double-tap zoom
  };

  const iconLabelStyle = {
    fontSize: dimensions.toolbarIconSize < 40 ? '9px' : '10px',
    marginTop: '2px',
    display: breakpoint === 'xs' ? 'none' : 'block',
    fontWeight: 500
  };

  // Render tool button
  const renderTool = (tool, index) => (
    <button
      key={index}
      onClick={tool.onClick}
      disabled={tool.disabled}
      style={{
        ...buttonStyle,
        background: tool.active ? tool.bgColor : 'transparent',
        color: tool.active ? tool.color : (tool.disabled ? '#d1d5db' : tool.color),
        opacity: tool.disabled ? 0.5 : 1,
        cursor: tool.disabled ? 'not-allowed' : 'pointer'
      }}
      title={tool.title}
      onPointerEnter={e => !tool.active && !tool.disabled && (
        e.currentTarget.style.background = tool.bgColor,
        e.currentTarget.style.color = tool.hoverColor,
        e.currentTarget.style.transform = 'scale(1.05)'
      )}
      onPointerLeave={e => !tool.active && !tool.disabled && (
        e.currentTarget.style.background = 'transparent',
        e.currentTarget.style.color = tool.color,
        e.currentTarget.style.transform = 'scale(1)'
      )}
    >
      <tool.icon size={dimensions.toolbarIconSize} />
      <span style={iconLabelStyle}>{tool.shortLabel}</span>
    </button>
  );

  // Mobile menu overlay
  const renderMobileMenu = () => (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 40,
      display: 'flex',
      alignItems: 'flex-end',
      animation: 'fadeIn 0.2s ease-out',
      touchAction: 'none'
    }} onClick={() => setMobileMenuOpen(false)}>
      <div style={{
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '16px 16px 0 0',
        padding: dimensions.baseSpacing,
        maxHeight: '80vh',
        overflowY: 'auto',
        animation: 'slideUp 0.3s ease-out',
        touchAction: 'pan-y'
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          width: '40px',
          height: '4px',
          backgroundColor: '#cbd5e1',
          borderRadius: '2px',
          margin: '0 auto 16px'
        }} />
        
        <h3 style={{
          fontSize: `${dimensions.baseFontSize + 2}px`,
          fontWeight: '600',
          marginBottom: dimensions.baseSpacing,
          color: '#1e293b'
        }}>Tools</h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: dimensions.compactSpacing 
        }}>
          {[...mainTools, ...formattingTools, ...fileTools].map((tool, index) => (
            <button
              key={index}
              onClick={tool.onClick}
              disabled={tool.disabled}
              style={{
                padding: dimensions.baseSpacing,
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                background: tool.active ? tool.bgColor : '#f9fafb',
                color: tool.active ? tool.color : (tool.disabled ? '#d1d5db' : '#374151'),
                border: 'none',
                opacity: tool.disabled ? 0.5 : 1,
                cursor: tool.disabled ? 'not-allowed' : 'pointer',
                touchAction: 'manipulation'
              }}
            >
              <tool.icon size={32} />
              <span style={{ fontSize: '12px', fontWeight: '500' }}>{tool.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Mobile compact toolbar
  if (breakpoint === 'xs' || breakpoint === 'sm') {
    return (
      <>
        <div 
          ref={toolbarRef} 
          style={{
            position: 'fixed',
            bottom: dimensions.safeAreaBottom,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            touchAction: 'none'
          }}
        >
          <div style={toolbarStyle}>
            {mainTools.slice(0, 3).map(renderTool)}
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{
                ...buttonStyle,
                background: 'transparent',
                color: '#6b7280'
              }}
            >
              <Menu size={dimensions.toolbarIconSize} />
              <span style={iconLabelStyle}>More</span>
            </button>
          </div>
        </div>
        {mobileMenuOpen && renderMobileMenu()}
      </>
    );
  }

  // Desktop/tablet toolbar
  return (
    <div 
      ref={toolbarRef} 
      style={containerStyle} 
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onDoubleClick={() => setPosition({ 
        x: window.innerWidth / 2 - 150, 
        y: dimensions.headerHeight + 20 
      })}
    >
      <div style={toolbarStyle}>
        {/* Drag handle */}
        <div style={{
          padding: `${dimensions.toolbarPadding} ${dimensions.toolbarPadding * 0.67}px`,
          cursor: 'grab',
          borderRadius: dimensions.toolbarIconSize < 40 ? '16px' : '22px',
          display: 'flex',
          alignItems: 'center',
          transition: 'background 0.2s',
          touchAction: 'none'
        }}
        onPointerEnter={e => !isDragging && (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
        onPointerLeave={e => !isDragging && (e.currentTarget.style.background = 'transparent')}
        >
          <svg width="10" height="16" fill="currentColor" viewBox="0 0 10 16" style={{ opacity: 0.3 }}>
            <path d="M2 2a1 1 0 112 0 1 1 0 01-2 0zM2 6a1 1 0 112 0 1 1 0 01-2 0zM2 10a1 1 0 112 0 1 1 0 01-2 0zM2 14a1 1 0 112 0 1 1 0 01-2 0zM6 2a1 1 0 112 0 1 1 0 01-2 0zM6 6a1 1 0 112 0 1 1 0 01-2 0zM6 10a1 1 0 112 0 1 1 0 01-2 0zM6 14a1 1 0 112 0 1 1 0 01-2 0z"/>
          </svg>
        </div>
        
        {mainTools.map(renderTool)}
        
        {/* Expand button for extended tools */}
        {breakpoint !== 'md' && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              ...buttonStyle,
              background: 'transparent',
              color: '#6b7280'
            }}
            className="no-drag"
          >
            <ChevronRight size={dimensions.toolbarIconSize} style={{
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s'
            }} />
          </button>
        )}
      </div>

      {/* Extended tools */}
      {expanded && breakpoint !== 'md' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '100%',
          transform: 'translateY(-50%)',
          marginLeft: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: dimensions.compactSpacing / 2,
          ...toolbarStyle
        }}>
          {formattingTools.map(renderTool)}
          <div style={{ 
            width: '1px', 
            height: dimensions.toolbarIconSize, 
            background: 'linear-gradient(to bottom,transparent,#e5e7eb,transparent)', 
            margin: `0 ${dimensions.compactSpacing / 2}px` 
          }} />
          {fileTools.map(renderTool)}
        </div>
      )}
    </div>
  );
};

export default ResponsiveFloatingToolbar;