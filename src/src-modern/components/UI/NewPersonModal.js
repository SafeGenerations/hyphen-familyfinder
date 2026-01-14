// src/components/UI/NewPersonModal.js

import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import { normalizeDeceasedSelection } from '../../utils/deceasedSymbolHelpers';
import DeceasedSymbolPicker from '../common/DeceasedSymbolPicker';

const NewPersonModal = () => {
  const { state, actions } = useGenogram();
  const { selectedPerson, newPersonModalOpen } = state;
  
  const [formData, setFormData] = useState({
    name: '',
    gender: 'unknown',
    age: '',
    birthDate: '',
    isDeceased: false,
    deceasedSymbol: 'halo',
    deceasedGentleTreatment: 'none',
    specialStatus: null
  });
  
  const nameInputRef = useRef(null);
  const ageInputRef = useRef(null);
  
  // Update form when selected person changes
  useEffect(() => {
    if (selectedPerson && newPersonModalOpen) {
      const { symbol, gentle } = normalizeDeceasedSelection(selectedPerson);

      setFormData({
        name: selectedPerson.name || '',
        gender: selectedPerson.gender || 'unknown',
        age: selectedPerson.age || '',
        birthDate: selectedPerson.birthDate || '',
        isDeceased: selectedPerson.isDeceased || false,
        deceasedSymbol: symbol,
        deceasedGentleTreatment: gentle,
        specialStatus: selectedPerson.specialStatus || null
      });
      
      // Focus name input when modal opens
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
          nameInputRef.current.select();
        }
      }, 100);
    }
  }, [selectedPerson, newPersonModalOpen]);
  
  if (!newPersonModalOpen || !selectedPerson) return null;
  
  const isNewPerson = selectedPerson.name === 'New Child' || 
                     selectedPerson.name === 'Adopted Child' ||
                     selectedPerson.name === 'Unknown';
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Update the person with form data
    actions.updatePerson(selectedPerson.id, formData);
    
    // Close modal
    actions.setNewPersonModal(false);
    
    // Keep person selected in case user wants to edit more in side panel
    actions.selectPerson({ ...selectedPerson, ...formData }, true);
  };
  
  const handleCancel = () => {
    // If canceling a new person, delete it
    if (isNewPerson) {
      actions.deletePerson(selectedPerson.id);
    }
    actions.setNewPersonModal(false);
  };
  
  const handleBirthDateChange = (e) => {
    const birthDate = e.target.value;
    const updates = { birthDate };
    setFormData({ ...formData, ...updates });
  };
  
  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Move focus to age field
      ageInputRef.current?.focus();
    }
  };

  const handleAgeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Submit the form
      handleSubmit(e);
    }
  };
  
  return (
    <div style={styles.overlay} onClick={(e) => {
      if (e.target === e.currentTarget) handleCancel();
    }}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {isNewPerson ? '✨ New Person Created!' : `Edit ${selectedPerson.name}`}
          </h2>
          <button onClick={handleCancel} style={styles.closeButton}>
            <X size={20} />
          </button>
        </div>
        
        {isNewPerson && (
          <div style={styles.banner}>
            Please enter the details for this new person:
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name *</label>
            <input
              ref={nameInputRef}
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onKeyDown={handleNameKeyDown}
              style={styles.input}
              placeholder="Enter full name..."
              required
            />
          </div>
          
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                style={styles.input}
              >
                <option value="unknown">Unknown (?)</option>
                <option value="male">Male (Square)</option>
                <option value="female">Female (Circle)</option>
                <option value="non-binary">Non-Binary (Diamond)</option>
                <option value="transgender-male">Transgender Male</option>
                <option value="transgender-female">Transgender Female</option>
                <option value="genderfluid">Genderfluid (Triangle)</option>
                <option value="agender">Agender (Hexagon)</option>
              </select>
            </div>
            
            <div style={styles.field}>
              <label style={styles.label}>Special Status</label>
              <select
                value={formData.specialStatus || 'none'}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  specialStatus: e.target.value === 'none' ? null : e.target.value 
                })}
                style={styles.input}
              >
                <option value="none">None</option>
                <option value="adopted">Adopted</option>
                <option value="foster">Foster</option>
              </select>
            </div>
          </div>
          
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Birth Date</label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={handleBirthDateChange}
                style={styles.input}
              />
            </div>
            
            <div style={styles.field}>
              <label style={styles.label}>Age</label>
              <input
                ref={ageInputRef}
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                onKeyDown={handleAgeKeyDown}
                style={styles.input}
                placeholder="Age"
                min="0"
                max="150"
              />
            </div>
          </div>
          
          <div style={styles.field}>
            <label style={styles.checkboxLabel}>
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
                style={styles.checkbox}
              />
              Person is deceased
            </label>
          </div>

          {formData.isDeceased && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>Remembrance symbol</span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Optional</span>
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
                size={52}
              />
            </div>
          )}
          
          <div style={styles.footer}>
            <button type="button" onClick={handleCancel} style={styles.cancelButton}>
              {isNewPerson ? <><Trash2 size={16} /> Delete</> : 'Cancel'}
            </button>
            <button type="submit" style={styles.submitButton}>
              <Save size={16} />
              Save Person
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
    animation: 'slideUp 0.3s ease-out'
  },
  header: {
    padding: '24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
    color: '#111827'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    color: '#6b7280',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  banner: {
    margin: '0 24px',
    padding: '12px 16px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500'
  },
  form: {
    padding: '24px'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  field: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
    transition: 'all 0.2s',
    outline: 'none'
  },
  checkbox: {
    width: '16px',
    height: '16px',
    marginRight: '8px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer'
  },
  footer: {
    marginTop: '32px',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#6b7280'
  },
  submitButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#3b82f6',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }
};

export default NewPersonModal;