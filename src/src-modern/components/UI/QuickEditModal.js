// src/src-modern/components/UI/QuickEditModal.js
import React, { useState, useEffect, useRef } from 'react';
import { useGenogram } from '../../contexts/GenogramContext';
import { normalizeDeceasedSelection } from '../../utils/deceasedSymbolHelpers';
import DeceasedSymbolPicker from '../common/DeceasedSymbolPicker';

const QuickEditModal = () => {
  const { state, actions } = useGenogram();
  const { selectedPerson, quickEditOpen } = state;
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    birthDate: '',
    deathDate: '',
    gender: 'unknown',
    specialStatus: '',
    isDeceased: false,
    deceasedSymbol: 'halo',
    deceasedGentleTreatment: 'none',
    notes: ''
  });
  const firstInputRef = useRef(null);
  
  useEffect(() => {
    if (selectedPerson && quickEditOpen) {
      const { symbol, gentle } = normalizeDeceasedSelection(selectedPerson);

      setFormData({
        name: selectedPerson.name || '',
        age: selectedPerson.age || '',
        birthDate: selectedPerson.birthDate || '',
        deathDate: selectedPerson.deathDate || '',
        gender: selectedPerson.gender || 'unknown',
        specialStatus: selectedPerson.specialStatus || '',
        isDeceased: selectedPerson.isDeceased || false,
        deceasedSymbol: symbol,
        deceasedGentleTreatment: gentle,
        notes: selectedPerson.notes || ''
      });
      
      // Focus first input when modal opens
      setTimeout(() => {
        firstInputRef.current?.focus();
        firstInputRef.current?.select();
      }, 100);
    }
  }, [selectedPerson, quickEditOpen]);
  
  if (!quickEditOpen || !selectedPerson) return null;
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Update the person
    actions.updatePerson(selectedPerson.id, {
      ...formData,
      age: formData.age ? parseInt(formData.age) : undefined
    });
    
    // Save to history
    actions.saveToHistory({
      people: state.people,
      relationships: state.relationships,
      households: state.households,
      textBoxes: state.textBoxes
    });
    
    // Close the modal
    actions.setQuickEditOpen(false);
  };
  
  const handleCancel = () => {
    actions.setQuickEditOpen(false);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit(e);
    }
  };
  
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
        style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '28rem',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <h2 
          className="text-xl font-bold mb-4"
          style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}
        >
          Quick Edit: {selectedPerson.name}
        </h2>
        
        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="mb-4" style={{ marginBottom: '1rem' }}>
            <label 
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.25rem'
              }}
            >
              Name
            </label>
            <input
              ref={firstInputRef}
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            />
          </div>
          
          {/* Gender */}
          <div className="mb-4" style={{ marginBottom: '1rem' }}>
            <label 
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.25rem'
              }}
            >
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            >
              <option value="unknown">Unknown</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="transgender-male">Transgender Male</option>
              <option value="transgender-female">Transgender Female</option>
              <option value="genderfluid">Genderfluid</option>
              <option value="agender">Agender</option>
            </select>
          </div>
          
          {/* Age */}
          <div className="mb-4" style={{ marginBottom: '1rem' }}>
            <label 
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.25rem'
              }}
            >
              Age
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            />
          </div>
          
          {/* Birth Date */}
          <div className="mb-4" style={{ marginBottom: '1rem' }}>
            <label 
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.25rem'
              }}
            >
              Birth Date
            </label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            />
          </div>
          
          {/* Deceased Checkbox */}
          <div className="mb-4" style={{ marginBottom: '1rem' }}>
            <label 
              className="flex items-center"
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <input
                type="checkbox"
                checked={formData.isDeceased}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData({
                    ...formData,
                    isDeceased: checked,
                    deceasedSymbol: checked ? (formData.deceasedSymbol || 'halo') : formData.deceasedSymbol,
                    deceasedGentleTreatment: checked ? (formData.deceasedGentleTreatment || 'none') : formData.deceasedGentleTreatment
                  });
                }}
                className="mr-2"
                style={{
                  marginRight: '0.5rem',
                  width: '1rem',
                  height: '1rem'
                }}
              />
              <span 
                className="text-sm font-medium text-gray-700"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                Deceased
              </span>
            </label>
          </div>
          
          {/* Death Date (only show if deceased) */}
          {formData.isDeceased && (
            <div className="mb-4" style={{ marginBottom: '1rem' }}>
              <label 
                className="block text-sm font-medium text-gray-700 mb-1"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}
              >
                Death Date
              </label>
              <input
                type="date"
                value={formData.deathDate}
                onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
            </div>
          )}

          {formData.isDeceased && (
            <div className="mb-4" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Remembrance symbol</span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Optional</span>
              </div>
              <DeceasedSymbolPicker
                symbolValue={formData.deceasedSymbol || 'halo'}
                gentleValue={formData.deceasedGentleTreatment || 'none'}
                onChange={(symbol, gentle) =>
                  setFormData({
                    ...formData,
                    deceasedSymbol: symbol,
                    deceasedGentleTreatment: gentle
                  })
                }
                size={48}
              />
            </div>
          )}
          
          {/* Special Status */}
          <div className="mb-4" style={{ marginBottom: '1rem' }}>
            <label 
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.25rem'
              }}
            >
              Special Status
            </label>
            <select
              value={formData.specialStatus}
              onChange={(e) => setFormData({ ...formData, specialStatus: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            >
              <option value="">None</option>
              <option value="adopted">Adopted</option>
              <option value="foster">Foster</option>
              <option value="step">Step</option>
            </select>
          </div>
          
          {/* Notes */}
          <div className="mb-4" style={{ marginBottom: '1rem' }}>
            <label 
              className="block text-sm font-medium text-gray-700 mb-1"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.25rem'
              }}
            >
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                outline: 'none',
                resize: 'vertical'
              }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            />
          </div>
          
          {/* Buttons */}
          <div 
            className="flex justify-end space-x-2 mt-6"
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem',
              marginTop: '1.5rem'
            }}
          >
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              style={{
                padding: '0.5rem 1rem',
                color: '#374151',
                backgroundColor: '#e5e7eb',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d1d5db'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#e5e7eb'}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              style={{
                padding: '0.5rem 1rem',
                color: 'white',
                backgroundColor: '#2563eb',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
            >
              Save Changes
            </button>
          </div>
        </form>
        
        {/* Keyboard shortcut hint */}
        <div 
          className="mt-4 text-xs text-gray-500 text-center"
          style={{
            marginTop: '1rem',
            fontSize: '0.75rem',
            color: '#6b7280',
            textAlign: 'center'
          }}
        >
          Press Esc to cancel • Ctrl+Enter to save
        </div>
      </div>
    </div>
  );
};

export default QuickEditModal;  