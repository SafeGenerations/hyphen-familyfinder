import React, { useState, useRef, useEffect } from 'react';
import { UserPlus, ChevronLeft } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import { useResponsive, getGridSize } from '../../utils/responsive';

const MobileQuickAddModal = () => {
  const { state, actions } = useGenogram();
  const { quickAddOpen } = state;
  const { dimensions, breakpoint } = useResponsive();
  const [formData, setFormData] = useState({ name: '', age: '', gender: '' });
  const [step, setStep] = useState(1); // Multi-step form for mobile
  const nameInputRef = useRef(null);

  const isMobile = breakpoint === 'xs' || breakpoint === 'sm';

  useEffect(() => {
    if (quickAddOpen) {
      setStep(1);
      setFormData({ name: '', age: '', gender: '' });
      if (nameInputRef.current && step === 1) {
        setTimeout(() => nameInputRef.current?.focus(), 300);
      }
    }
  }, [quickAddOpen, step]);

  // Handle escape key to close the modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && quickAddOpen) {
        handleClose();
      }
    };

    if (quickAddOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [quickAddOpen]);

  const handleClose = () => {
    actions.setQuickAddOpen(false);
    setFormData({ name: '', age: '', gender: '' });
    setStep(1);
  };

  const handleNext = () => {
    if (step === 1 && formData.name.trim()) {
      setStep(2);
    } else if (step === 2) {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const gender = formData.gender || 'unknown';
    const gridSize = getGridSize(breakpoint);
    
    const snapToGrid = (value) => {
      if (!state.snapToGrid) return value;
      return Math.round(value / gridSize) * gridSize;
    };
    
    // Determine position
    let x, y;
    
    if (state.nextPersonPosition) {
      x = snapToGrid(state.nextPersonPosition.x - dimensions.personSize / 2);
      y = snapToGrid(state.nextPersonPosition.y - dimensions.personSize / 2);
      actions.setNextPersonPosition(null);
    } else {
      const centerX = window.innerWidth / 2;
      const centerY = (window.innerHeight - 120) / 2; // Account for toolbars
      
      if (state.people.length === 0) {
        x = snapToGrid(centerX - dimensions.personSize / 2);
        y = snapToGrid(centerY - dimensions.personSize / 2);
      } else {
        x = snapToGrid(centerX - dimensions.personSize / 2 + Math.random() * 100 - 50);
        y = snapToGrid(centerY - dimensions.personSize / 2 + Math.random() * 100 - 50);
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
    handleClose();
  };

  if (!quickAddOpen) return null;

  // Mobile full-screen modal
  if (isMobile) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'white',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        touchAction: 'none'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: 'white'
        }}>
          <button
            onClick={step > 1 ? () => setStep(1) : handleClose}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              color: '#6366f1',
              touchAction: 'manipulation'
            }}
          >
            <ChevronLeft size={24} />
            {step > 1 ? 'Back' : 'Cancel'}
          </button>

          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1e293b',
            margin: 0
          }}>
            Add Person
          </h2>

          <div style={{ width: '80px' }} /> {/* Spacer for centering */}
        </div>

        {/* Progress indicator */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '16px 20px',
          backgroundColor: '#f9fafb'
        }}>
          {[1, 2].map(s => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                backgroundColor: s <= step ? '#6366f1' : '#e5e7eb',
                transition: 'background-color 0.3s'
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          touchAction: 'pan-y'
        }}>
          {step === 1 && (
            <div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                What's their name?
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#64748b',
                marginBottom: '32px'
              }}>
                Enter the person's full name
              </p>
              
              <input
                ref={nameInputRef}
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
                style={{
                  width: '100%',
                  padding: '20px',
                  fontSize: '18px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  backgroundColor: '#f9fafb',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  WebkitAppearance: 'none' // Prevent iOS styling
                }}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                Additional details
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#64748b',
                marginBottom: '32px'
              }}>
                Optional information about {formData.name || 'this person'}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Gender selection */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '12px'
                  }}>
                    Gender
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px'
                  }}>
                    {[
                      { value: 'male', label: 'Male', icon: '♂' },
                      { value: 'female', label: 'Female', icon: '♀' },
                      { value: 'non-binary', label: 'Non-Binary', icon: '⚥' },
                      { value: 'unknown', label: 'Unknown', icon: '?' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setFormData({ ...formData, gender: option.value })}
                        style={{
                          padding: '16px',
                          border: formData.gender === option.value ? '2px solid #6366f1' : '1px solid #e5e7eb',
                          borderRadius: '12px',
                          backgroundColor: formData.gender === option.value ? '#ede9fe' : 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontSize: '16px',
                          fontWeight: formData.gender === option.value ? '600' : '400',
                          color: formData.gender === option.value ? '#6366f1' : '#374151',
                          transition: 'all 0.2s',
                          touchAction: 'manipulation'
                        }}
                      >
                        <span style={{ fontSize: '20px' }}>{option.icon}</span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age input */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '12px'
                  }}>
                    Age (optional)
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Age"
                    min="0"
                    max="150"
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      backgroundColor: '#f9fafb',
                      outline: 'none',
                      WebkitAppearance: 'none' // Prevent iOS number input styling
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom action */}
        <div style={{
          padding: '20px',
          paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0))',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: 'white'
        }}>
          <button
            onClick={handleNext}
            disabled={step === 1 && !formData.name.trim()}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              opacity: (step === 1 && !formData.name.trim()) ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              touchAction: 'manipulation'
            }}
          >
            {step === 2 && <UserPlus size={20} />}
            {step === 1 ? 'Next' : 'Add Person'}
          </button>
        </div>
      </div>
    );
  }

  // Desktop modal (existing ResponsiveQuickAddModal)
  return null; // Use existing ResponsiveQuickAddModal for desktop
};

export default MobileQuickAddModal;