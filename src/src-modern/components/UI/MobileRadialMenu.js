// MobileRadialMenu.js - Radial menu component for mobile interface
import React, { useState, useEffect } from 'react';
import { useGenogram } from '../../contexts/GenogramContext';
import { useChildActions } from '../../hooks/useChildActions';
import { usePersonActions } from '../../hooks/usePersonActions';
import { useResponsive } from '../../utils/responsive';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { 
  Plus, 
  Users, 
  Type, 
  Home, 
  Trash2, 
  Pencil,
  Copy,
  Heart,
  Baby,
  UserX,
  Info,
  Calendar,
  FileText,
  Stethoscope,
  Globe,
  HelpCircle,
  UserPlus,
  Link2
} from 'lucide-react';

const MobileRadialMenu = () => {
  const { state, actions } = useGenogram();
  const { breakpoint } = useResponsive();
  const { isMobile, isTouch, isPrimaryTouch } = useDeviceDetection();
  const [radialMenu, setRadialMenu] = useState({ visible: false, x: 0, y: 0, type: null, item: null });
  const [childOptionsMenu, setChildOptionsMenu] = useState({ visible: false, x: 0, y: 0, person: null, type: null, relationships: [] });
  const [submenuJustOpened, setSubmenuJustOpened] = useState(false);
  
  // Wrapper for setChildOptionsMenu with backdrop click prevention
  const setChildOptionsMenuWithDebug = (newState) => {
    if (typeof newState === 'function') {
      setChildOptionsMenu(prevState => {
        const result = newState(prevState);
        return result;
      });
    } else {
      setChildOptionsMenu(newState);
      // If opening the menu, set a flag to prevent immediate backdrop clicks
      if (newState.visible === true) {
        setSubmenuJustOpened(true);
        setTimeout(() => {
          setSubmenuJustOpened(false);
        }, 300); // Prevent backdrop clicks for 300ms after opening
      }
    }
  };
  
  // Use smart child creation hooks
  const { 
    getPartnerRelationships,
    selectPartnerRelationship,
    createChildWithUnknownParent,
    createSingleParentAdoption
  } = useChildActions();
  
  // Use person actions for sophisticated child creation
  const { 
    createSpouseAndChild,
    startConnectionFromPerson 
  } = usePersonActions();
  
  // Listen for context menu changes - only handle on actual mobile devices
  useEffect(() => {
    // Only handle context menu on actual mobile devices with touch as primary input
    // Desktop devices with small screens should use traditional context menu
    if (state.contextMenu && (isMobile || isPrimaryTouch)) {
      // Show radial menu when context menu is set
      setRadialMenu({
        visible: true,
        x: state.contextMenu.x,
        y: state.contextMenu.y,
        type: state.contextMenu.type,
        item: state.contextMenu.person || state.contextMenu
      });
      
      // Clear the context menu from state to avoid conflicts
      actions.setContextMenu(null);
    }
  }, [state.contextMenu, actions, isMobile, isPrimaryTouch]);

  // Smart child creation logic for radial menu - matches desktop sophistication
  const handleAddChild = (person) => {
    if (!person) return;
    
    const partnerRelationships = getPartnerRelationships(person.id);
    
    if (partnerRelationships.length === 0) {
      // No partners - show sophisticated options like desktop
      setRadialMenu({ visible: false });
      
      // Show child options submenu with slight delay to avoid event conflicts
      setTimeout(() => {
        setChildOptionsMenuWithDebug({
          visible: true,
          x: radialMenu.x,
          y: radialMenu.y,
          person: person,
          type: 'no-partners'
        });
      }, 100);
    } else if (partnerRelationships.length === 1) {
      // One partner - directly create child with that partner
      selectPartnerRelationship(partnerRelationships[0], person);
      setRadialMenu({ visible: false });
    } else {
      // Multiple partners - show selection submenu like desktop
      setRadialMenu({ visible: false });
      
      // Show partner selection submenu with slight delay to avoid event conflicts
      setTimeout(() => {
        setChildOptionsMenuWithDebug({
          visible: true,
          x: radialMenu.x,
          y: radialMenu.y,
          person: person,
          type: 'multiple-partners',
          relationships: partnerRelationships
        });
      }, 100);
    }
  };

  // Radial menu actions
  const getRadialMenuItems = () => {
    if (radialMenu.type === 'person' && radialMenu.item) {
      return [
        {
          icon: Pencil,
          label: 'Edit',
          onClick: () => {
            actions.setEditingPerson(radialMenu.item);
            setRadialMenu({ visible: false });
          }
        },
        {
          icon: Heart,
          label: 'Partner',
          onClick: () => {
            // Start connection mode with marriage as default, then auto-open edit panel
            actions.startConnection(radialMenu.item.id, null, 'marriage');
            setRadialMenu({ visible: false });
          }
        },
        {
          icon: Baby,
          label: 'Child',
          onClick: (e) => {
            if (e && e.stopPropagation) {
              e.stopPropagation(); // Stop event from bubbling
            }
            try {
              handleAddChild(radialMenu.item);
            } catch (error) {
              console.error('Error in handleAddChild, using fallback:', error);
              // Fallback: just create a child with unknown parent
              createChildWithUnknownParent(radialMenu.item);
              setRadialMenu({ visible: false });
            }
          }
        },
        {
          icon: Users,
          label: 'Sibling',
          onClick: () => {
            const siblingX = radialMenu.item.x + 100;
            const siblingY = radialMenu.item.y;
            
            const siblingPerson = {
              id: `person_${Date.now()}`,
              name: 'Sibling',
              gender: 'unknown',
              birthDate: '',
              deathDate: '',
              isDeceased: false,
              deceasedSymbol: 'halo',
              deceasedGentleTreatment: 'none',
              x: siblingX,
              y: siblingY,
              info: {},
              color: null,
              image: null,
              networkMember: false
            };
            
            actions.addPerson(siblingPerson);
            
            // Find parents of selected person
            const parentRels = state.relationships.filter(
              r => r.type === 'parent' && r.to === radialMenu.item.id
            );
            
            // Add parent relationships to sibling
            parentRels.forEach(rel => {
              actions.addRelationship({
                id: `rel_${Date.now()}_${rel.from}`,
                from: rel.from,
                to: siblingPerson.id,
                type: 'parent'
              });
            });
            
            setRadialMenu({ visible: false });
          }
        },
        {
          icon: Copy,
          label: 'Copy',
          onClick: () => {
            const duplicated = {
              ...radialMenu.item,
              id: `person_${Date.now()}`,
              x: radialMenu.item.x + 80,
              y: radialMenu.item.y + 80
            };
            actions.addPerson(duplicated);
            setRadialMenu({ visible: false });
          }
        },
        {
          icon: Globe,
          label: radialMenu.item.networkMember ? 'Remove Network' : 'Add Network',
          onClick: () => {
            actions.updatePerson(radialMenu.item.id, { 
              networkMember: !radialMenu.item.networkMember 
            });
            setRadialMenu({ visible: false });
          }
        },
        {
          icon: Trash2,
          label: 'Delete',
          onClick: () => {
            if (window.confirm(`Delete ${radialMenu.item.name}?`)) {
              actions.deletePerson(radialMenu.item.id);
              setRadialMenu({ visible: false });
            }
          },
          danger: true
        }
      ];
    } else {
      // Canvas menu
      return [
        {
          icon: Plus,
          label: 'Person',
          onClick: () => {
            const rect = document.querySelector('svg').getBoundingClientRect();
            const canvasX = radialMenu.item?.canvasX || (radialMenu.x - rect.left - state.pan.x) / state.zoom;
            const canvasY = radialMenu.item?.canvasY || (radialMenu.y - rect.top - state.pan.y) / state.zoom;
            
            const newPerson = {
              id: `person_${Date.now()}`,
              name: 'New Person',
              gender: 'unknown',
              birthDate: '',
              deathDate: '',
              isDeceased: false,
              deceasedSymbol: 'halo',
              deceasedGentleTreatment: 'none',
              x: state.snapToGrid ? Math.round(canvasX / 20) * 20 : canvasX,
              y: state.snapToGrid ? Math.round(canvasY / 20) * 20 : canvasY,
              info: {},
              color: null,
              image: null,
              networkMember: false
            };
            
            actions.addPerson(newPerson);
            // Note: addPerson automatically selects the person and opens edit panel
            setRadialMenu({ visible: false });
          }
        },
        {
          icon: Type,
          label: 'Text',
          onClick: () => {
            const rect = document.querySelector('svg').getBoundingClientRect();
            const canvasX = radialMenu.item?.canvasX || (radialMenu.x - rect.left - state.pan.x) / state.zoom;
            const canvasY = radialMenu.item?.canvasY || (radialMenu.y - rect.top - state.pan.y) / state.zoom;
            
            const newTextBox = {
              id: `text_${Date.now()}`,
              html: 'New Text',
              x: state.snapToGrid ? Math.round(canvasX / 20) * 20 : canvasX,
              y: state.snapToGrid ? Math.round(canvasY / 20) * 20 : canvasY,
              width: 200,
              height: 60,
              fontSize: 16,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              color: '#1f2937'
            };
            
            actions.addTextBox(newTextBox);
            actions.selectTextBox({ textBox: newTextBox, openPanel: true });
            setRadialMenu({ visible: false });
          }
        },
        {
          icon: Home,
          label: 'Area',
          onClick: () => {
            actions.startDrawingHousehold();
            setRadialMenu({ visible: false });
          }
        }
      ];
    }
  };

  // Render radial menu
  const renderRadialMenu = () => {
    if (!radialMenu.visible) return null;
    
    const items = getRadialMenuItems();
    const itemCount = items.length;
    const radius = 80;
    const startAngle = -90; // Start from top
    const angleStep = 360 / itemCount;
    
    return (
      <>
        {/* Backdrop */}
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 999,
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setRadialMenu({ visible: false })}
          onTouchStart={(e) => {
            e.preventDefault();
            setRadialMenu({ visible: false });
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            setRadialMenu({ visible: false });
          }}
        />
        
        {/* Center point */}
        <div style={{
          position: 'fixed',
          left: radialMenu.x,
          top: radialMenu.y,
          width: 60,
          height: 60,
          marginLeft: -30,
          marginTop: -30,
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          color: 'white',
          fontSize: '12px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
          animation: 'scaleIn 0.3s ease-out'
        }}>
          {radialMenu.type === 'person' ? 'Person' : 'Menu'}
        </div>
        
        {/* Menu items */}
        {items.map((item, index) => {
          const angle = (startAngle + index * angleStep) * Math.PI / 180;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const Icon = item.icon;
          
          return (
            <div
              key={index}
              style={{
                position: 'fixed',
                left: radialMenu.x + x,
                top: radialMenu.y + y,
                width: 56,
                height: 56,
                marginLeft: -28,
                marginTop: -28,
                borderRadius: '50%',
                backgroundColor: item.danger ? '#ef4444' : 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                cursor: 'pointer',
                zIndex: 1001,
                transform: 'scale(0)',
                animation: `popIn 0.3s ${index * 0.05}s ease-out forwards`,
                WebkitTapHighlightColor: 'transparent'
              }}
              onClick={(e) => {
                e.stopPropagation();
                // Only handle click if it's not a touch event
                if (e.pointerType !== 'touch') {
                  item.onClick(e);
                }
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform = 'scale(0.9)';
                e.currentTarget.style.backgroundColor = item.danger ? '#dc2626' : '#f3f4f6';
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = item.danger ? '#ef4444' : 'white';
                e.preventDefault(); // Prevent synthetic click event
                setTimeout(() => {
                  item.onClick(e);
                }, 50);
              }}
            >
              <Icon 
                size={20} 
                color={item.danger ? 'white' : '#374151'} 
              />
              <span style={{
                fontSize: '9px',
                marginTop: '2px',
                color: item.danger ? 'white' : '#6b7280',
                fontWeight: '500',
                textAlign: 'center',
                lineHeight: 1
              }}>
                {item.label}
              </span>
            </div>
          );
        })}
        
        {/* Animation styles */}
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes scaleIn {
            from { 
              transform: scale(0);
              opacity: 0;
            }
            to { 
              transform: scale(1);
              opacity: 1;
            }
          }
          
          @keyframes popIn {
            from { 
              transform: scale(0);
              opacity: 0;
            }
            to { 
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
      </>
    );
  };

  // Render child options submenu
  const renderChildOptionsMenu = () => {
    if (!childOptionsMenu.visible) return null;
    
    let items = [];
    
    if (childOptionsMenu.type === 'no-partners') {
      // No partners - show sophisticated options like desktop
      items = [
        {
          icon: HelpCircle,
          label: 'Unknown Co-parent + Child',
          description: 'Creates unknown parent and adds a child',
          onClick: () => {
            createChildWithUnknownParent(childOptionsMenu.person);
            setChildOptionsMenuWithDebug({ visible: false });
          }
        },
        {
          icon: UserPlus,
          label: 'New Partner + Child',
          description: 'Creates new partner and their child together',
          onClick: () => {
            createSpouseAndChild(childOptionsMenu.person);
            setChildOptionsMenuWithDebug({ visible: false });
          }
        },
        {
          icon: Link2,
          label: 'Connect to Existing',
          description: 'Link to someone already in the diagram',
          onClick: () => {
            startConnectionFromPerson('partner');
            setChildOptionsMenu({ visible: false });
          }
        },
        {
          icon: Heart,
          label: 'Single Parent Adoption',
          description: 'Creates adopted child instantly',
          onClick: () => {
            createSingleParentAdoption(childOptionsMenu.person);
            setChildOptionsMenu({ visible: false });
          }
        }
      ];
    } else if (childOptionsMenu.type === 'multiple-partners') {
      // Multiple partners - show each partner relationship with partner name prominently
      items = childOptionsMenu.relationships.map(rel => {
        const partner = state.people.find(p => 
          p.id === (rel.from === childOptionsMenu.person.id ? rel.to : rel.from)
        );
        
        return {
          icon: Heart,
          label: `${partner?.name || 'Unknown'}`,
          description: `${rel.type.charAt(0).toUpperCase() + rel.type.slice(1)}${rel.startDate ? ` (Since ${new Date(rel.startDate).getFullYear()})` : ''}`,
          onClick: () => {
            selectPartnerRelationship(rel, childOptionsMenu.person);
            setChildOptionsMenu({ visible: false });
          }
        };
      });
      
      // Add option for additional unknown parent
      items.push({
        icon: HelpCircle,
        label: 'Add Another Unknown Co-parent',
        description: 'Child from a different relationship',
        onClick: () => {
          createChildWithUnknownParent(childOptionsMenu.person);
          setChildOptionsMenu({ visible: false });
        }
      });
    }
    
    const itemCount = items.length;
    const radius = 100; // Slightly larger radius for submenu
    const startAngle = -90; // Start from top
    const angleStep = 360 / itemCount;
    
    return (
      <>
        {/* Backdrop */}
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 999,
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (submenuJustOpened) {
              return;
            }
            setChildOptionsMenuWithDebug({ visible: false });
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            if (e.cancelable) {
              e.preventDefault();
            }
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            if (submenuJustOpened) {
              return;
            }
            setChildOptionsMenuWithDebug({ visible: false });
          }}
        />
        
        {/* Center point */}
        <div style={{
          position: 'fixed',
          left: childOptionsMenu.x,
          top: childOptionsMenu.y,
          width: 70,
          height: 70,
          marginLeft: -35,
          marginTop: -35,
          borderRadius: '50%',
          backgroundColor: '#10b981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          color: 'white',
          fontSize: '11px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
          animation: 'scaleIn 0.3s ease-out'
        }}>
          Add Child
        </div>
        
        {/* Menu items */}
        {items.map((item, index) => {
          const angle = (startAngle + index * angleStep) * Math.PI / 180;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          const Icon = item.icon;
          
          return (
            <div
              key={index}
              style={{
                position: 'fixed',
                left: childOptionsMenu.x + x,
                top: childOptionsMenu.y + y,
                width: 64,
                height: 64,
                marginLeft: -32,
                marginTop: -32,
                borderRadius: '50%',
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                cursor: 'pointer',
                zIndex: 1001,
                transform: 'scale(0)',
                animation: `popIn 0.3s ${index * 0.05}s ease-out forwards`,
                WebkitTapHighlightColor: 'transparent'
              }}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                e.currentTarget.style.transform = 'scale(0.9)';
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'white';
                setTimeout(() => {
                  item.onClick();
                }, 50);
              }}
            >
              <Icon 
                size={18} 
                color='#374151'
              />
              <span style={{
                fontSize: '8px',
                marginTop: '2px',
                color: '#6b7280',
                fontWeight: '500',
                textAlign: 'center',
                lineHeight: '1.1'
              }}>
                {item.label.split(' ')[0]}
              </span>
            </div>
          );
        })}
        
        {/* Close button */}
        <div
          style={{
            position: 'fixed',
            left: childOptionsMenu.x,
            top: childOptionsMenu.y - 140,
            width: 40,
            height: 40,
            marginLeft: -20,
            marginTop: -20,
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
            cursor: 'pointer',
            zIndex: 1001,
            animation: 'scaleIn 0.3s 0.2s ease-out backwards',
            WebkitTapHighlightColor: 'transparent'
          }}
          onClick={(e) => {
            e.stopPropagation();
            setChildOptionsMenuWithDebug({ visible: false });
          }}
        >
          <UserX size={16} color="white" />
        </div>
        
                 <style>{`
           @keyframes fadeIn {
             from { opacity: 0; }
             to { opacity: 1; }
           }
           
           @keyframes scaleIn {
             from { transform: scale(0); opacity: 0; }
             to { transform: scale(1); opacity: 1; }
           }
           
           @keyframes popIn {
             from { transform: scale(0); opacity: 0; }
             to { transform: scale(1); opacity: 1; }
           }
         `}</style>
      </>
    );
  };

  return (
    <>
      {renderRadialMenu()}
      {renderChildOptionsMenu()}
    </>
  );
};

export default MobileRadialMenu;