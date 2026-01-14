// src/src-modern/components/TabletInterface/TabletInterface.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  UserPlus, Users, Heart, Baby, Home, 
  Type, Sparkles, Download, Upload, 
  Maximize2, ZoomIn, ZoomOut, Grid,
  Menu, X, Settings, Palette, Layers,
  Link2, Edit3, Save, Share2, History,
  ChevronLeft, ChevronRight, Search,
  Trash2, Move, Square, Circle, Info,
  Undo, Redo, Eye, EyeOff, FolderOpen,
  HelpCircle, FileText, Copy, MoreVertical,
  FilePlus
} from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import { useResponsive } from '../../utils/responsive';
import { usePersonActions } from '../../hooks/usePersonActions';
import { useChildActions } from '../../hooks/useChildActions';
import { useFileOperations } from '../../hooks/useFileOperations';
import GenogramCanvas from '../Canvas/GenogramCanvas';
import QuickEditModal from '../UI/QuickEditModal';
import TabletQuickActions from './TabletQuickActions';
import ConnectionIndicator from '../UI/ConnectionIndicator';
import HouseholdDrawingIndicator from '../UI/HouseholdDrawingIndicator';
import QuickAddModal from '../UI/QuickAddModal';
import DeleteConfirmationModal from '../UI/DeleteConfirmationModal';
import NewPersonModal from '../UI/NewPersonModal';
import ChildConnectionOptionsModal from '../UI/ChildConnectionOptionsModal';

