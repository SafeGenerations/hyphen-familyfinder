// src/src-modern/components/MobileInterface/MobileInterface.js
import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Link2, Eye, Folder, MoreHorizontal, X, Home, Grid3x3, 
  Wand2, Users, Save, Download, FolderOpen, FilePlus, Undo, Redo,
  UserPlus, Heart, Baby, Link, Edit, Trash2, Copy, HelpCircle, FileText
} from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import { useFileOperations } from '../../hooks/useFileOperations';
import { useCanvasOperations } from '../../hooks/useCanvasOperations';
import { usePersonActions } from '../../hooks/usePersonActions';
import { useChildActions } from '../../hooks/useChildActions';
import { useResponsive, getGridSize } from '../../utils/responsive';
import { trackFeatureUse, trackEvent } from '../../../utils/analytics';
import MobileCanvas from '../Canvas/MobileCanvas';
import BottomSheet from '../EditPanels/BottomSheet';
import MobileQuickAddModal from '../UI/MobileQuickAddModal';
import ConnectionIndicator from '../UI/ConnectionIndicator';
import HouseholdDrawingIndicator from '../UI/HouseholdDrawingIndicator';
import QuickEditModal from '../UI/QuickEditModal';
import DeleteConfirmationModal from '../UI/DeleteConfirmationModal';
import NewPersonModal from '../UI/NewPersonModal';

// Import the radial menu component (removed TabletQuickActions - wrong for mobile)

