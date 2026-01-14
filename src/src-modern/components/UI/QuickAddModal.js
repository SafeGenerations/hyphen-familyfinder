// src/src-modern/components/UI/QuickAddModal.js
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import { NodeType, NODE_TYPE_OPTIONS } from '../../constants/nodeTypes';

const QuickAddModal = () => {
  const { state, actions } = useGenogram();
  const { quickAddOpen } = state;

  const INITIAL_FORM_STATE = useMemo(() => ({
    name: '',
    age: '',
    gender: '',
    organizationType: '',
    serviceType: '',
    address: '',
    description: ''
  }), []);

  const [nodeType, setNodeType] = useState(NodeType.PERSON);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  const nameInputRef = useRef(null);
  const ageInputRef = useRef(null);
  const organizationTypeRef = useRef(null);
  const serviceTypeRef = useRef(null);
  const addressRef = useRef(null);
  const descriptionRef = useRef(null);

  const nodeTypeOptions = useMemo(() => {
    const orderedTypes = [
      NodeType.PERSON,
      NodeType.ORGANIZATION,
      NodeType.SERVICE_RESOURCE,
      NodeType.PLACE_LOCATION,
      NodeType.CUSTOM
    ];
    return orderedTypes
      .map((type) => NODE_TYPE_OPTIONS.find((option) => option.value === type))
      .filter(Boolean);
  }, []);

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setNodeType(NodeType.PERSON);
  };

  useEffect(() => {
    if (quickAddOpen) {
      resetForm();
      // Delay focus slightly to ensure modal is rendered
      requestAnimationFrame(() => {
        nameInputRef.current?.focus();
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickAddOpen]);

  if (!quickAddOpen) return null;

  const defaultNameByType = {
    [NodeType.PERSON]: 'New Person',
    [NodeType.ORGANIZATION]: 'New Organization',
    [NodeType.SERVICE_RESOURCE]: 'New Service',
    [NodeType.PLACE_LOCATION]: 'New Place',
    [NodeType.CUSTOM]: 'New Node'
  };

  const getNamePlaceholder = () => {
    switch (nodeType) {
      case NodeType.ORGANIZATION:
        return 'Organization or agency name...';
      case NodeType.SERVICE_RESOURCE:
        return 'Service or resource name...';
      case NodeType.PLACE_LOCATION:
        return 'Place name...';
      case NodeType.CUSTOM:
        return 'Label for this custom node...';
      case NodeType.PERSON:
      default:
        return 'Enter name...';
    }
  };

  const getSubmitLabel = () => {
    switch (nodeType) {
      case NodeType.ORGANIZATION:
        return 'Add Organization';
      case NodeType.SERVICE_RESOURCE:
        return 'Add Service';
      case NodeType.PLACE_LOCATION:
        return 'Add Place';
      case NodeType.CUSTOM:
        return 'Add Custom Node';
      case NodeType.PERSON:
      default:
        return 'Add Person';
    }
  };

  const handleSubmit = (event) => {
    if (event) {
      event.preventDefault();
    }

    // Helper function to snap to grid
    const snapToGrid = (value) => {
      const GRID_SIZE = 20;
      if (!state.snapToGrid) return value;
      return Math.round(value / GRID_SIZE) * GRID_SIZE;
    };
    
    // Determine position for new person
    let x, y;
    
    if (state.nextPersonPosition) {
      // Use the position set by context menu "Add Person Here"
      x = snapToGrid(state.nextPersonPosition.x - 30);
      y = snapToGrid(state.nextPersonPosition.y - 30);
      actions.setNextPersonPosition(null); // Clear it after use
    } else {
      // Calculate smart position based on existing people
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      if (state.people.length === 0) {
        // First person - center of viewport
        x = snapToGrid(centerX - 30);
        y = snapToGrid(centerY - 30);
      } else if (state.selectedPerson) {
        // Place near selected person
        x = snapToGrid(state.selectedPerson.x + 100);
        y = snapToGrid(state.selectedPerson.y);
      } else {
        // Find a good spot that doesn't overlap
        const padding = 100;
        let foundSpot = false;
        
        // Try positions in a grid pattern around center
        for (let dx = 0; dx <= 300 && !foundSpot; dx += 100) {
          for (let dy = 0; dy <= 300 && !foundSpot; dy += 100) {
            const testX = snapToGrid(centerX + dx - 30);
            const testY = snapToGrid(centerY + dy - 30);
            
            // Check if this position overlaps with any existing person
            const overlaps = state.people.some(p => 
              Math.abs(p.x - testX) < padding && Math.abs(p.y - testY) < padding
            );
            
            if (!overlaps) {
              x = testX;
              y = testY;
              foundSpot = true;
            }
          }
        }
        
        // Fallback if no spot found
        if (!foundSpot) {
          x = snapToGrid(centerX + Math.random() * 200 - 100);
          y = snapToGrid(centerY + Math.random() * 200 - 100);
        }
      }
    }
    
    const trimmedName = formData.name.trim();
    const baseNode = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: trimmedName || defaultNameByType[nodeType] || 'New Node',
      type: nodeType,
      x,
      y,
      notes: '',
      notesRichText: ''
    };

    if (nodeType === NodeType.PERSON) {
      const gender = formData.gender || 'unknown';
      baseNode.age = formData.age || null;
      baseNode.gender = gender;
      baseNode.isDeceased = false;
      baseNode.birthDate = '';
      baseNode.deathDate = '';
      baseNode.deceasedSymbol = 'halo';
      baseNode.deceasedGentleTreatment = 'none';
    } else {
      const typeData = {};
      if (nodeType === NodeType.ORGANIZATION && formData.organizationType.trim()) {
        typeData.organizationType = formData.organizationType.trim();
      }
      if (nodeType === NodeType.SERVICE_RESOURCE && formData.serviceType.trim()) {
        typeData.serviceType = formData.serviceType.trim();
      }
      if (nodeType === NodeType.PLACE_LOCATION && formData.address.trim()) {
        typeData.address = formData.address.trim();
      }
      if (nodeType === NodeType.CUSTOM && formData.description.trim()) {
        typeData.description = formData.description.trim();
      }

      if (Object.keys(typeData).length > 0) {
        baseNode.typeData = typeData;
      }
    }

    actions.addPerson(baseNode);
    actions.selectPerson(baseNode, true);
    actions.setQuickAddOpen(false);
    resetForm();
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!formData.name.trim()) {
        return;
      }

      if (nodeType === NodeType.PERSON) {
        ageInputRef.current?.focus();
        return;
      }

      const typeFieldRefs = {
        [NodeType.ORGANIZATION]: organizationTypeRef,
        [NodeType.SERVICE_RESOURCE]: serviceTypeRef,
        [NodeType.PLACE_LOCATION]: addressRef,
        [NodeType.CUSTOM]: descriptionRef
      };

      const nextRef = typeFieldRefs[nodeType];
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      } else {
        handleSubmit();
      }
    }
  };

  const handleAgeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTypeSpecificKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClose = () => {
    actions.setQuickAddOpen(false);
    resetForm();
  };

  const handleTypeChange = (event) => {
    const nextType = event.target.value;
    setNodeType(nextType);
    setFormData((prev) => ({
      ...INITIAL_FORM_STATE,
      name: prev.name // preserve name when switching types
    }));
    requestAnimationFrame(() => {
      nameInputRef.current?.focus();
    });
  };

  const typeFieldMeta = {
    [NodeType.ORGANIZATION]: {
      label: 'Organization Type',
      placeholder: 'e.g., Child Welfare Agency',
      key: 'organizationType',
      ref: organizationTypeRef
    },
    [NodeType.SERVICE_RESOURCE]: {
      label: 'Service Type',
      placeholder: 'e.g., Food Bank, Transportation, Counseling...',
      key: 'serviceType',
      ref: serviceTypeRef
    },
    [NodeType.PLACE_LOCATION]: {
      label: 'Address',
      placeholder: 'Street address or general location...',
      key: 'address',
      ref: addressRef
    },
    [NodeType.CUSTOM]: {
      label: 'Description',
      placeholder: 'Describe what this node represents (optional)',
      key: 'description',
      ref: descriptionRef
    }
  };

  const activeTypeField = nodeType === NodeType.PERSON ? null : typeFieldMeta[nodeType];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}
    onClick={(e) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        width: '400px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
      }}
      className="quick-add-modal">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            Quick Add Node
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Node Type
            </label>
            <select
              value={nodeType}
              onChange={handleTypeChange}
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '14px'
              }}
            >
              {nodeTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Name
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onKeyDown={handleNameKeyDown}
              placeholder={getNamePlaceholder()}
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '14px'
              }}
            />
          </div>

          {nodeType === NodeType.PERSON && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-Binary</option>
                  <option value="transgender-male">Trans Male</option>
                  <option value="transgender-female">Trans Female</option>
                  <option value="genderfluid">Genderfluid</option>
                  <option value="agender">Agender</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Age
                </label>
                <input
                  ref={ageInputRef}
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  onKeyDown={handleAgeKeyDown}
                  placeholder="Age"
                  style={{
                    width: '100%',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          )}

          {activeTypeField && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                {activeTypeField.label}
                <span style={{ color: '#9ca3af', fontWeight: '400', marginLeft: '4px' }}>(optional)</span>
              </label>
              <input
                ref={activeTypeField.ref}
                type="text"
                value={formData[activeTypeField.key]}
                onChange={(e) => setFormData({ ...formData, [activeTypeField.key]: e.target.value })}
                onKeyDown={handleTypeSpecificKeyDown}
                placeholder={activeTypeField.placeholder}
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '14px'
                }}
              />
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#6b7280'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {getSubmitLabel()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddModal;