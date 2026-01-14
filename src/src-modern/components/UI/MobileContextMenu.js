// src/src-modern/components/UI/MobileContextMenu.js
import React from 'react';
import { UserPlus, Link, Baby, Edit, Trash2, Copy, HelpCircle } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import { useChildActions } from '../../hooks/useChildActions';
import { usePersonActions } from '../../hooks/usePersonActions';
import BottomSheet from '../EditPanels/BottomSheet';

const MobileContextMenu = ({ onEditClick }) => {
  const { state, actions } = useGenogram();
  const { contextMenu } = state;
  const [showSubmenu, setShowSubmenu] = React.useState(null);
  
  // Use smart child creation hooks
  const { 
    getPartnerRelationships,
    selectPartnerRelationship,
    createChildWithUnknownParent,
    createSingleParentAdoption
  } = useChildActions();
  
  const { 
    createSpouseAndChild,
    startConnectionFromPerson 
  } = usePersonActions();
  
  const handleClose = () => {
    actions.setContextMenu(null);
  };

  // Handle escape key to close the menu
  React.useEffect(() => {
    if (!contextMenu) {
      return undefined;
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showSubmenu) {
          setShowSubmenu(null);
        } else {
          handleClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [contextMenu, showSubmenu, handleClose]);

  if (!contextMenu) return null;

  const handleAction = (callback) => {
    console.log('MobileContextMenu: Executing action', callback);
    try {
      if (typeof callback === 'function') {
        callback();
      } else {
        console.warn('MobileContextMenu: Callback is not a function', callback);
      }
    } catch (error) {
      console.error('MobileContextMenu: Error executing action', error);
    }
    handleClose();
  };

  // Smart child creation logic
  const handleAddChild = (person) => {
    console.log('=== MOBILE ADD CHILD ===');
    if (!person) return;
    
    const partnerRelationships = getPartnerRelationships(person.id);
    console.log('Partner relationships found:', partnerRelationships.length);
    
    if (partnerRelationships.length === 0) {
      // No partners - show options
      console.log('No partners - showing options');
      setShowSubmenu({
        label: 'Add Child Options',
        submenu: [
          {
            label: 'Unknown Co-parent + Child',
            description: 'Creates unknown parent and adds a child',
            icon: HelpCircle,
            onClick: () => createChildWithUnknownParent(person)
          },
          {
            label: 'New Partner + Child',
            description: 'Creates new partner and their child together',
            icon: UserPlus,
            onClick: () => createSpouseAndChild(person)
          },
          {
            label: 'Connect to Existing',
            description: 'Link to someone already in the diagram',
            icon: Link,
            onClick: () => startConnectionFromPerson('partner')
          },
          {
            label: 'Single Parent Adoption + Child',
            description: 'Creates adopted child instantly',
            icon: Baby,
            onClick: () => createSingleParentAdoption(person)
          }
        ]
      });
    } else if (partnerRelationships.length === 1) {
      // One partner - directly create child
      console.log('One partner - directly creating child');
      selectPartnerRelationship(partnerRelationships[0], person);
    } else {
      // Multiple partners - show selection
      console.log('Multiple partners - showing selection');
      const partnerOptions = partnerRelationships.map(rel => {
        const partner = state.people.find(p => 
          p.id === (rel.from === person.id ? rel.to : rel.from)
        );
        
        return {
          label: `${rel.type.charAt(0).toUpperCase() + rel.type.slice(1)} with ${partner?.name || 'Unknown'}`,
          description: rel.startDate ? `Since ${new Date(rel.startDate).getFullYear()}` : '',
          icon: Baby,
          onClick: () => selectPartnerRelationship(rel, person)
        };
      });
      
      // Add option for additional unknown parent
      partnerOptions.push({
        label: 'Add Another Unknown Co-parent',
        description: 'Child from a different relationship',
        icon: HelpCircle,
        onClick: () => createChildWithUnknownParent(person)
      });
      
      setShowSubmenu({
        label: 'Select Partner',
        submenu: partnerOptions
      });
    }
  };

  // Canvas context menu options
  const canvasOptions = [
    {
      icon: UserPlus,
      label: 'Add Person/Resource Here',
      onClick: () => {
        actions.setNextPersonPosition({
          x: contextMenu.canvasX,
          y: contextMenu.canvasY
        });
        actions.setQuickAddOpen(true);
      }
    }
  ];

  // Person context menu options
  const personOptions = [
    {
      icon: Link,
      label: 'Start Relationship',
      onClick: () => {
        actions.startConnection(contextMenu.person.id, null, 'marriage');
      }
    },
    {
      icon: Baby,
      label: 'Add Child',
      onClick: () => {
        handleAddChild(contextMenu.person);
      }
    },
    {
      icon: Edit,
      label: 'Edit Person',
      onClick: () => {
        if (onEditClick) {
          onEditClick();
        }
      }
    },
    {
      icon: Copy,
      label: 'Duplicate',
      onClick: () => {
        const newPerson = {
          ...contextMenu.person,
          id: Date.now().toString(),
          x: contextMenu.person.x + 80,
          y: contextMenu.person.y + 80,
          name: `${contextMenu.person.name} (Copy)`
        };
        delete newPerson.relationships;
        actions.addPerson(newPerson);
      }
    },
    {
      icon: Trash2,
      label: 'Delete',
      color: '#ef4444',
      onClick: () => {
        actions.setDeleteConfirmation({
          type: 'person',
          title: 'Delete Person',
          message: `Delete ${contextMenu.person.name}? This will also remove all their relationships.`,
          onConfirm: () => {
            actions.deletePerson(contextMenu.person.id);
            actions.setDeleteConfirmation(null);
          },
          onCancel: () => actions.setDeleteConfirmation(null)
        });
      }
    }
  ];

  // Relationship context menu options
  const relationshipOptions = [
    {
      icon: Baby,
      label: 'Add Child',
      onClick: () => {
        actions.addChildToRelationship(contextMenu.relationship.id);
      },
      disabled: contextMenu.relationship?.type === 'child'
    },
    {
      icon: Edit,
      label: 'Edit Relationship',
      onClick: () => {
        if (onEditClick) {
          onEditClick();
        }
      }
    },
    {
      icon: Trash2,
      label: 'Delete',
      color: '#ef4444',
      onClick: () => {
        actions.setDeleteConfirmation({
          type: 'relationship',
          title: 'Delete Relationship',
          message: `Delete this ${contextMenu.relationship.type} relationship?`,
          onConfirm: () => {
            actions.deleteRelationship(contextMenu.relationship.id);
            actions.setDeleteConfirmation(null);
          },
          onCancel: () => actions.setDeleteConfirmation(null)
        });
      }
    }
  ];

  // Household context menu options
  const householdOptions = [
    {
      icon: Edit,
      label: 'Edit Household',
      onClick: () => {
        if (onEditClick) {
          onEditClick();
        }
      }
    },
    {
      icon: UserPlus,
      label: 'Add Member',
      onClick: () => {
        // Implementation for adding member to household
        console.log('Add member to household');
      }
    },
    {
      icon: Trash2,
      label: 'Delete',
      color: '#ef4444',
      onClick: () => {
        actions.setDeleteConfirmation({
          type: 'household',
          title: 'Delete Household',
          message: `Delete ${contextMenu.household?.name || 'this household'}?`,
          onConfirm: () => {
            actions.deleteHousehold(contextMenu.household.id);
            actions.setDeleteConfirmation(null);
            
            // Save to history after household deletion
            actions.saveToHistory({
              people: state.people,
              relationships: state.relationships,
              households: state.households.filter(h => h.id !== contextMenu.household.id),
              textBoxes: state.textBoxes
            });
          },
          onCancel: () => actions.setDeleteConfirmation(null)
        });
      }
    }
  ];

  // TextBox context menu options
  const textBoxOptions = [
    {
      icon: Edit,
      label: 'Edit Text',
      onClick: () => {
        if (onEditClick) {
          onEditClick();
        }
      }
    },
    {
      icon: Copy,
      label: 'Duplicate',
      onClick: () => {
        const newTextBox = {
          ...contextMenu.textBox,
          id: Date.now().toString(),
          x: contextMenu.textBox.x + 20,
          y: contextMenu.textBox.y + 20
        };
        actions.addTextBox(newTextBox);
        actions.selectTextBox({ textBox: newTextBox, openPanel: true });
      }
    },
    {
      icon: Trash2,
      label: 'Delete',
      color: '#ef4444',
      onClick: () => {
        actions.setDeleteConfirmation({
          type: 'textBox',
          title: 'Delete Text',
          message: 'Delete this text box?',
          onConfirm: () => {
            actions.deleteTextBox(contextMenu.textBox.id);
            actions.setDeleteConfirmation(null);
          },
          onCancel: () => actions.setDeleteConfirmation(null)
        });
      }
    }
  ];

  // Get options based on context type
  let options = [];
  let title = 'Options';
  
  switch (contextMenu.type) {
    case 'canvas':
      options = canvasOptions;
      title = 'Canvas Options';
      break;
    case 'person':
      options = personOptions;
      title = contextMenu.person.name;
      break;
    case 'relationship':
      options = relationshipOptions;
      title = 'Relationship Options';
      break;
    case 'household':
      options = householdOptions;
      title = contextMenu.household?.name || 'Household Options';
      break;
    case 'textBox':
      options = textBoxOptions;
      title = 'Text Options';
      break;
    default:
      break;
  }

  // Check if any option has submenu
  const hasSubmenu = options.some(opt => opt.submenu);

  if (showSubmenu) {
    return (
      <BottomSheet
        isOpen={true}
        onClose={() => setShowSubmenu(null)}
        title={showSubmenu.label}
        height="auto"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {showSubmenu.submenu.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                console.log('MobileContextMenu: Executing submenu action for', item.label);
                handleAction(item.onClick);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '18px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#374151',
                textAlign: 'left',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
            >
              {item.icon && <item.icon size={20} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '16px' }}>
                  {item.label}
                </div>
                {item.description && (
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
                    {item.description}
                  </div>
                )}
              </div>
            </button>
          ))}
          <button
            onClick={() => setShowSubmenu(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#f9fafb',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#6b7280',
              marginTop: '8px'
            }}
          >
            Back
          </button>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet
      isOpen={true}
      onClose={handleClose}
      title={title}
      height="auto"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => {
              if (option.submenu) {
                setShowSubmenu(option);
              } else {
                handleAction(option.onClick);
              }
            }}
            disabled={option.disabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: option.disabled ? 'not-allowed' : 'pointer',
              opacity: option.disabled ? 0.5 : 1,
              fontSize: '16px',
              color: option.color || '#374151',
              textAlign: 'left',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => !option.disabled && (e.currentTarget.style.backgroundColor = '#f9fafb')}
            onMouseLeave={(e) => !option.disabled && (e.currentTarget.style.backgroundColor = 'white')}
          >
            <option.icon size={20} />
            <span style={{ flex: 1 }}>{option.label}</span>
            {option.submenu && (
              <span style={{ color: '#9ca3af' }}>›</span>
            )}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
};

export default MobileContextMenu;