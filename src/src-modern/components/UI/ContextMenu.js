// src/components/UI/ContextMenu.js
import React, { useEffect, useState, useRef } from 'react';
import { 
  Heart, Users, X, Link2, UserCheck, Plus, 
  Edit3, Trash2, Baby, Type, Sparkles, Maximize2,
  HelpCircle, UserPlus, UserX, CheckSquare, Tag, Copy, Clipboard,
  ArrowUp, ArrowDown
} from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import { usePersonActions } from '../../hooks/usePersonActions';
import { useCanvasOperations } from '../../hooks/useCanvasOperations';
import { useChildActions } from '../../hooks/useChildActions';

const GRID_SIZE = 20;

const ContextMenu = () => {
  const { state, actions } = useGenogram();
  const { contextMenu, snapToGrid } = state;
  const [showChildOptions, setShowChildOptions] = useState(false);
  const menuRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  
  // Grid snapping function
  const snapToGridFunc = (value) => {
    if (!snapToGrid) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };
  
  const { 
    createSpouse, 
    createSpouseAndChild,
    createParents, 
    createChild,
    startConnectionFromPerson,
    disconnectChildFromParents
  } = usePersonActions();
  const { autoArrange, fitToCanvas } = useCanvasOperations();
  const {
    getPartnerRelationships,
    createChildWithUnknownParent,
    createSingleParentAdoption,
    selectPartnerRelationship
  } = useChildActions();

  // Close menu on click outside
  useEffect(() => {
    if (contextMenu) {
      const handleMouseDown = (e) => {
        
        // Ignore the right-click that opened the menu
        if (e.button === 2) return;
        
        // Check if the click is inside the context menu or bulk edit panel
        const menuElement = e.target.closest('[data-context-menu="true"]');
        const bulkEditElement = e.target.closest('[data-bulk-edit-panel="true"]');
        if (menuElement || bulkEditElement) {
          return;
        }
        
        actions.setContextMenu(null);
      };
      
      // Add a small delay to prevent the opening click from immediately closing the menu
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleMouseDown);
      }, 10);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleMouseDown);
      };
    }
  }, [contextMenu, actions]);

  // Reset child options when context menu changes or closes
  useEffect(() => {
    if (!contextMenu || contextMenu.type !== 'person') {
      setShowChildOptions(false);
    }
  }, [contextMenu]);

  // Calculate menu position to keep it in viewport
  useEffect(() => {
    if (contextMenu && menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let x = contextMenu.x;
      let y = contextMenu.y;
      
      // Adjust horizontal position if would overflow right
      if (x + menuRect.width > viewportWidth - 10) {
        x = Math.max(10, viewportWidth - menuRect.width - 10);
      }
      
      // Adjust vertical position if would overflow bottom
      if (y + menuRect.height > viewportHeight - 10) {
        y = Math.max(10, viewportHeight - menuRect.height - 10);
      }
      
      setMenuPosition({ x, y });
    } else if (contextMenu) {
      // Initial position before measurement
      setMenuPosition({ x: contextMenu.x, y: contextMenu.y });
    }
  }, [contextMenu, showChildOptions]); // Re-calculate when child options expand/collapse

  if (!contextMenu) return null;

  const menuStyle = {
    position: 'fixed',
    left: menuPosition.x,
    top: menuPosition.y,
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
    padding: '6px',
    zIndex: 1000,
    width: 'clamp(180px, 16vw, 240px)', // Responsive width: 16% of viewport, min 180px, max 240px
    maxHeight: '65vh',
    overflowY: 'auto'
  };

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#374151',
    textAlign: 'left',
    width: '100%'
  };

  const dividerStyle = {
    height: '1px',
    backgroundColor: '#e2e8f0',
    margin: '6px 0'
  };

  const sectionTitleStyle = {
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const renderPersonMenu = () => {
    const person = contextMenu.person;
    const hasParents = state.relationships.some(r => r.type === 'child' && r.to === person.id);
    const partnerRelationships = getPartnerRelationships(person.id);

    const handleAddChild = () => {
      if (partnerRelationships.length === 0) {
        // No partners - show options
        setShowChildOptions(true);
      } else if (partnerRelationships.length === 1) {
        // One partner - directly create child with that partner
        selectPartnerRelationship(partnerRelationships[0], person);
        actions.setContextMenu(null);
      } else {
        // Multiple partners - show selection options
        setShowChildOptions(true);
      }
    };

    const handleChildOption = (optionType, relationship = null) => {
      switch (optionType) {
        case 'unknown':
          createChildWithUnknownParent(person);
          break;
        case 'newPartner':
          // Create spouse and child in one atomic operation
          createSpouseAndChild(person);
          break;
        case 'connectExisting':
          startConnectionFromPerson('partner');
          break;
        case 'singleAdoption':
          createSingleParentAdoption(person);
          break;
        case 'selectPartner':
          selectPartnerRelationship(relationship, person);
          break;
        default:
          break;
      }
      actions.setContextMenu(null);
    };

    return (
      <>
        <div style={{ padding: '6px 10px', borderBottom: '1px solid #f1f5f9', marginBottom: '6px' }}>
          <strong style={{ fontSize: '13px', color: '#1e293b' }}>{person.name}</strong>
        </div>

        <button
          onClick={() => {
            createSpouse();
            actions.setContextMenu(null);
          }}
          style={buttonStyle}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          <Heart size={16} />
          Add Spouse/Partner
        </button>

        <button
          onClick={() => {
            actions.updatePerson(person.id, { networkMember: !person.networkMember });
            actions.setContextMenu(null);
          }}
          style={buttonStyle}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          <UserCheck size={16} />
          {person.networkMember ? 'Remove from Network' : 'Add to Network'}
        </button>
        
        <button
          onClick={() => {
            actions.copyToClipboard('person', person);
            actions.setContextMenu(null);
          }}
          style={buttonStyle}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          <Copy size={16} />
          Copy Person
        </button>
        
        {/* Smart Add Child Button */}
        {!showChildOptions ? (
          <button
            onClick={handleAddChild}
            style={buttonStyle}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
          >
            <Baby size={16} />
            Add Child
            {partnerRelationships.length > 1 && (
              <span style={{
                marginLeft: 'auto',
                backgroundColor: '#6366f1',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600'
              }}>
                {partnerRelationships.length}
              </span>
            )}
          </button>
        ) : (
          <>
            {/* Back button */}
            <button
              onClick={() => setShowChildOptions(false)}
              style={{ ...buttonStyle, color: '#6b7280' }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
            >
              <X size={16} />
              Back to Main Menu
            </button>
            
            <div style={dividerStyle} />
            
            {partnerRelationships.length === 0 ? (
              <>
                <div style={{ ...sectionTitleStyle, backgroundColor: '#d1fae5', color: '#10b981' }}>
                  ✨ One-click: Creates partner + child instantly!
                </div>
                
                <button
                  onClick={() => handleChildOption('unknown')}
                  style={buttonStyle}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                >
                  <HelpCircle size={16} />
                  <div style={{ textAlign: 'left' }}>
                    <div>Unknown Co-parent + Child</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Creates unknown parent and adds a child</div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleChildOption('newPartner')}
                  style={buttonStyle}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                >
                  <UserPlus size={16} />
                  <div style={{ textAlign: 'left' }}>
                    <div>New Partner + Child</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Creates new partner and their child together</div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleChildOption('connectExisting')}
                  style={buttonStyle}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                >
                  <Link2 size={16} />
                  <div style={{ textAlign: 'left' }}>
                    <div>Connect to Existing</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Link to someone already in the diagram</div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleChildOption('singleAdoption')}
                  style={buttonStyle}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                >
                  <Heart size={16} />
                  <div style={{ textAlign: 'left' }}>
                    <div>Single Parent Adoption + Child</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Creates adopted child instantly</div>
                  </div>
                </button>
              </>
            ) : (
              <>
                <div style={sectionTitleStyle}>
                  Select which relationship to add a child to:
                </div>
                
                {partnerRelationships.map(rel => {
                  const partner = state.people.find(p => 
                    p.id === (rel.from === person.id ? rel.to : rel.from)
                  );
                  
                  return (
                    <button
                      key={rel.id}
                      onClick={() => handleChildOption('selectPartner', rel)}
                      style={buttonStyle}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                    >
                      <Heart size={16} style={{ color: rel.color || '#6366f1' }} />
                      <div style={{ textAlign: 'left' }}>
                        <div>{rel.type.charAt(0).toUpperCase() + rel.type.slice(1)} with {partner?.name || 'Unknown'}</div>
                        {rel.startDate && (
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>
                            Since {new Date(rel.startDate).getFullYear()}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
                
                <div style={{ ...dividerStyle, fontSize: '11px' }}>Or create a new relationship:</div>
                
                <button
                  onClick={() => handleChildOption('unknown')}
                  style={buttonStyle}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                >
                  <HelpCircle size={16} />
                  <div style={{ textAlign: 'left' }}>
                    <div>Add Another Unknown Co-parent</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Child from a different relationship</div>
                  </div>
                </button>
              </>
            )}
          </>
        )}
        
        {!hasParents && (
          <>
            <button
              onClick={() => {
                createParents();
                actions.setContextMenu(null);
              }}
              style={buttonStyle}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
            >
              <Users size={16} />
              Create Parents
            </button>

            <button
              onClick={() => {
                startConnectionFromPerson('child');
                actions.setContextMenu(null);
              }}
              style={buttonStyle}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
            >
              <Link2 size={16} />
              Connect to Parents
            </button>
          </>
        )}

        {hasParents && (
          <button
            onClick={() => {
              disconnectChildFromParents();
              actions.setContextMenu(null);
            }}
            style={{ ...buttonStyle, color: '#f59e0b' }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#fef3c7')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
          >
            <UserX size={16} />
            Disconnect from Parents
          </button>
        )}

        <div style={dividerStyle} />

        <div style={sectionTitleStyle}>Create Relationship</div>

        {/* Relationship types grouped by category */}
        {[
          { group: '💕 Romantic', types: ['marriage', 'engagement', 'partner', 'cohabitation', 'dating'] },
          { group: '💔 Ended', types: ['separation', 'divorce', 'widowed'] },
          { group: '👨‍👩‍👧‍👦 Family', types: ['sibling', 'adoption', 'step-relationship'] },
          { group: '💚 Positive', types: ['harmony', 'close', 'best-friends', 'love'] },
          { group: '⚠️ Negative', types: ['distant', 'conflict', 'hostile', 'cutoff'] },
          { group: '🎯 Focused', types: ['focused-on', 'focused-on-negatively'] },
          { group: '🚨 Abuse/Violence', types: ['abuse', 'physical-abuse', 'emotional-abuse', 'neglect'] }
        ].map(category => (
          <React.Fragment key={category.group}>
            <div style={{ ...sectionTitleStyle, backgroundColor: '#f8fafc', marginTop: '8px' }}>
              {category.group}
            </div>
            {category.types.map(type => (
              <button
                key={type}
                onClick={() => {
                  startConnectionFromPerson(type);
                  actions.setContextMenu(null);
                }}
                style={buttonStyle}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
              >
                {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
              </button>
            ))}
          </React.Fragment>
        ))}

        {/* Quick Tags Section */}
        {state.tagDefinitions.length > 0 && (
          <>
            <div style={dividerStyle} />
            <div style={sectionTitleStyle}>🏷️ Quick Tags</div>
            {state.tagDefinitions.slice(0, 5).map(tag => {
              const personHasTag = person.tags && person.tags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => {
                    if (personHasTag) {
                      actions.removeTagFromPerson(person.id, tag.id);
                    } else {
                      actions.addTagToPerson(person.id, tag.id);
                    }
                    actions.setContextMenu(null);
                  }}
                  style={{
                    ...buttonStyle,
                    backgroundColor: personHasTag ? `${tag.color}20` : 'transparent',
                    borderLeft: personHasTag ? `3px solid ${tag.color}` : '3px solid transparent'
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = personHasTag ? `${tag.color}30` : '#f8fafc')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = personHasTag ? `${tag.color}20` : 'transparent')}
                >
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: tag.color,
                    marginRight: '2px'
                  }} />
                  {personHasTag ? '✓ ' : ''}{tag.name}
                </button>
              );
            })}
            {state.tagDefinitions.length > 5 && (
              <div style={{ fontSize: '11px', color: '#6b7280', padding: '4px 10px' }}>
                +{state.tagDefinitions.length - 5} more in Edit panel
              </div>
            )}
          </>
        )}

        <div style={dividerStyle} />

        <button
          onClick={() => {
            // Force selection for editing even in network toggle mode
            actions.selectPerson(person, true);
            actions.setContextMenu(null);
          }}
          style={buttonStyle}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          <Edit3 size={16} />
          Edit Person
        </button>

        <button
          onClick={() => {
            actions.setDeleteConfirmation({
              type: 'person',
              title: 'Delete Person',
              message: `Are you sure you want to delete "${person.name}"?`,
              onConfirm: () => {
                actions.deletePerson(person.id);
                actions.setDeleteConfirmation(null);
              },
              onCancel: () => actions.setDeleteConfirmation(null)
            });
            actions.setContextMenu(null);
          }}
          style={{ ...buttonStyle, color: '#dc2626' }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#fee2e2')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          <Trash2 size={16} />
          Delete Person
        </button>
      </>
    );
  };

  const renderRelationshipMenu = () => {
    const relationship = contextMenu.relationship;
    const PARENT_RELATIONSHIP_TYPES = [
      // Romantic relationships
      'marriage', 'partner', 'cohabitation', 'engagement', 'dating', 'love-affair', 'secret-affair', 'single-encounter',
      // Ended relationships (they can still have children from when they were together)
      'divorce', 'separation', 'nullity', 'widowed',
      // Complex dynamics (can still have children)
      'complicated', 'on-off', 'toxic', 'dependency', 'codependent',
      // Special family relationships
      'adoption', 'step-relationship',
      // Emotional relationships that might have children
      'close', 'love', 'best-friends',
      // Social services relationships
      'caregiver', 'supportive'
    ];
    
    const isParentRelationship = PARENT_RELATIONSHIP_TYPES.includes(relationship.type);

    return (
      <>
        {isParentRelationship && (
          <>
            <button
              onClick={() => {
                createChild(relationship.id);
                actions.setContextMenu(null);
              }}
              style={buttonStyle}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
            >
              <Baby size={16} />
              Create Child
            </button>

            <button
              onClick={() => {
                actions.startConnection(null, relationship.id, 'child');
                actions.setContextMenu(null);
              }}
              style={buttonStyle}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
            >
              <Link2 size={16} />
              Connect Child
            </button>

            <div style={dividerStyle} />
          </>
        )}

        <button
          onClick={() => {
            actions.selectRelationship(relationship);
            actions.setContextMenu(null);
          }}
          style={buttonStyle}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          <Edit3 size={16} />
          Edit Relationship
        </button>

        <button
          onClick={() => {
            actions.setDeleteConfirmation({
              type: 'relationship',
              title: 'Delete Relationship',
              message: `Delete this ${relationship.type} relationship?`,
              onConfirm: () => {
                actions.deleteRelationship(relationship.id);
                actions.setDeleteConfirmation(null);
              },
              onCancel: () => actions.setDeleteConfirmation(null)
            });
            actions.setContextMenu(null);
          }}
          style={{ ...buttonStyle, color: '#dc2626' }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#fee2e2')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          <Trash2 size={16} />
          Delete Relationship
        </button>
      </>
    );
  };

  const renderHouseholdMenu = () => {
    const household = contextMenu.household;

    return (
      <>
        <button
          onClick={() => {
            if (contextMenu.canvasX !== undefined && contextMenu.canvasY !== undefined) {
              const point = { x: contextMenu.canvasX, y: contextMenu.canvasY };
              
              // Find the best place to insert the new point
              let bestIndex = 0;
              let minDistance = Infinity;
              
              // If we have multiple points, find where to insert the new point
              if (household.points.length > 1) {
                for (let i = 0; i < household.points.length; i++) {
                  const p1 = household.points[i];
                  const p2 = household.points[(i + 1) % household.points.length];
                  
                  // Calculate distance from point to line segment
                  const lineLen = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
                  const t = Math.max(0, Math.min(1, ((point.x - p1.x) * (p2.x - p1.x) + (point.y - p1.y) * (p2.y - p1.y)) / (lineLen * lineLen)));
                  const projX = p1.x + t * (p2.x - p1.x);
                  const projY = p1.y + t * (p2.y - p1.y);
                  const distance = Math.sqrt(Math.pow(point.x - projX, 2) + Math.pow(point.y - projY, 2));
                  
                  if (distance < minDistance) {
                    minDistance = distance;
                    bestIndex = i;
                  }
                }
              }
              
              // Insert the point after the best index
              const newPoints = [...household.points];
              newPoints.splice(bestIndex + 1, 0, point);
              
              actions.updateHousehold(household.id, { points: newPoints });
              actions.setContextMenu(null);
              
              // Save to history after adding household point
              actions.saveToHistory({
                people: state.people,
                relationships: state.relationships,
                households: state.households,
                textBoxes: state.textBoxes
              });
            }
          }}
          style={buttonStyle}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          <Plus size={16} />
          Add Point Here
        </button>

        {contextMenu.pointIndex !== undefined && household.points.length > 3 && (
          <button
            onClick={() => {
              const newPoints = household.points.filter((_, idx) => idx !== contextMenu.pointIndex);
              actions.updateHousehold(household.id, { points: newPoints });
              actions.setContextMenu(null);
              
              // Save to history after deleting household point
              actions.saveToHistory({
                people: state.people,
                relationships: state.relationships,
                households: state.households,
                textBoxes: state.textBoxes
              });
            }}
            style={buttonStyle}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
          >
            <Trash2 size={16} />
            Delete Point
          </button>
        )}

        <button
          onClick={() => {
            actions.selectHousehold(household);
            actions.setContextMenu(null);
          }}
          style={buttonStyle}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          <Edit3 size={16} />
          Edit Household
        </button>

        <button
          onClick={() => {
            actions.copyToClipboard('household', household);
            actions.setContextMenu(null);
          }}
          style={buttonStyle}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          <Copy size={16} />
          Copy Household
        </button>

        <button
          onClick={() => {
            actions.setDeleteConfirmation({
              type: 'household',
              title: 'Delete Household', 
              message: `Delete ${household.name || 'this household'}?`,
              onConfirm: () => {
                actions.deleteHousehold(household.id);
                actions.setDeleteConfirmation(null);
                
                // Save to history after household deletion
                actions.saveToHistory({
                  people: state.people,
                  relationships: state.relationships,
                  households: state.households.filter(h => h.id !== household.id),
                  textBoxes: state.textBoxes
                });
              },
              onCancel: () => actions.setDeleteConfirmation(null)
            });
          }}
          style={{ ...buttonStyle, color: '#dc2626' }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#fee2e2')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          <Trash2 size={16} />
          Delete Household
        </button>
      </>
    );
  };

  const renderCanvasMenu = () => (
    <>
      <button
        onClick={() => {
          // Store the canvas coordinates for the new person
          actions.setNextPersonPosition({ 
            x: contextMenu.canvasX, 
            y: contextMenu.canvasY 
          });
          // Open the quick add modal
          actions.setQuickAddOpen(true);
          actions.setContextMenu(null);
        }}
        style={buttonStyle}
        onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
      >
        <Plus size={16} />
        Add Person/Resource Here
      </button>

      <button
        onClick={() => {
          const textBox = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            x: snapToGridFunc(contextMenu.canvasX),
            y: snapToGridFunc(contextMenu.canvasY),
            width: 150,
            height: 50,
            html: 'New Text'
          };
          actions.addTextBox(textBox);
          actions.setContextMenu(null);
        }}
        style={buttonStyle}
        onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
      >
        <Type size={16} />
        Add Text Here
      </button>
      
      {state.clipboard && (
        <button
          onClick={() => {
            // Calculate offset from context menu position
            const offsetX = contextMenu.canvasX - state.clipboard.data.x;
            const offsetY = contextMenu.canvasY - state.clipboard.data.y;
            actions.pasteFromClipboard(offsetX, offsetY);
            actions.setContextMenu(null);
          }}
          style={buttonStyle}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          <Clipboard size={16} />
          Paste {state.clipboard.type === 'person' ? 'Person' : state.clipboard.type === 'textBox' ? 'Text' : 'Household'} Here
        </button>
      )}

      <div style={dividerStyle} />

      <button
        onClick={() => {
          fitToCanvas();
          actions.setContextMenu(null);
        }}
        style={buttonStyle}
        onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
      >
        <Maximize2 size={16} />
        Fit to Screen
      </button>

      <button
        onClick={() => {
          autoArrange();
          actions.setContextMenu(null);
        }}
        style={buttonStyle}
        onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
      >
        <Sparkles size={16} />
        Auto Arrange All
      </button>
    </>
  );

  const renderBulkPersonMenu = () => {
    const selectedNodeIds = contextMenu.selectedNodes || [];
    const selectedPeople = state.people.filter(p => selectedNodeIds.includes(p.id));
    const count = selectedPeople.length;

    return (
      <>
        <div style={{ padding: '6px 10px', borderBottom: '1px solid #f1f5f9', marginBottom: '6px' }}>
          <strong style={{ fontSize: '13px', color: '#1e293b' }}>
            {count} {count === 1 ? 'Person' : 'People'} Selected
          </strong>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            // Open bulk edit panel via global state and close context menu
            actions.setShowBulkEditPanel(true);
            actions.setContextMenu(null);
          }}
          style={buttonStyle}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          <Edit3 size={16} />
          Edit Selected ({count})
        </button>

        <button
          onClick={() => {
            // Toggle network member for all selected
            const allAreNetworkMembers = selectedPeople.every(p => p.networkMember);
            selectedPeople.forEach(person => {
              actions.updatePerson(person.id, { networkMember: !allAreNetworkMembers });
            });
            actions.setContextMenu(null);
          }}
          style={buttonStyle}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          <UserCheck size={16} />
          {selectedPeople.every(p => p.networkMember) ? 'Remove from Network' : 'Add to Network'}
        </button>

        <div style={dividerStyle} />

        <button
          onClick={() => {
            if (window.confirm(`Delete ${count} selected ${count === 1 ? 'person' : 'people'}? This cannot be undone.`)) {
              selectedPeople.forEach(person => {
                actions.deletePerson(person.id);
              });
              actions.clearNodeSelection();
              actions.setContextMenu(null);
            }
          }}
          style={{ ...buttonStyle, color: '#dc2626' }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#fef2f2')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          <Trash2 size={16} />
          Delete Selected ({count})
        </button>

        <button
          onClick={() => {
            actions.clearNodeSelection();
            actions.setContextMenu(null);
          }}
          style={buttonStyle}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8fafc')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
        >
          <X size={16} />
          Clear Selection
        </button>
      </>
    );
  };

  return (
    <>
      {contextMenu && (
        <div 
          ref={menuRef}
          style={menuStyle} 
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
          data-context-menu="true"
        >
          {(() => {
            console.log('📋 ContextMenu rendering with type:', contextMenu.type);
            console.log('📋 contextMenu object:', contextMenu);
            return null;
          })()}
          {contextMenu.type === 'person' && renderPersonMenu()}
          {contextMenu.type === 'bulk-person' && renderBulkPersonMenu()}
          {contextMenu.type === 'relationship' && renderRelationshipMenu()}
          {contextMenu.type === 'household' && renderHouseholdMenu()}
          {contextMenu.type === 'canvas' && renderCanvasMenu()}
        </div>
      )}
    </>
  );
};

export default ContextMenu;