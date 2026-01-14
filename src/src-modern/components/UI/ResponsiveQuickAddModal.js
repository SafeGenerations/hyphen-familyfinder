import React, { useState, useRef, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import { useResponsive, getGridSize } from '../../utils/responsive';
import ResponsiveModal from './ResponsiveModal';

const ResponsiveQuickAddModal = () => {
  const { state, actions } = useGenogram();
  const { quickAddOpen } = state;
  const { dimensions, breakpoint } = useResponsive();
  const [formData, setFormData] = useState({ name: '', age: '', gender: '' });
  const nameInputRef = useRef(null);
  const ageInputRef = useRef(null);

  useEffect(() => {
    if (quickAddOpen && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current.focus();
      }, 100);
    }
  }, [quickAddOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!quickAddOpen) {
      setFormData({ name: '', age: '', gender: '' });
    }
  }, [quickAddOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const gender = formData.gender || 'unknown';
    const gridSize = getGridSize(breakpoint);
    
    // Helper function to snap to grid
    const snapToGrid = (value) => {
      if (!state.snapToGrid) return value;
      return Math.round(value / gridSize) * gridSize;
    };
    
    // Determine position for new person
    let x, y;
    
    if (state.nextPersonPosition) {
      // Use the position set by context menu "Add Person Here"
      x = snapToGrid(state.nextPersonPosition.x - dimensions.personSize / 2);
      y = snapToGrid(state.nextPersonPosition.y - dimensions.personSize / 2);
      actions.setNextPersonPosition(null); // Clear it after use
    } else {
      // Calculate smart position based on existing people
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      if (state.people.length === 0) {
        // First person - center of viewport
        x = snapToGrid(centerX - dimensions.personSize / 2);
        y = snapToGrid(centerY - dimensions.personSize / 2);
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
            const testX = snapToGrid(centerX + dx - dimensions.personSize / 2);
            const testY = snapToGrid(centerY + dy - dimensions.personSize / 2);
            
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
    
    const newPerson = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: formData.name || 'New Person',
      age: formData.age || null,
      gender: gender,
      x: x,
      y: y,
      isDeceased: false,
      birthDate: '',
      deathDate: '',
      deceasedSymbol: 'halo',
      deceasedGentleTreatment: 'none',
      notes: ''
    };
    
    actions.addPerson(newPerson);
    actions.selectPerson(newPerson);
    actions.setQuickAddOpen(false);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (formData.name.trim()) {
        ageInputRef.current?.focus();
      }
    }
  };

  const handleAgeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const inputStyle = {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: `${dimensions.compactSpacing}px ${dimensions.baseSpacing * 0.75}px`,
    fontSize: `${dimensions.baseFontSize}px`,
    height: `${dimensions.inputHeight}px`,
    backgroundColor: '#f9fafb',
    transition: 'border-color 0.2s',
    outline: 'none',
    WebkitAppearance: 'none' // Prevent iOS styling
  };

  const labelStyle = {
    display: 'block',
    fontSize: `${dimensions.baseFontSize - 2}px`,
    fontWeight: '500',
    color: '#374151',
    marginBottom: `${dimensions.compactSpacing}px`
  };

  const buttonStyle = {
    padding: `${dimensions.compactSpacing}px ${dimensions.baseSpacing}px`,
    borderRadius: '8px',
    fontSize: `${dimensions.baseFontSize}px`,
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minHeight: `${dimensions.buttonHeight}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    touchAction: 'manipulation' // Prevent double-tap zoom
  };

  return (
    <ResponsiveModal
      isOpen={quickAddOpen}
      onClose={() => actions.setQuickAddOpen(false)}
      title="Quick Add Person"
      maxWidth={dimensions.quickAddWidth}
      fullScreenOnMobile={true}
    >
      <form onSubmit={handleSubmit}>
        {/* Name field */}
        <div style={{ marginBottom: dimensions.baseSpacing }}>
          <label style={labelStyle}>
            Name
          </label>
          <input
            ref={nameInputRef}
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onKeyDown={handleNameKeyDown}
            placeholder="Enter name..."
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        {/* Gender and Age row - stack on mobile */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: breakpoint === 'xs' ? '1fr' : '1fr 1fr', 
          gap: dimensions.baseSpacing * 0.75,
          marginBottom: dimensions.baseSpacing 
        }}>
          <div>
            <label style={labelStyle}>
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              style={{
                ...inputStyle,
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: `right ${dimensions.compactSpacing}px center`,
                paddingRight: '32px'
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
            <label style={labelStyle}>
              Age
            </label>
            <input
              ref={ageInputRef}
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              onKeyDown={handleAgeKeyDown}
              placeholder="Age"
              min="0"
              max="150"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>
        </div>

        {/* Quick tips for mobile */}
        {breakpoint === 'xs' || breakpoint === 'sm' ? (
          <div style={{
            padding: dimensions.compactSpacing,
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            marginBottom: dimensions.baseSpacing,
            fontSize: `${dimensions.baseFontSize - 2}px`,
            color: '#0369a1'
          }}>
            💡 Tip: Press Enter to move between fields
          </div>
        ) : null}

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: dimensions.compactSpacing,
          justifyContent: 'flex-end',
          marginTop: dimensions.baseSpacing * 1.5
        }}>
          <button
            type="button"
            onClick={() => actions.setQuickAddOpen(false)}
            style={{
              ...buttonStyle,
              backgroundColor: 'transparent',
              border: '1px solid #d1d5db',
              color: '#6b7280'
            }}
            onPointerEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              ...buttonStyle,
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              minWidth: '120px'
            }}
            onPointerEnter={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
            onPointerLeave={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
          >
            <UserPlus size={18} />
            Add Person
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
};

export default ResponsiveQuickAddModal;