const TabletInterface = () => {
  const { state, actions } = useGenogram();
  const { dimensions } = useResponsive();
  const { handleSave, handleLoad, handleExportSVG } = useFileOperations();
  const canvasRef = useRef(null);
  const [activePanel, setActivePanel] = useState(null);
  const [showToolbox, setShowToolbox] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [gesture, setGesture] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [quickActionsPosition, setQuickActionsPosition] = useState({ x: 0, y: 0 });
  const [selectedTool, setSelectedTool] = useState(null);
  const [showLayers, setShowLayers] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeToolCategory, setActiveToolCategory] = useState('people');
  const lastTapRef = useRef(0);
  const [showGestureHint, setShowGestureHint] = useState(false);
  const [showChildOptions, setShowChildOptions] = useState(false);
  
  // Use the person actions hook
  const { 
    createChild,
    createSpouse,
    createSpouseAndChild,
    createParents,
    startConnectionFromPerson,
    deleteSelectedPerson 
  } = usePersonActions();

  // Use child actions hook
  const { 
    getPartnerRelationships,
    selectPartnerRelationship,
    createChildWithUnknownParent,
    createSingleParentAdoption
  } = useChildActions();

  // Show gesture hint for first-time users
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('tablet_gesture_hint_seen');
    if (!hasSeenHint) {
      setShowGestureHint(true);
      setTimeout(() => {
        setShowGestureHint(false);
        localStorage.setItem('tablet_gesture_hint_seen', 'true');
      }, 5000);
    }
  }, []);

  // Close child options when selection changes
  useEffect(() => {
    if (!state.selectedPerson) {
      setShowChildOptions(false);
    }
  }, [state.selectedPerson]);

  // Handle add child with partner selection logic
  const handleAddChild = () => {
    console.log('=== HANDLE ADD CHILD CLICKED ===');
    if (!state.selectedPerson) {
      console.log('No selected person');
      return;
    }
    
    const partnerRelationships = getPartnerRelationships(state.selectedPerson.id);
    console.log('Partner relationships found:', partnerRelationships.length);
    console.log('Partner relationships:', partnerRelationships);
    
    if (partnerRelationships.length === 0) {
      // No partners - show options
      console.log('No partners - showing options');
      setShowChildOptions(true);
    } else if (partnerRelationships.length === 1) {
      // One partner - directly select that relationship
      console.log('One partner - directly creating child');
      selectPartnerRelationship(partnerRelationships[0]);
      setShowChildOptions(false);
    } else {
      // Multiple partners - show selection
      console.log('Multiple partners - showing selection');
      setShowChildOptions(true);
    }
  };

  // Touch gesture handlers
  const handleTouchStart = (e) => {
    // Prevent default to avoid browser context menu on long press
    e.preventDefault();
    
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setTouchStart({ distance, time: Date.now() });
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      setTouchStart({ 
        x: touch.clientX, 
        y: touch.clientY, 
        time: Date.now() 
      });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStart?.distance) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      const scale = distance / touchStart.distance;
      if (scale > 1.1) {
        setGesture('zoom-in');
        actions.setZoom(Math.min((state.zoom || 1) * 1.02, 3));
      } else if (scale < 0.9) {
        setGesture('zoom-out');
        actions.setZoom(Math.max((state.zoom || 1) * 0.98, 0.3));
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      time: Date.now()
    };

    // Double tap detection
    if (touchEnd.time - lastTapRef.current < 300) {
      handleDoubleTap(touchEnd);
    }
    lastTapRef.current = touchEnd.time;

    // Long press detection
    if (touchStart.time && 
        touchEnd.time - touchStart.time > 500 &&
        Math.abs(touchEnd.x - (touchStart.x || 0)) < 10 &&
        Math.abs(touchEnd.y - (touchStart.y || 0)) < 10) {
      handleLongPress(touchEnd);
    }

    setTouchStart(null);
    setTimeout(() => setGesture(null), 500);
  };

  const handleDoubleTap = (position) => {
    const currentZoom = state.zoom || 1;
    const newZoom = currentZoom >= 2 ? 1 : currentZoom * 1.5;
    actions.setZoom(newZoom);
    setGesture('double-tap');
  };

  const handleLongPress = (position) => {
    setQuickActionsPosition(position);
    setShowQuickActions(true);
  };

  // Tool categories with gradient colors
  const toolCategories = [
    {
      name: 'People',
      icon: Users,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#667eea',
      tools: [
        { icon: UserPlus, label: 'Add Person', action: 'add-person' },
        { icon: Heart, label: 'Add Couple', action: 'add-couple' },
        { icon: Baby, label: 'Add Child', action: 'add-child' },
        { icon: Users, label: 'Add Family', action: 'add-family' }
      ]
    },
    {
      name: 'Elements',
      icon: Layers,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      color: '#f093fb',
      tools: [
        { icon: Home, label: 'Household', action: 'household' },
        { icon: Type, label: 'Text', action: 'text' },
        { icon: Link2, label: 'Connect', action: 'connect' },
        { icon: Sparkles, label: 'Highlight', action: 'highlight' }
      ]
    },
    {
      name: 'Layout',
      icon: Grid,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      color: '#4facfe',
      tools: [
        { icon: Sparkles, label: 'Auto Layout', action: 'auto-layout' },
        { icon: Maximize2, label: 'Fit View', action: 'fit-view' },
        { icon: Grid, label: 'Toggle Grid', action: 'toggle-grid' },
        { icon: Move, label: 'Arrange', action: 'arrange' }
      ]
    }
  ];

  const handleToolAction = (action) => {
    setSelectedTool(action);
    
    switch (action) {
      case 'add-person':
        actions.setActiveTool?.('add-person');
        actions.setQuickAddOpen?.(true);
        break;
      case 'household':
        actions.startDrawingHousehold?.();
        break;
      case 'connect':
        actions.setConnectionDrawing?.(true);
        break;
      case 'auto-layout':
        actions.autoLayout?.();
        break;
      case 'fit-view':
        actions.fitToScreen?.();
        break;
      case 'toggle-grid':
        actions.toggleSnapToGrid?.();
        break;
      default:
        console.log('Tool action:', action);
    }
    
    setActivePanel(null);
  };

  // Modern glass panel style
  const panelStyle = {
    position: 'fixed',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
    padding: '24px',
    zIndex: 200,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid rgba(255, 255, 255, 0.18)'
  };

  // Render floating toolbox
  const renderToolbox = () => {
    if (!showToolbox) return null;

    return (
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '16px',
          padding: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: '32px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
          zIndex: 100,
          border: '1px solid rgba(255, 255, 255, 0.18)'
        }}
      >
        {toolCategories.map((category, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <button
              onClick={() => setActivePanel(activePanel === category.name ? null : category.name)}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: activePanel === category.name ? category.gradient : 'white',
                color: activePanel === category.name ? 'white' : category.color,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: activePanel === category.name ? 'scale(1.05)' : 'scale(1)',
                boxShadow: activePanel === category.name ? 
                  `0 8px 24px ${category.color}40` : 
                  '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}
            >
              <category.icon size={28} />
            </button>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              color: '#475569',
              opacity: 0.8
            }}>
              {category.name}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Render tool panel with animations
  const renderToolPanel = () => {
    if (!activePanel) return null;

    const category = toolCategories.find(cat => cat.name === activePanel);
    if (!category) return null;

    return (
      <div
        style={{
          ...panelStyle,
          bottom: '140px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'auto',
          maxWidth: '600px',
          opacity: activePanel ? 1 : 0,
          transform: activePanel ? 
            'translateX(-50%) translateY(0)' : 
            'translateX(-50%) translateY(20px)'
        }}
      >
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: '700', 
          marginBottom: '20px',
          background: category.gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {category.name} Tools
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '16px'
        }}>
          {category.tools.map((tool, idx) => (
            <button
              key={idx}
              onClick={() => handleToolAction(tool.action)}
              style={{
                padding: '20px',
                borderRadius: '20px',
                border: '2px solid transparent',
                background: 'linear-gradient(145deg, #ffffff, #f3f4f6)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = category.color;
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 12px 24px ${category.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: category.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <tool.icon size={24} color="white" />
              </div>
              <span style={{ 
                fontSize: '14px', 
                fontWeight: '600',
                color: '#1f2937'
              }}>
                {tool.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Render zoom controls with modern design
  const renderZoomControls = () => (
    <div
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '50%',
        transform: 'translateY(50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
        border: '1px solid rgba(255, 255, 255, 0.18)'
      }}
    >
      <button
        onClick={() => actions.setZoom?.(Math.min((state.zoom || 1) * 1.2, 3))}
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '16px',
          border: 'none',
          background: 'linear-gradient(145deg, #ffffff, #f3f4f6)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}
      >
        <ZoomIn size={22} color="#475569" />
      </button>
      
      <div style={{
        padding: '12px 0',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: '700',
        color: '#475569'
      }}>
        {Math.round((state.zoom || 1) * 100)}%
      </div>
      
      <button
        onClick={() => actions.setZoom?.(Math.max((state.zoom || 1) * 0.8, 0.3))}
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '16px',
          border: 'none',
          background: 'linear-gradient(145deg, #ffffff, #f3f4f6)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}
      >
        <ZoomOut size={22} color="#475569" />
      </button>
      
      <div style={{ 
        height: '1px', 
        background: 'rgba(0, 0, 0, 0.06)', 
        margin: '8px 0' 
      }} />
      
      <button
        onClick={() => actions.fitToScreen?.()}
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '16px',
          border: 'none',
          background: 'linear-gradient(145deg, #ffffff, #f3f4f6)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}
      >
        <Maximize2 size={22} color="#475569" />
      </button>
    </div>
  );

  // Render selected item panel with glassmorphism
  const renderSelectionPanel = () => {
    const selected = state.selectedPerson || state.selectedRelationship || 
                    state.selectedHousehold || state.selectedTextBox;
    if (!selected) return null;

    const partnerRelationships = state.selectedPerson ? 
      getPartnerRelationships(state.selectedPerson.id) : [];

    return (
      <div
        style={{
          ...panelStyle,
          top: '100px',
          right: '24px',
          width: '380px',
          maxHeight: '70vh',
          overflowY: 'auto'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ 
            fontSize: '22px', 
            fontWeight: '700',
            color: '#1f2937'
          }}>
            {state.selectedPerson ? state.selectedPerson.name : 
             state.selectedRelationship ? 'Relationship' :
             state.selectedHousehold ? 'Household' : 'Text Box'}
          </h3>
          <button
            onClick={() => {
              actions.selectPerson(null);
              actions.selectRelationship(null);
              actions.selectHousehold(null);
              actions.selectTextBox(null);
              setShowChildOptions(false);
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(145deg, #ffffff, #f3f4f6)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <X size={20} color="#64748b" />
          </button>
        </div>
        
        {state.selectedPerson && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              onClick={() => {
                if (actions.setQuickEditOpen) {
                  actions.setQuickEditOpen(true);
                } else if (actions.setQuickEditModalOpen) {
                  actions.setQuickEditModalOpen(true);
                }
              }}
              style={{
                padding: '16px 20px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s'
              }}
            >
              <Edit3 size={20} />
              Quick Edit
            </button>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              {/* Updated Add Child button */}
              <button
                onClick={handleAddChild}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: `2px solid #10b98120`,
                  backgroundColor: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <Baby size={24} color="#10b981" />
                Add Child
                {partnerRelationships.length > 1 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600'
                  }}>
                    {partnerRelationships.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => createSpouse()}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: `2px solid #ec489920`,
                  backgroundColor: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <Heart size={24} color="#ec4899" />
                Add Partner
              </button>
              
              <button
                onClick={() => createParents()}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: `2px solid #8b5cf620`,
                  backgroundColor: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <Users size={24} color="#8b5cf6" />
                Add Parents
              </button>
              
              <button
                onClick={() => startConnectionFromPerson('marriage')}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: `2px solid #f59e0b20`,
                  backgroundColor: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <Link2 size={24} color="#f59e0b" />
                Connect
              </button>
            </div>
            
            <button
              onClick={() => {
                if (actions.setDeleteModalOpen) {
                  actions.setDeleteModalOpen(true);
                } else if (actions.setDeleteConfirmationOpen) {
                  actions.setDeleteConfirmationOpen(true);
                } else {
                  deleteSelectedPerson();
                }
              }}
              style={{
                padding: '14px',
                borderRadius: '16px',
                border: '2px solid #ef444420',
                backgroundColor: 'white',
                color: '#ef4444',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <Trash2 size={20} />
              Delete Person
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render child options dropdown - SEPARATE FROM SELECTION PANEL
  const renderChildOptionsDropdown = () => {
    console.log('=== renderChildOptionsDropdown ===');
    console.log('showChildOptions:', showChildOptions);
    console.log('selectedPerson:', state.selectedPerson?.name);
    
    if (!showChildOptions || !state.selectedPerson) {
      console.log('Not rendering - showChildOptions:', showChildOptions, 'selectedPerson:', !!state.selectedPerson);
      return null;
    }
    
    const partnerRelationships = getPartnerRelationships(state.selectedPerson.id);
    console.log('Rendering child options dropdown with', partnerRelationships.length, 'partners');
    
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
        padding: '24px',
        zIndex: 1001,
        border: '1px solid rgba(0, 0, 0, 0.05)',
        maxHeight: '80vh',
        overflowY: 'auto',
        minWidth: '350px',
        maxWidth: '500px'
      }}>
        <h4 style={{ 
          fontSize: '20px', 
          fontWeight: '700', 
          marginBottom: '20px', 
          color: '#1e293b' 
        }}>
          Add Child Options
        </h4>
        
        {partnerRelationships.length === 0 ? (
          <>
            <div style={{
              padding: '16px',
              backgroundColor: '#d1fae5',
              borderRadius: '12px',
              marginBottom: '20px',
              fontSize: '15px',
              color: '#065f46',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              ✨ One-click: Creates partner + child instantly!
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => {
                  createChildWithUnknownParent(state.selectedPerson);
                  setShowChildOptions(false);
                }}
                style={{
                  padding: '18px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6b7280';
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <HelpCircle size={24} color="#6b7280" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', color: '#374151', fontSize: '16px' }}>
                    Unknown Co-parent + Child
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
                    Creates unknown parent and adds a child
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  createSpouseAndChild(state.selectedPerson);
                  setShowChildOptions(false);
                }}
                style={{
                  padding: '18px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6366f1';
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <UserPlus size={24} color="#6366f1" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', color: '#374151', fontSize: '16px' }}>
                    New Partner + Child
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
                    Create a new partner and their child together
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  startConnectionFromPerson('partner');
                  setShowChildOptions(false);
                }}
                style={{
                  padding: '18px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#8b5cf6';
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <Link2 size={24} color="#8b5cf6" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', color: '#374151', fontSize: '16px' }}>
                    Connect to Existing
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
                    Link to someone already in the diagram
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  createSingleParentAdoption(state.selectedPerson);
                  setShowChildOptions(false);
                }}
                style={{
                  padding: '18px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#06b6d4';
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <Heart size={24} color="#06b6d4" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', color: '#374151', fontSize: '16px' }}>
                    Single Parent Adoption
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
                    Creates adopted child instantly
                  </div>
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '20px', color: '#6b7280', fontSize: '15px' }}>
              Select which relationship to add a child to:
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {partnerRelationships.map(rel => {
                const partner = state.people.find(p => 
                  p.id === (rel.from === state.selectedPerson.id ? rel.to : rel.from)
                );
                
                return (
                  <button
                    key={rel.id}
                    onClick={() => {
                      selectPartnerRelationship(rel);
                      setShowChildOptions(false);
                    }}
                    style={{
                      padding: '18px',
                      borderRadius: '12px',
                      border: '2px solid #e5e7eb',
                      backgroundColor: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = rel.color || '#6366f1';
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <Heart size={24} color={rel.color || '#6366f1'} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: '600', color: '#374151', fontSize: '16px' }}>
                        {rel.type.charAt(0).toUpperCase() + rel.type.slice(1)} with {partner?.name || 'Unknown'}
                      </div>
                      {rel.startDate && (
                        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
                          Since {new Date(rel.startDate).getFullYear()}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
              
              <div style={{ margin: '16px 0', height: '1px', backgroundColor: '#e5e7eb' }} />
              
              <button
                onClick={() => {
                  createChildWithUnknownParent(state.selectedPerson);
                  setShowChildOptions(false);
                }}
                style={{
                  padding: '18px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6b7280';
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <HelpCircle size={24} color="#6b7280" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600', color: '#374151', fontSize: '16px' }}>
                    Add Another Unknown Co-parent
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
                    Child from a different relationship
                  </div>
                </div>
              </button>
            </div>
          </>
        )}
        
        <button
          onClick={() => setShowChildOptions(false)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: '#f3f4f6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: '#6b7280',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e5e7eb';
            e.currentTarget.style.color = '#374151';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          ×
        </button>
      </div>
    );
  };

  // Render top bar with glassmorphism
  const renderTopBar = () => (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            border: 'none',
            background: showMenu ? 
              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
              'linear-gradient(145deg, #ffffff, #f3f4f6)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s',
            boxShadow: showMenu ? 
              '0 4px 16px rgba(102, 126, 234, 0.3)' : 
              '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          <Menu size={26} color={showMenu ? 'white' : '#475569'} />
        </button>
        
        <div>
          <h1 style={{ 
            fontSize: '26px', 
            fontWeight: '700', 
            margin: 0,
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            {state.fileName || 'Untitled Genogram'}
            {state.isDirty && (
              <span style={{
                width: '10px',
                height: '10px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'pulse 2s infinite'
              }} />
            )}
          </h1>
          <p style={{ 
            fontSize: '15px', 
            color: '#64748b', 
            margin: 0,
            marginTop: '4px',
            fontWeight: '500'
          }}>
            {state.people.length} people • {state.relationships.length} relationships
            {state.households?.length > 0 && ` • ${state.households.length} households`}
          </p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          onClick={() => actions.undo?.()}
          disabled={!state.canUndo}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            border: 'none',
            background: 'linear-gradient(145deg, #ffffff, #f3f4f6)',
            cursor: state.canUndo ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: state.canUndo ? 1 : 0.5,
            transition: 'all 0.2s'
          }}
        >
          <Undo size={20} color="#64748b" />
        </button>
        
        <button
          onClick={() => actions.redo?.()}
          disabled={!state.canRedo}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            border: 'none',
            background: 'linear-gradient(145deg, #ffffff, #f3f4f6)',
            cursor: state.canRedo ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: state.canRedo ? 1 : 0.5,
            transition: 'all 0.2s'
          }}
        >
          <Redo size={20} color="#64748b" />
        </button>
        
        <div style={{ width: '1px', height: '32px', background: 'rgba(0, 0, 0, 0.06)' }} />
        
        <button
          onClick={() => setShowLayers(!showLayers)}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            border: 'none',
            background: showLayers ? 
              'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : 
              'linear-gradient(145deg, #ffffff, #f3f4f6)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s',
            boxShadow: showLayers ? 
              '0 4px 16px rgba(79, 172, 254, 0.3)' : 
              '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          <Layers size={20} color={showLayers ? 'white' : '#64748b'} />
        </button>
        
        <button
          onClick={() => console.log('Share')}
          style={{
            padding: '14px 24px',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(145deg, #ffffff, #f3f4f6)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '16px',
            fontWeight: '600',
            color: '#475569',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          <Share2 size={20} />
          Share
        </button>
        
        <button
          onClick={() => handleSave()
          }
          style={{
            padding: '14px 28px',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.3s',
            boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
          }}
        >
          <Save size={20} />
          Save
        </button>
      </div>
      
      {/* Add file operations menu */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginLeft: '12px'
      }}>
        <button
          onClick={() => handleLoad()}
          style={{
            padding: '12px 20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            background: 'white',
            color: '#374151',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
          }}
        >
          <FolderOpen size={16} />
          Load
        </button>
        
        <button
          onClick={() => handleExportSVG()}
          style={{
            padding: '12px 20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            background: 'white',
            color: '#374151',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
          }}
        >
          <Download size={16} />
          Export
        </button>
        
        <button
          onClick={async () => {
            if (state.isDirty) {
              const shouldSave = window.confirm('Save changes before clearing the genogram?');
              if (shouldSave) {
                const saved = await handleSave();
                if (!saved) return;
              }
            }
            actions.newGenogram();
          }}
          style={{
            padding: '12px 20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            background: 'white',
            color: '#374151',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
          }}
        >
          <FilePlus size={16} />
          New
        </button>
      </div>
    </div>
  );

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #fafbfc 0%, #e9ecef 100%)',
        touchAction: 'none', // Disable default touch behaviors
        WebkitTouchCallout: 'none', // Disable iOS callout
        WebkitUserSelect: 'none', // Disable text selection
        userSelect: 'none'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      // Don't prevent context menu - let individual components handle it
    >
      {renderTopBar()}
      
      <div 
        ref={canvasRef}
        style={{ 
          paddingTop: '80px',
          width: '100%',
          height: '100%',
          position: 'relative'
        }}
      >
        <GenogramCanvas />
        <ConnectionIndicator />
        <HouseholdDrawingIndicator />
      </div>
      
      {renderToolbox()}
      {renderToolPanel()}
      {renderZoomControls()}
      {renderSelectionPanel()}
      
      {/* CHILD OPTIONS DROPDOWN - Rendered separately at root level */}
      {renderChildOptionsDropdown()}
      
      {/* Gesture hint */}
      {showGestureHint && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '24px 40px',
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            borderRadius: '20px',
            fontSize: '18px',
            fontWeight: '500',
            textAlign: 'center',
            zIndex: 1000,
            maxWidth: '400px',
            lineHeight: 1.6,
            animation: 'fadeInOut 5s forwards'
          }}
        >
          <Sparkles size={32} style={{ marginBottom: '16px' }} />
          <div>Touch & hold to add elements</div>
          <div style={{ fontSize: '16px', opacity: 0.8, marginTop: '8px' }}>
            Pinch to zoom • Two fingers to pan
          </div>
        </div>
      )}
      
      {/* Gesture feedback */}
      {gesture && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '16px 32px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            borderRadius: '16px',
            fontSize: '18px',
            fontWeight: '600',
            zIndex: 1000,
            animation: 'fadeOut 1s forwards',
            pointerEvents: 'none'
          }}
        >
          {gesture === 'zoom-in' ? 'Zooming In' : 
           gesture === 'zoom-out' ? 'Zooming Out' :
           gesture === 'double-tap' ? 'Double Tap' : ''}
        </div>
      )}
      
      {/* Quick Actions Menu */}
      {showQuickActions && (
        <TabletQuickActions
          show={showQuickActions}
          position={quickActionsPosition}
          onClose={() => setShowQuickActions(false)}
          onRequestChildOptions={() => {
            console.log('=== onRequestChildOptions CALLBACK TRIGGERED ===');
            console.log('Current showChildOptions:', showChildOptions);
            setShowChildOptions(true);
            setShowQuickActions(false);
            console.log('Set showChildOptions to true');
          }}
        />
      )}
      
      {/* Modals */}
      <QuickEditModal />
      <QuickAddModal />
      <DeleteConfirmationModal />
      <NewPersonModal />
      <ChildConnectionOptionsModal />
      
      <style jsx>{`
        @keyframes fadeOut {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        }
        
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default TabletInterface;