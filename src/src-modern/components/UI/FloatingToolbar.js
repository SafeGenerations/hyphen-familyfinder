import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import { useFileOperations } from '../../hooks/useFileOperations';
import { useCanvasOperations } from '../../hooks/useCanvasOperations';
import { useResponsive } from '../../utils/responsive';
import { trackFeatureUse, trackEvent } from '../../../utils/analytics';
import { ConnectionStatus, CareStatus, FosterCareStatus } from '../../constants/connectionStatus';
import FilterPanel from './FilterPanel';
import TagManager from './TagManager';
import {
  AddPersonIcon,
  TextToolIcon,
  CreateHouseholdIcon,
  HighlightNetworkIcon,
  LayoutGridIcon,
  FitToScreenIcon,
  UndoIcon,
  RedoIcon,
  ExportImageIcon,
  SaveIcon,
  SearchIcon
} from './FloatingMenuIcons';
import { isEmbedded } from '../../../utils/embedIntegration';
import UnsavedChangesModal from './UnsavedChangesModal';

// Add open/load icon
const OpenIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
);

// New genogram icon
const NewIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="12" y1="18" x2="12" y2="12"/>
    <line x1="9" y1="15" x2="15" y2="15"/>
  </svg>
);

const PdfIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <rect x="7" y="12" width="10" height="6" rx="1.5"/>
    <path d="M9 15h2"/>
    <path d="M13 15h2.5"/>
  </svg>
);