const MobileInterface = () => {
  const { state, actions } = useGenogram();
  const { dimensions, breakpoint } = useResponsive();
  const { handleSave, handleLoad, handleExportSVG, handleExportPDF } = useFileOperations();
  const { autoArrange, fitToCanvas, smartOverview, centerContent } = useCanvasOperations();
  const [activeSheet, setActiveSheet] = useState(null);
  
  // Mobile interface states  
  const [showChildOptions, setShowChildOptions] = useState(false);
  
  // Use context for mobile menu state
  const { mobileMenuOpen } = state;
  
  const { 
    isConnecting, 
    highlightNetwork, 
    snapToGrid,
    isDrawingHousehold,
    history,
    historyIndex 
  } = state;

  // Person actions
  const {
    createSpouse,
    createParents,
    startConnectionFromPerson,
    deleteSelectedPerson
  } = usePersonActions();

  // Child actions
  const {
    getPartnerRelationships,
    selectPartnerRelationship,
    createChildWithUnknownParent,
    createSingleParentAdoption
  } = useChildActions();






  // Handle add child with partner selection
  const handleAddChild = () => {
    if (!state.selectedPerson) return;
    
    const partnerRelationships = getPartnerRelationships(state.selectedPerson.id);
    
    if (partnerRelationships.length === 0) {
      setShowChildOptions(true);
    } else if (partnerRelationships.length === 1) {
      selectPartnerRelationship(partnerRelationships[0]);
      setShowChildOptions(false);
    } else {
      setShowChildOptions(true);
    }
  };

  // Close child options when selection changes
  useEffect(() => {
    if (!state.selectedPerson) {
      setShowChildOptions(false);
    }
  }, [state.selectedPerson]);



  // Handle escape key to close mobile menus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeSheet) {
          setActiveSheet(null);

        } else if (showChildOptions) {
          setShowChildOptions(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeSheet, showChildOptions]);

  // Main navigation items
  const mainNavItems = [
    {
      id: 'add',
      icon: Plus,
      label: 'Add',
      color: '#8b5cf6',
      action: () => {
        setActiveSheet('add');
      }
    },
    {
      id: 'connect',
      icon: Link2,
      label: 'Connect',
      color: '#ec4899',
      active: isConnecting,
      action: () => {
        if (isConnecting) {
          actions.cancelConnection();
        } else {
          setActiveSheet('connect');
        }
      }
    },
    {
      id: 'view',
      icon: Eye,
      label: 'View',
      color: '#3b82f6',
      action: () => {
        setActiveSheet('view');
      }
    },
    {
      id: 'file',
      icon: Folder,
      label: 'File',
      color: '#10b981',
      action: () => {
        setActiveSheet('file');
      }
    },
    {
      id: 'more',
      icon: MoreHorizontal,
      label: 'More',
      color: '#6b7280',
      action: () => {
        setActiveSheet('more');
      }
    }
  ];

  // Sheet content configurations
  const sheetConfigs = {
    add: {
      title: 'Add to Genogram',
      items: [
        {
          icon: Plus,
          label: 'Add Person',
          description: 'Create a new person',
          color: '#8b5cf6',
          action: () => {
            actions.setQuickAddOpen(true);
            trackFeatureUse('add_person_modal');
            setActiveSheet(null);
          }
        },
        {
          icon: Home,
          label: 'Draw Household',
          description: 'Create a household boundary',
          color: '#10b981',
          active: isDrawingHousehold,
          action: () => {
            if (isDrawingHousehold) {
              actions.cancelDrawingHousehold();
            } else {
              actions.startDrawingHousehold();
              trackFeatureUse('draw_household');
            }
            setActiveSheet(null);
          }
        },
        {
          icon: Grid3x3,
          label: 'Add Text',
          description: 'Add a text annotation',
          color: '#3b82f6',
          action: () => {
            const newTextBox = {
              id: Date.now().toString(),
              x: window.innerWidth / 2 - 75,
              y: window.innerHeight / 2 - 25,
              width: 200,
              height: 60,
              html: 'New Text',
              fontSize: 16,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              color: '#1f2937'
            };
            actions.addTextBox(newTextBox);
            actions.selectTextBox({ textBox: newTextBox, openPanel: true });
            trackFeatureUse('add_text');
            setActiveSheet(null);
          }
        }
      ]
    },
    connect: {
      title: 'Create Connection',
      items: [
        {
          label: 'Marriage/Partnership',
          description: 'Romantic relationship',
          color: '#ec4899',
          action: () => {
            startConnectionFromPerson('marriage');
            setActiveSheet(null);
          }
        },
        {
          label: 'Parent-Child',
          description: 'Biological or adoptive',
          color: '#8b5cf6',
          action: () => {
            startConnectionFromPerson('child');
            setActiveSheet(null);
          }
        },
        {
          label: 'Siblings',
          description: 'Brother or sister',
          color: '#3b82f6',
          action: () => {
            startConnectionFromPerson('sibling');
            setActiveSheet(null);
          }
        },
        {
          label: 'Other Relationship',
          description: 'Custom connection type',
          color: '#6b7280',
          action: () => {
            startConnectionFromPerson('other');
            setActiveSheet(null);
          }
        }
      ]
    },
    view: {
      title: 'View Options',
      items: [
        {
          icon: Wand2,
          label: 'Auto Arrange',
          description: 'Organize layout automatically',
          color: '#f59e0b',
          action: () => {
            autoArrange();
            trackFeatureUse('auto_arrange');
            setActiveSheet(null);
          }
        },
        {
          icon: Eye,
          label: 'Smart Overview',
          description: 'See all content (mobile-friendly)',
          color: '#14b8a6',
          action: () => {
            smartOverview();
            trackFeatureUse('smart_overview');
            setActiveSheet(null);
          }
        },
        {
          icon: Home,
          label: 'Center View',
          description: 'Center the content',
          color: '#06b6d4',
          action: () => {
            centerContent();
            trackFeatureUse('center_view');
            setActiveSheet(null);
          }
        },
        {
          icon: Grid3x3,
          label: 'Toggle Grid',
          description: snapToGrid ? 'Grid is ON' : 'Grid is OFF',
          color: '#6366f1',
          active: snapToGrid,
          action: () => {
            actions.toggleSnapToGrid();
            trackEvent('toggle_grid', 'settings', snapToGrid ? 'off' : 'on');
            setActiveSheet(null);
          }
        },
        {
          icon: Users,
          label: 'Highlight Network',
          description: highlightNetwork ? 'Network highlighting ON' : 'Network highlighting OFF',
          color: '#ec4899',
          active: highlightNetwork,
          action: () => {
            actions.toggleHighlightNetwork();
            trackEvent('toggle_highlight', 'settings', highlightNetwork ? 'off' : 'on');
            setActiveSheet(null);
          }
        }
      ]
    },
    file: {
      title: 'File Options',
      items: [
        {
          icon: Save,
          label: 'Save Genogram',
          description: 'Save to your device',
          color: '#10b981',
          action: () => {
            handleSave();
            setActiveSheet(null);
          }
        },
        {
          icon: FolderOpen,
          label: 'Open File',
          description: 'Load a saved genogram',
          color: '#f59e0b',
          action: () => {
            handleLoad();
            setActiveSheet(null);
          }
        },
        {
          icon: Download,
          label: 'Image',
          description: 'Export as SVG',
          color: '#8b5cf6',
          action: () => {
            handleExportSVG();
            setActiveSheet(null);
          }
        },
        {
          icon: FileText,
          label: 'PDF Report',
          description: 'Generate PDF',
          color: '#6366f1',
          action: () => {
            handleExportPDF();
            setActiveSheet(null);
            trackFeatureUse('export_pdf_mobile');
          }
        },
        {
          icon: FilePlus,
          label: 'New Genogram',
          description: 'Start fresh',
          color: '#ef4444',
          action: async () => {
            if (state.isDirty) {
              const shouldSave = window.confirm('Save changes before clearing?');
              if (shouldSave) {
                const saved = await handleSave();
                if (!saved) return;
              }
            }
            actions.newGenogram();
            setActiveSheet(null);
          }
        }
      ]
    },
    more: {
      title: 'More Options',
      items: [
        {
          icon: Undo,
          label: 'Undo',
          description: 'Undo last action',
          color: '#6b7280',
          disabled: historyIndex <= 0,
          action: () => {
            actions.undo();
            setActiveSheet(null);
          }
        },
        {
          icon: Redo,
          label: 'Redo',
          description: 'Redo last action',
          color: '#6b7280',
          disabled: historyIndex >= history.length - 1,
          action: () => {
            actions.redo();
            setActiveSheet(null);
          }
        }
      ]
    }
  };

  // Render child options modal (mobile bottom sheet style)
  const renderChildOptionsModal = () => {
    if (!showChildOptions || !state.selectedPerson) return null;
    
    const partnerRelationships = getPartnerRelationships(state.selectedPerson.id);
    
    return (
      <BottomSheet
        isOpen={showChildOptions}
        onClose={() => {
          setShowChildOptions(false);
        }}
        title="Add Child Options"
      >
        <div style={{ padding: '20px' }}>
          {partnerRelationships.length === 0 ? (
            <>
              <div style={{
                padding: '16px',
                backgroundColor: '#d1fae5',
                borderRadius: '12px',
                marginBottom: '20px',
                fontSize: '14px',
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
                    padding: '20px',
                    borderRadius: '16px',
                    border: 'none',
                    backgroundColor: '#f9fafb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#374151',
                    textAlign: 'left'
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <HelpCircle size={24} color="#6b7280" />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600' }}>Unknown Co-parent + Child</div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
                      Creates unknown parent and adds a child
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    createSpouse();
                    setShowChildOptions(false);
                  }}
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: 'none',
                    backgroundColor: '#f9fafb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#374151',
                    textAlign: 'left'
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#ede9fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <UserPlus size={24} color="#6366f1" />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600' }}>New Partner</div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
                      Create a new partner to have children with
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    startConnectionFromPerson('partner');
                    setShowChildOptions(false);
                  }}
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: 'none',
                    backgroundColor: '#f9fafb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#374151',
                    textAlign: 'left'
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#ede9fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Link2 size={24} color="#8b5cf6" />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600' }}>Connect to Existing</div>
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
                    padding: '20px',
                    borderRadius: '16px',
                    border: 'none',
                    backgroundColor: '#f9fafb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#374151',
                    textAlign: 'left'
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Heart size={24} color="#06b6d4" />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600' }}>Single Parent Adoption</div>
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
                        padding: '20px',
                        borderRadius: '16px',
                        border: 'none',
                        backgroundColor: '#f9fafb',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '500',
                        color: '#374151',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: '#fee2e2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Heart size={24} color={rel.color || '#ec4899'} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '600' }}>
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
                    padding: '20px',
                    borderRadius: '16px',
                    border: 'none',
                    backgroundColor: '#f9fafb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#374151',
                    textAlign: 'left'
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <HelpCircle size={24} color="#6b7280" />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600' }}>Add Another Unknown Co-parent</div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
                      Child from a different relationship
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </BottomSheet>
    );
  };

  return (
    <>
      {/* Mobile Header */}
      <div style={{ 
        background: 'white', 
        borderBottom: '1px solid #e2e8f0', 
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '56px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px'
        }}>
          <img 
            src="/Genogram Logo Bug Only.png" 
            alt="Genogram Builder" 
            style={{ height: '32px', width: 'auto' }}
          />
          <div>
            <h1 style={{ 
              fontSize: '18px', 
              fontWeight: '700', 
              color: '#1e293b',
              margin: 0
            }}>
              Genogram
            </h1>
          </div>
        </div>
        
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ 
            fontSize: '14px', 
            color: '#64748b',
            display: 'flex',
            gap: '12px'
          }}>
            <span>{state.people.length} 👤</span>
            <span>{state.relationships.length} 💞</span>
          </div>
        </div>
      </div>

      {/* Main canvas area with touch handling */}
      <div 
        style={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          position: 'relative',
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          paddingTop: '56px' // Add padding to account for fixed header
        }}

        onContextMenu={(e) => e.preventDefault()}
      >
        <MobileCanvas />
        <ConnectionIndicator />
        <HouseholdDrawingIndicator />
      </div>
      
      {/* Bottom Navigation Bar */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '8px 0',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        zIndex: 55,
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)'
      }}>
        {mainNavItems.map(item => {
          const Icon = item.icon;
          const isActive = item.active || activeSheet === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                console.log('MobileToolbar: Executing main nav action for', item.label);
                try {
                  if (typeof item.action === 'function') {
                    item.action();
                  } else {
                    console.warn('MobileToolbar: Main nav action is not a function for', item.label);
                  }
                } catch (error) {
                  console.error('MobileToolbar: Error executing main nav action for', item.label, error);
                }
              }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px',
                border: 'none',
                background: 'none',
                color: isActive ? item.color : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{
                fontSize: '11px',
                fontWeight: isActive ? '600' : '400'
              }}>
                {item.label}
              </span>
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '20%',
                  right: '20%',
                  height: '2px',
                  backgroundColor: item.color,
                  borderRadius: '0 0 2px 2px'
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Sheets */}
      {activeSheet && sheetConfigs[activeSheet] && (
        <BottomSheet
          isOpen={true}
          onClose={() => setActiveSheet(null)}
          title={sheetConfigs[activeSheet].title}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {sheetConfigs[activeSheet].items.map((item, index) => {
              const Icon = item.icon;
              
              return (
                <button
                  key={index}
                  onClick={() => {
                    console.log('MobileToolbar: Executing action for', item.label);
                    try {
                      if (typeof item.action === 'function') {
                        item.action();
                      } else {
                        console.warn('MobileToolbar: Action is not a function for', item.label);
                      }
                    } catch (error) {
                      console.error('MobileToolbar: Error executing action for', item.label, error);
                    }
                  }}
                  disabled={item.disabled}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    backgroundColor: item.active ? `${item.color}15` : '#f9fafb',
                    border: item.active ? `2px solid ${item.color}` : '1px solid #e5e7eb',
                    borderRadius: '12px',
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                    opacity: item.disabled ? 0.5 : 1,
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                >
                  {Icon && (
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: `${item.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={24} color={item.color} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '4px'
                    }}>
                      {item.label}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#64748b'
                    }}>
                      {item.description}
                    </div>
                  </div>
                  {item.active && (
                    <div style={{
                      padding: '4px 8px',
                      backgroundColor: item.color,
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      Active
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </BottomSheet>
      )}
      
      {/* Radial Menu - now handled by MobileRadialMenu component in ModernGenogramApp.js */}
      
      {/* Child Options Modal */}
      {renderChildOptionsModal()}
      
      
      {/* Modals */}
      <MobileQuickAddModal />
      <QuickEditModal />
      <DeleteConfirmationModal />
      <NewPersonModal />
    </>
  );
};
export default MobileInterface;