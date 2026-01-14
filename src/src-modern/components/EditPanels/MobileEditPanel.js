import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, Trash2, Heart, Users, Link2, Baby, UserX } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import { usePersonActions } from '../../hooks/usePersonActions';
import { calculateAge } from '../../utils/age';
import { normalizeDeceasedSelection } from '../../utils/deceasedSymbolHelpers';
import DeceasedSymbolPicker from '../common/DeceasedSymbolPicker';
import BottomSheet from './BottomSheet';
import RelationshipEditPanel from './RelationshipEditPanel';
import TextBoxEditPanel from './TextBoxEditPanel';

const MobileEditPanel = () => {
  const { state, actions } = useGenogram();
  const { selectedPerson, selectedRelationship, selectedHousehold, selectedTextBox } = state;
  const [activeTab, setActiveTab] = useState('details');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { 
    createSpouse, 
    createParents, 
    createChild,
    startConnectionFromPerson,
    deleteSelectedPerson,
    disconnectChildFromParents
  } = usePersonActions();

  const handleClose = () => {
    actions.clearSelection();
  };

  const { symbol: deceasedSymbolValue, gentle: deceasedGentleValue } = normalizeDeceasedSelection(selectedPerson);

  // Handle escape key to close the panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Don't show if nothing selected
  if (!selectedPerson && !selectedRelationship && !selectedHousehold && !selectedTextBox) {
    return null;
  }

  const handleDelete = () => {
    if (selectedPerson) {
      deleteSelectedPerson();
    } else if (selectedRelationship) {
      actions.deleteRelationship(selectedRelationship.id);
    } else if (selectedHousehold) {
      actions.deleteHousehold(selectedHousehold.id);
      
      // Save to history after household deletion
      actions.saveToHistory({
        people: state.people,
        relationships: state.relationships,
        households: state.households.filter(h => h.id !== selectedHousehold.id),
        textBoxes: state.textBoxes
      });
    } else if (selectedTextBox) {
      actions.deleteTextBox(selectedTextBox.id);
    }
    setShowDeleteConfirm(false);
    handleClose();
  };

  const getTitle = () => {
    if (selectedPerson) return selectedPerson.name;
    if (selectedRelationship) return 'Edit Relationship';
    if (selectedHousehold) return selectedHousehold.name || 'Edit Household';
    if (selectedTextBox) return 'Edit Text';
    return 'Edit';
  };

  const renderPersonEdit = () => {
    if (!selectedPerson) return null;

    const updatePerson = (updates) => {
      actions.updatePerson(selectedPerson.id, updates);
    };

    const hasParents = state.relationships.some(r => r.type === 'child' && r.to === selectedPerson.id);

    return (
      <>
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          {['details', 'actions'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '16px',
                border: 'none',
                backgroundColor: activeTab === tab ? 'white' : 'transparent',
                borderBottom: activeTab === tab ? '2px solid #6366f1' : 'none',
                fontSize: '16px',
                fontWeight: activeTab === tab ? '600' : '400',
                color: activeTab === tab ? '#6366f1' : '#6b7280',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '20px' }}>
          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Name */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '8px' 
                }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={selectedPerson.name}
                  onChange={(e) => updatePerson({ name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    backgroundColor: '#f9fafb'
                  }}
                />
              </div>

              {/* Gender */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '8px' 
                }}>
                  Gender Identity
                </label>
                <select
                  value={selectedPerson.gender}
                  onChange={(e) => updatePerson({ gender: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    backgroundColor: '#f9fafb',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                    paddingRight: '40px'
                  }}
                >
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

              {/* Age and Birth Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                    type="number"
                    value={selectedPerson.age || ''}
                    onChange={(e) => updatePerson({ age: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      backgroundColor: '#f9fafb'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    Birth Date
                  </label>
                  <input
                    type="date"
                    value={selectedPerson.birthDate || ''}
                    onChange={(e) => {
                      const updates = { birthDate: e.target.value };
                      if (e.target.value) {
                        const ageYears = calculateAge(
                          e.target.value,
                          selectedPerson.deathDate,
                          selectedPerson.isDeceased
                        );
                        updates.age = ageYears;
                      }
                      updatePerson(updates);
                    }}
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      backgroundColor: '#f9fafb'
                    }}
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedPerson.isDeceased}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const updates = { isDeceased: checked };
                      if (checked && !selectedPerson.deceasedSymbol) {
                        updates.deceasedSymbol = 'halo';
                      }
                      updatePerson(updates);
                    }}
                    style={{ 
                      width: '20px', 
                      height: '20px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontSize: '16px', color: '#374151' }}>
                    Person is deceased
                  </span>
                </label>

                {selectedPerson.isDeceased && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px 16px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#374151' }}>Remembrance symbol</span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Optional</span>
                    </div>
                    <DeceasedSymbolPicker
                      symbolValue={deceasedSymbolValue}
                      gentleValue={deceasedGentleValue}
                      onChange={(symbol, gentle) =>
                        updatePerson({
                          deceasedSymbol: symbol,
                          deceasedGentleTreatment: gentle
                        })
                      }
                      size={52}
                    />
                  </div>
                )}

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: '#ecfdf5',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedPerson.networkMember || false}
                    onChange={(e) => updatePerson({ networkMember: e.target.checked })}
                    style={{ 
                      width: '20px', 
                      height: '20px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontSize: '16px', color: '#065f46' }}>
                    Network Member
                  </span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={createSpouse}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px',
                  backgroundColor: '#e0e7ff',
                  color: '#6366f1',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <Heart size={24} />
                Add Spouse/Partner
              </button>

              <button
                onClick={() => startConnectionFromPerson('marriage')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px',
                  backgroundColor: '#ede9fe',
                  color: '#8b5cf6',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <Link2 size={24} />
                Connect to Another Person
              </button>

              {!hasParents && (
                <button
                  onClick={createParents}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  <Users size={24} />
                  Create Parents
                </button>
              )}

              {hasParents && (
                <button
                  onClick={disconnectChildFromParents}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px',
                    backgroundColor: '#fef3c7',
                    color: '#d97706',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  <UserX size={24} />
                  Disconnect from Parents
                </button>
              )}

              <button
                onClick={createChild}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <Baby size={24} />
                Add Child
              </button>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      {/* Full Screen Modal */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'white',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column'
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
            onClick={handleClose}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              color: '#6366f1'
            }}
          >
            <ChevronLeft size={24} />
            Back
          </button>

          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1e293b',
            margin: 0,
            flex: 1,
            textAlign: 'center'
          }}>
            {getTitle()}
          </h2>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              padding: '8px',
              backgroundColor: '#fee2e2',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#dc2626'
            }}
          >
            <Trash2 size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          {selectedPerson && renderPersonEdit()}
          {selectedRelationship && <RelationshipEditPanel />}
          {selectedTextBox && <TextBoxEditPanel />}
          {/* Add other edit panels for households when needed */}
        </div>

        {/* Bottom Action Bar */}
        <div style={{
          padding: '16px 20px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0))',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: 'white'
        }}>
          <button
            onClick={handleClose}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>

      {/* Delete Confirmation */}
      <BottomSheet
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Confirmation"
        height="auto"
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px',
          padding: '20px 0'
        }}>
          <p style={{
            fontSize: '16px',
            color: '#374151',
            textAlign: 'center'
          }}>
            Are you sure you want to delete this? This action cannot be undone.
          </p>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                flex: 1,
                padding: '16px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              style={{
                flex: 1,
                padding: '16px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
};

export default MobileEditPanel;