const FloatingToolbar = () => {
  const { state, actions } = useGenogram();
  const { handleSave, handleLoad, handleExportSVG, handleExportPDF } = useFileOperations();
  const { fitToCanvas } = useCanvasOperations();
  const { breakpoint } = useResponsive();
  const { snapToGrid, isDrawingHousehold, highlightNetwork, showConnectionBadges, showPlacementBadges, showRelationshipBubbles, history, historyIndex, relationships, placements, people } = state;
  
  // Check if embedded
  const embedMode = isEmbedded();

  // CHILD-CENTRIC COUNT: Count children needing placement + available foster caregivers
  const discoveryCount = useMemo(() => {
    const childrenCount = people.filter(person => 
      person.careStatus === CareStatus.IN_CARE || 
      person.careStatus === CareStatus.NEEDS_PLACEMENT
    ).length;
    
    const caregiversCount = people.filter(person =>
      person.fosterCareStatus === FosterCareStatus.INTERESTED ||
      person.fosterCareStatus === FosterCareStatus.IN_PROCESS ||
      person.fosterCareStatus === FosterCareStatus.LICENSED ||
      person.fosterCareStatus === FosterCareStatus.ACTIVE
    ).length;
    
    return childrenCount + caregiversCount;
  }, [people]);

  // Grid snapping utility
  const GRID_SIZE = 20;
  const snapToGridFunc = (value) => {
    if (!snapToGrid) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  // Responsive calculations
  const isMobile = breakpoint === 'xs' || breakpoint === 'sm';
  const isTablet = breakpoint === 'md';
  const isNarrow = isMobile || isTablet;
  const iconSize = isMobile ? 20 : 24;
  const showLabels = !isMobile;

  // Position state with responsive defaults
  const getDefaultPosition = () => {
    if (isMobile) {
      return { x: window.innerWidth / 2, y: window.innerHeight - 100 };
    } else if (isTablet) {
      return { x: window.innerWidth / 2, y: 120 };
    } else {
      return { x: window.innerWidth / 3.5, y: 89 };
    }
  };

  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('genogram_toolbar_position');
    if (saved) {
      const savedPos = JSON.parse(saved);
      // Ensure position is still valid for current screen size
      if (savedPos.x > 0 && savedPos.x < window.innerWidth && 
          savedPos.y > 0 && savedPos.y < window.innerHeight) {
        return savedPos;
      }
    }
    return getDefaultPosition();
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [expanded, setExpanded] = useState(!isMobile); // Auto-collapse on mobile
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);

  // Update expansion state when breakpoint changes
  useEffect(() => {
    if (isMobile && expanded) {
      setExpanded(false);
    }
  }, [isMobile, expanded]);

  // Responsive position adjustment
  useEffect(() => {
    const handleResize = () => {
      setPosition(prevPos => ({
        x: Math.min(prevPos.x, window.innerWidth - 50),
        y: Math.min(prevPos.y, window.innerHeight - 50)
      }));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persist position
  useEffect(() => {
    localStorage.setItem('genogram_toolbar_position', JSON.stringify(position));
  }, [position]);

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    if (!e.target.closest('button') && !e.target.closest('.export-menu')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      e.preventDefault();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({ 
          x: Math.max(0, Math.min(window.innerWidth - 50, e.clientX - dragStart.x)),
          y: Math.max(0, Math.min(window.innerHeight - 50, e.clientY - dragStart.y))
        });
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, dragStart]);

  // Touch drag handlers
  const handleTouchStart = (e) => {
    if (!e.target.closest('button') && !e.target.closest('.export-menu')) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
      e.preventDefault();
    }
  };

  useEffect(() => {
    const handleTouchMove = (e) => {
      if (isDragging) {
        const touch = e.touches[0];
        setPosition({ 
          x: Math.max(0, Math.min(window.innerWidth - 50, touch.clientX - dragStart.x)),
          y: Math.max(0, Math.min(window.innerHeight - 50, touch.clientY - dragStart.y))
        });
      }
    };
    const handleTouchEnd = () => setIsDragging(false);
    
    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragStart]);

  // Reset position
  const handleDoubleClick = () => {
    setPosition(getDefaultPosition());
  };

  // Check if autosave exists and has content
  const checkAutosaveExists = () => {
    try {
      const saved = localStorage.getItem('genogram_autosave');
      if (saved) {
        const data = JSON.parse(saved);
        // Check if autosave has any actual content
        return (data.people && data.people.length > 0) ||
               (data.relationships && data.relationships.length > 0) ||
               (data.textBoxes && data.textBoxes.length > 0) ||
               (data.households && data.households.length > 0);
      }
      return false;
    } catch (error) {
      console.error('Error checking autosave:', error);
      return false;
    }
  };

  // Handle new genogram with proper unsaved changes workflow
  const handleNewGenogram = async () => {
    const hasUnsavedChanges = state.isDirty;
    const hasAutosave = checkAutosaveExists();

    // If there are unsaved changes OR autosave exists, show modal
    if (hasUnsavedChanges || hasAutosave) {
      setShowUnsavedModal(true);
    } else {
      // No unsaved changes, create new directly
      createNewGenogram();
    }
  };

  // Create new genogram and clear autosave
  const createNewGenogram = () => {
    actions.newGenogram();
    localStorage.removeItem('genogram_autosave');
    trackFeatureUse('new_genogram');
  };

  // Handle save before creating new
  const handleSaveAndNew = async () => {
    const saved = await handleSave();
    if (saved) {
      setShowUnsavedModal(false);
      createNewGenogram();
    }
  };

  // Handle discard and create new
  const handleDiscardAndNew = () => {
    setShowUnsavedModal(false);
    createNewGenogram();
  };

  // Handle cancel modal
  const handleCancelNew = () => {
    setShowUnsavedModal(false);
  };

  // Main tools - most important ones shown always
  const mainTools = [
    {
      icon: AddPersonIcon,
      title: 'Add Person',
      shortTitle: 'Person',
      onClick: () => { actions.setQuickAddOpen(true); trackFeatureUse('add_person_modal'); },
      color: '#8b5cf6', hoverColor: '#7c3aed', bgColor: '#ede9fe'
    },
    {
      icon: TextToolIcon,
      title: 'Add Text',
      shortTitle: 'Text',
      onClick: () => {
        // Calculate visible canvas area (accounting for pan and zoom)
        const viewportCenterX = window.innerWidth / 2;
        const viewportCenterY = window.innerHeight / 2;

        // Convert viewport center to canvas coordinates
        const canvasCenterX = (viewportCenterX - state.pan.x) / state.zoom;
        const canvasCenterY = (viewportCenterY - state.pan.y) / state.zoom;

        // Position text box in center of visible viewport (canvas coordinates)
        // Offset by half the text box dimensions to truly center it
        const textBoxWidth = 150;
        const textBoxHeight = 50;
        const textBoxX = canvasCenterX - (textBoxWidth / 2);
        const textBoxY = canvasCenterY - (textBoxHeight / 2);

        const newTextBox = {
          id: Date.now().toString(),
          x: snapToGridFunc(textBoxX),
          y: snapToGridFunc(textBoxY),
          width: textBoxWidth,
          height: textBoxHeight,
          html: 'New Text'
        };

        actions.addTextBox(newTextBox);

        // Select the new text box immediately so user knows where it is
        actions.selectTextBox(newTextBox);

        trackFeatureUse('add_text');
      },
      color: '#3b82f6', hoverColor: '#2563eb', bgColor: '#dbeafe'
    },
    {
      icon: CreateHouseholdIcon,
      title: 'Draw Household',
      shortTitle: 'House',
      onClick: () => {
        if (isDrawingHousehold) { actions.cancelDrawingHousehold(); trackEvent('cancel_household','genogram_interaction'); }
        else { actions.startDrawingHousehold(); trackFeatureUse('draw_household'); }
      },
      active: isDrawingHousehold,
      color: '#10b981', hoverColor: '#059669', bgColor: '#d1fae5'
    },
    {
      icon: HighlightNetworkIcon,
      title: 'Highlight Network',
      shortTitle: 'Network',
      onClick: () => { 
        actions.toggleHighlightNetwork(); 
        trackEvent('toggle_highlight', 'settings', highlightNetwork ? 'off' : 'on');
      },
      active: highlightNetwork,
      color: '#ec4899', hoverColor: '#db2777', bgColor: '#fce7f3'
    }
  ];

  // Secondary tools - shown when expanded
  const secondaryTools = [
    {
      icon: UndoIcon,
      title: 'Undo',
      shortTitle: 'Undo',
      onClick: actions.undo,
      disabled: historyIndex <= 0,
      color: '#6b7280', hoverColor: '#374151', bgColor: '#f3f4f6'
    },
    {
      icon: RedoIcon,
      title: 'Redo',
      shortTitle: 'Redo',
      onClick: actions.redo,
      disabled: historyIndex >= history.length - 1,
      color: '#6b7280', hoverColor: '#374151', bgColor: '#f3f4f6'
    },
    {
      icon: FitToScreenIcon,
      title: 'Fit to Screen',
      shortTitle: 'Fit',
      onClick: () => { fitToCanvas(); trackFeatureUse('fit_to_screen'); },
      color: '#14b8a6', hoverColor: '#0d9488', bgColor: '#ccfbf1'
    },
    {
      icon: LayoutGridIcon,
      title: 'Grid',
      shortTitle: 'Grid',
      onClick: () => { actions.toggleSnapToGrid(); trackEvent('toggle_grid','settings', snapToGrid?'off':'on'); },
      active: snapToGrid,
      color: '#6366f1', hoverColor: '#4f46e5', bgColor: '#e0e7ff'
    },
    {
      icon: () => (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
      ),
      title: 'Connection Status Badges',
      shortTitle: 'Connect',
      onClick: () => { actions.toggleConnectionBadges(); trackEvent('toggle_connection_badges','settings', showConnectionBadges?'off':'on'); },
      active: showConnectionBadges,
      color: '#f59e0b', hoverColor: '#d97706', bgColor: '#fef3c7'
    },
    {
      icon: () => (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
      title: 'Placement Status Badges',
      shortTitle: 'Place',
      onClick: () => { actions.togglePlacementBadges(); trackEvent('toggle_placement_badges','settings', showPlacementBadges?'off':'on'); },
      active: showPlacementBadges,
      color: '#3b82f6', hoverColor: '#2563eb', bgColor: '#dbeafe'
    },
    {
      icon: () => (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      ),
      title: 'Discovery Tracking',
      shortTitle: 'Discover',
      onClick: () => { actions.setDiscoveryPanelOpen(!state.discoveryPanelOpen); trackEvent('toggle_discovery_panel','view', state.discoveryPanelOpen?'close':'open'); },
      active: state.discoveryPanelOpen,
      badge: discoveryCount > 0 ? discoveryCount : null,
      color: '#a855f7', hoverColor: '#9333ea', bgColor: '#f3e8ff'
    },
    {
      icon: () => (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18"/>
          <path d="M7 14l3-3 3 3 4-6"/>
          <circle cx="7" cy="14" r="1"/>
          <circle cx="13" cy="14" r="1"/>
          <circle cx="17" cy="8" r="1"/>
        </svg>
      ),
      title: 'Analytics Dashboards',
      shortTitle: 'Insights',
      onClick: () => {
        const next = !state.analyticsPanelOpen;
        if (next && state.discoveryPanelOpen) {
          actions.setDiscoveryPanelOpen(false);
        }
        actions.setAnalyticsPanelOpen(next);
        trackEvent('toggle_analytics_panel', 'view', next ? 'open' : 'close');
      },
      active: state.analyticsPanelOpen,
      color: '#22c55e', hoverColor: '#16a34a', bgColor: '#dcfce7'
    },
    {
      icon: SearchIcon,
      title: 'Search Network',
      shortTitle: 'Search',
      onClick: () => { actions.setSearchModalOpen(true); trackFeatureUse('search_network'); },
      color: '#06b6d4', hoverColor: '#0891b2', bgColor: '#cffafe'
    },
    {
      icon: () => (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
      ),
      title: 'Filter Nodes',
      shortTitle: 'Filter',
      onClick: () => { setShowFilterPanel(true); trackFeatureUse('filter_nodes'); },
      active: state.filteredNodes !== null,
      badge: state.filteredNodes ? state.filteredNodes.length : null,
      color: '#8b5cf6', hoverColor: '#7c3aed', bgColor: '#ede9fe'
    },
    {
      icon: () => (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
      ),
      title: 'Manage Tags',
      shortTitle: 'Tags',
      onClick: () => { setShowTagManager(true); trackFeatureUse('manage_tags'); },
      active: state.tagDefinitions.length > 0,
      badge: state.tagDefinitions.length || null,
      color: '#f59e0b', hoverColor: '#d97706', bgColor: '#fef3c7'
    },
    {
      icon: () => (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="3" fill="currentColor"/>
          <line x1="12" y1="2" x2="12" y2="7"/>
          <line x1="12" y1="17" x2="12" y2="22"/>
        </svg>
      ),
      title: showRelationshipBubbles === 'full' ? 'Bubbles: Full' : showRelationshipBubbles === 'labels-only' ? 'Bubbles: Labels Only' : 'Bubbles: Hidden',
      shortTitle: showRelationshipBubbles === 'full' ? 'Full' : showRelationshipBubbles === 'labels-only' ? 'Labels' : 'Hidden',
      onClick: () => { actions.cycleRelationshipBubbles(); trackEvent('cycle_relationship_bubbles','settings', showRelationshipBubbles); },
      active: showRelationshipBubbles === 'full',
      color: '#ec4899', hoverColor: '#db2777', bgColor: '#fce7f3'
    }
  ];

  // File operation tools
  const fileTools = [
    {
      icon: ExportImageIcon,
      title: embedMode ? 'Export to Parent' : 'Download SVG',
      shortTitle: 'Export',
      onClick: () => { handleExportSVG(); trackFeatureUse('export_svg'); },
      color: '#8b5cf6', hoverColor: '#7c3aed', bgColor: '#ede9fe'
    },
    {
      icon: PdfIcon,
      title: 'Download PDF Report',
      shortTitle: 'PDF',
      onClick: () => { handleExportPDF(); trackFeatureUse('export_pdf'); },
      color: '#2563eb', hoverColor: '#1d4ed8', bgColor: '#dbeafe'
    },
    {
      icon: SaveIcon,
      title: embedMode ? 'Save to Note' : 'Save File',
      shortTitle: 'Save',
      onClick: () => { handleSave(); trackFeatureUse('save_file'); },
      color: '#10b981', hoverColor: '#059669', bgColor: '#d1fae5'
    }
  ];
  
  // Show load/new buttons in all modes (including embedded)
  fileTools.push(
    {
      icon: OpenIcon,
      title: 'Load File',
      shortTitle: 'Open',
      onClick: () => { handleLoad(); trackFeatureUse('load_file'); },
      color: '#f59e0b', hoverColor: '#d97706', bgColor: '#fef3c7'
    },
    {
      icon: NewIcon,
      title: 'New Genogram',
      shortTitle: 'New',
      onClick: handleNewGenogram,
      color: '#ef4444', hoverColor: '#dc2626', bgColor: '#fee2e2'
    }
  );

  // Render tool button
  const renderTool = (tool, index) => {
    const buttonStyle = {
      position: 'relative',
      padding: isMobile ? '10px' : '12px',
      borderRadius: isMobile ? '12px' : '16px',
      transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
      background: tool.active ? tool.bgColor : 'transparent',
      color: tool.active ? tool.color : (tool.disabled ? '#d1d5db' : tool.color),
      opacity: tool.disabled ? 0.5 : 1,
      cursor: tool.disabled ? 'not-allowed' : 'pointer',
      border: 'none',
      display: 'flex',
      flexDirection: showLabels ? 'column' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: showLabels ? '4px' : '0',
      minWidth: isMobile ? '44px' : '56px',
      minHeight: isMobile ? '44px' : showLabels ? '64px' : '48px'
    };

    return (
      <button
        key={index}
        onClick={tool.onClick}
        disabled={tool.disabled}
        style={buttonStyle}
        title={tool.title}
        onMouseEnter={e => !tool.active && !tool.disabled && (
          e.currentTarget.style.background = tool.bgColor,
          e.currentTarget.style.color = tool.hoverColor,
          e.currentTarget.style.transform = 'scale(1.05)'
        )}
        onMouseLeave={e => !tool.active && !tool.disabled && (
          e.currentTarget.style.background = 'transparent',
          e.currentTarget.style.color = tool.color,
          e.currentTarget.style.transform = 'scale(1)'
        )}
      >
        <tool.icon size={iconSize} />
        {showLabels && (
          <span style={{ 
            fontSize: '10px', 
            color: tool.active ? tool.color : '#4b5563', 
            fontWeight: 500,
            lineHeight: 1
          }}>
            {tool.shortTitle || tool.title}
          </span>
        )}
        {tool.badge && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '10px',
            padding: '2px 6px',
            fontSize: '10px',
            fontWeight: 'bold',
            lineHeight: '1',
            minWidth: '18px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {tool.badge}
          </span>
        )}
      </button>
    );
  };

  // Choose layout based on screen size
  const useVerticalLayout = isNarrow && expanded;
  
  const mainContainerStyle = {
    position: 'fixed',
    top: position.y,
    left: position.x,
    transform: 'translateX(-50%)',
    cursor: isDragging ? 'grabbing' : 'default',
    zIndex: 30
  };

  const toolbarStyle = {
    display: 'flex',
    flexDirection: useVerticalLayout ? 'column' : 'row',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255,255,255,0.98)',
    backdropFilter: 'blur(12px)',
    borderRadius: isMobile ? '20px' : '24px',
    boxShadow: isDragging 
      ? '0 8px 32px rgba(0,0,0,0.15)' 
      : '0 4px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.08)',
    border: '1px solid rgba(0,0,0,0.04)',
    padding: isMobile ? '4px' : '6px',
    transition: isDragging ? 'none' : 'all 0.2s ease',
    maxWidth: isNarrow ? 'none' : '90vw'
  };

  // Smart positioning for expanded toolbar
  const getExpandedStyle = () => {
    if (useVerticalLayout) {
      // Vertical expansion for narrow screens
      return {
        marginTop: '8px'
      };
    }

    // Smart positioning for desktop - simplified and more reliable
    const margin = 8;
    const expandedWidth = 300; // Estimated width of expanded toolbar
    const expandedHeight = 80; // Estimated height of expanded toolbar
    const toolbarWidth = 320; // Approximate main toolbar width
    const toolbarHeight = 70; // Approximate main toolbar height
    
    // Calculate actual positions (position.x is center due to translateX(-50%))
    const toolbarLeft = position.x - (toolbarWidth / 2);
    const toolbarRight = position.x + (toolbarWidth / 2);
    const toolbarTop = position.y;
    const toolbarBottom = position.y + toolbarHeight;
    
    // Check available space in each direction
    const spaceRight = window.innerWidth - toolbarRight;
    const spaceLeft = toolbarLeft;
    const spaceBelow = window.innerHeight - toolbarBottom;
    const spaceAbove = toolbarTop;
    
    // Simple logic: If toolbar is in top half, drop below. Otherwise expand right if possible.
    const isInTopHalf = position.y < window.innerHeight / 2;
    
    if (isInTopHalf && spaceBelow >= expandedHeight + margin) {
      // Drop below when in top half of screen
      return {
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: `${margin}px`,
        zIndex: 31
      };
    } else if (spaceRight >= expandedWidth + margin) {
      // Expand right if there's space
      return {
        position: 'absolute',
        top: '50%',
        left: '100%',
        transform: 'translateY(-50%)',
        marginLeft: `${margin}px`,
        zIndex: 31
      };
    } else if (spaceLeft >= expandedWidth + margin) {
      // Expand left if right doesn't fit
      return {
        position: 'absolute',
        top: '50%',
        right: '100%',
        transform: 'translateY(-50%)',
        marginRight: `${margin}px`,
        zIndex: 31
      };
    } else if (spaceBelow >= expandedHeight + margin) {
      // Drop below as fallback
      return {
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: `${margin}px`,
        zIndex: 31
      };
    } else if (spaceAbove >= expandedHeight + margin) {
      // Pop above as last resort
      return {
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: `${margin}px`,
        zIndex: 31
      };
    }
    
    // Final fallback - drop below even if it might go off-screen
    return {
      position: 'absolute',
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: `${margin}px`,
      zIndex: 31
    };
  };

  const expandedStyle = getExpandedStyle();

  return (
    <>
    <div style={mainContainerStyle}>
      <div
        style={toolbarStyle}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
      >
        {/* Drag handle */}
        <div 
          style={{ 
            padding: isMobile ? '8px 6px' : '12px 8px',
            cursor: 'grab',
            borderRadius: isMobile ? '14px' : '18px',
            display: 'flex',
            alignItems: 'center',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => !isDragging && (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
          onMouseLeave={e => !isDragging && (e.currentTarget.style.background = 'transparent')}
        >
          <svg width={isMobile ? 8 : 10} height={isMobile ? 12 : 16} fill="currentColor" viewBox="0 0 10 16" style={{ opacity: 0.3 }}>
            <path d="M2 2a1 1 0 112 0 1 1 0 01-2 0zM2 6a1 1 0 112 0 1 1 0 01-2 0zM2 10a1 1 0 112 0 1 1 0 01-2 0zM2 14a1 1 0 112 0 1 1 0 01-2 0zM6 2a1 1 0 112 0 1 1 0 01-2 0zM6 6a1 1 0 112 0 1 1 0 01-2 0zM6 10a1 1 0 112 0 1 1 0 01-2 0zM6 14a1 1 0 112 0 1 1 0 01-2 0z"/>
          </svg>
        </div>

        {/* Main tools */}
        {mainTools.map(renderTool)}

        {/* Expand button */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            padding: isMobile ? '10px' : '12px',
            borderRadius: isMobile ? '12px' : '18px',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            minWidth: isMobile ? '44px' : '48px',
            minHeight: isMobile ? '44px' : '48px'
          }}
          title={expanded ? 'Hide tools' : 'More tools'}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {useVerticalLayout ? (
            <ChevronDown size={iconSize} style={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
          ) : (
            <ChevronRight size={iconSize} style={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
          )}
        </button>
      </div>

      {/* Expanded tools */}
      {expanded && (
        <div style={{
          ...toolbarStyle,
          ...expandedStyle,
          flexDirection: useVerticalLayout ? 'column' : 'row',
          flexWrap: useVerticalLayout ? 'nowrap' : 'wrap',
          maxWidth: useVerticalLayout ? 'none' : '300px'
        }}>
          {secondaryTools.map(renderTool)}
          
          {!isMobile && (
            <>
              <div style={{ 
                width: useVerticalLayout ? '80%' : '1px',
                height: useVerticalLayout ? '1px' : '30px',
                background: 'linear-gradient(to ' + (useVerticalLayout ? 'right' : 'bottom') + ', transparent, #e5e7eb, transparent)',
                margin: useVerticalLayout ? '4px 0' : '0 6px'
              }} />
              {fileTools.map(renderTool)}
            </>
          )}
        </div>
      )}

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onSave={handleSaveAndNew}
        onDiscard={handleDiscardAndNew}
        onCancel={handleCancelNew}
        hasAutosave={checkAutosaveExists()}
      />

      {/* Filter Panel Modal */}
      {showFilterPanel && (
        <FilterPanel onClose={() => setShowFilterPanel(false)} />
      )}
    </div>

    {/* Tag Manager Modal - outside main container so it's not constrained */}
    {showTagManager && (
      <TagManager isOpen={showTagManager} onClose={() => setShowTagManager(false)} />
    )}
    </>
  );
};

export default FloatingToolbar;
