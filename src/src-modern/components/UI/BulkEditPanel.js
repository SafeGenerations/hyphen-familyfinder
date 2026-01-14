// src/components/UI/BulkEditPanel.js
import React, { useState } from 'react';
import { X, Check, Trash2, Tag, Plus, Minus } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import { CareStatus, FosterCareStatus } from '../../constants/connectionStatus';

const BulkEditPanel = ({ onClose }) => {
  const { state, actions } = useGenogram();
  const [bulkUpdates, setBulkUpdates] = useState({
    networkMember: null, // null = no change, true/false = set value
    careStatus: null,
    fosterCareStatus: null,
    gender: null
  });

  const selectedPeople = state.people.filter(p => state.selectedNodes.includes(p.id));

  const applyBulkUpdates = () => {
    selectedPeople.forEach(person => {
      const updates = {};
      
      if (bulkUpdates.networkMember !== null) {
        updates.networkMember = bulkUpdates.networkMember;
      }
      if (bulkUpdates.careStatus !== null && bulkUpdates.careStatus !== '') {
        updates.careStatus = bulkUpdates.careStatus;
      }
      if (bulkUpdates.fosterCareStatus !== null && bulkUpdates.fosterCareStatus !== '') {
        updates.fosterCareStatus = bulkUpdates.fosterCareStatus;
      }
      if (bulkUpdates.gender !== null && bulkUpdates.gender !== '') {
        updates.gender = bulkUpdates.gender;
      }
      
      if (Object.keys(updates).length > 0) {
        actions.updatePerson({ id: person.id, updates });
      }
    });
    
    onClose();
  };

  const bulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedPeople.length} selected people? This cannot be undone.`)) {
      selectedPeople.forEach(person => {
        actions.deletePerson(person.id);
      });
      actions.clearNodeSelection();
      onClose();
    }
  };

  return (
    <div
      data-bulk-edit-panel="true"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '400px',
        background: 'white',
        boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '2px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        color: 'white'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
            Bulk Edit
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
            {selectedPeople.length} people selected
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            padding: '8px',
            cursor: 'pointer',
            borderRadius: '6px',
            color: 'white',
            display: 'flex',
            alignItems: 'center'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Selected People List */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
              Selected People:
            </h4>
            <div style={{
              maxHeight: '150px',
              overflowY: 'auto',
              padding: '12px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              {selectedPeople.map(person => (
                <div key={person.id} style={{
                  padding: '6px 8px',
                  fontSize: '13px',
                  color: '#6b7280',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  • {person.firstName} {person.lastName}
                </div>
              ))}
            </div>
          </div>

          {/* Network Member Toggle */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Network Member
            </label>
            <select
              value={bulkUpdates.networkMember === null ? '' : bulkUpdates.networkMember.toString()}
              onChange={(e) => setBulkUpdates({
                ...bulkUpdates,
                networkMember: e.target.value === '' ? null : e.target.value === 'true'
              })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="">No Change</option>
              <option value="true">Set as Network Member</option>
              <option value="false">Remove Network Member</option>
            </select>
          </div>

          {/* Care Status */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Child Welfare Status
            </label>
            <select
              value={bulkUpdates.careStatus || ''}
              onChange={(e) => setBulkUpdates({ ...bulkUpdates, careStatus: e.target.value || null })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="">No Change</option>
              <option value={CareStatus.NOT_APPLICABLE}>Not Applicable</option>
              <option value={CareStatus.IN_CARE}>In Care</option>
              <option value={CareStatus.NEEDS_PLACEMENT}>Needs Placement</option>
              <option value={CareStatus.AT_RISK}>At Risk</option>
            </select>
          </div>

          {/* Foster Care Status */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Foster Care Status
            </label>
            <select
              value={bulkUpdates.fosterCareStatus || ''}
              onChange={(e) => setBulkUpdates({ ...bulkUpdates, fosterCareStatus: e.target.value || null })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="">No Change</option>
              <option value={FosterCareStatus.NOT_APPLICABLE}>Not Applicable</option>
              <option value={FosterCareStatus.INTERESTED}>Interested</option>
              <option value={FosterCareStatus.IN_PROCESS}>In Process</option>
              <option value={FosterCareStatus.LICENSED}>Licensed</option>
              <option value={FosterCareStatus.ACTIVE}>Active</option>
              <option value={FosterCareStatus.INACTIVE}>Inactive</option>
            </select>
          </div>

          {/* Gender */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Gender
            </label>
            <select
              value={bulkUpdates.gender || ''}
              onChange={(e) => setBulkUpdates({ ...bulkUpdates, gender: e.target.value || null })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="">No Change</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Tags */}
          {state.tagDefinitions.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                <Tag size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                Tags
              </label>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                {state.tagDefinitions.map(tag => {
                  const allHaveTag = selectedPeople.every(p => p.tags?.includes(tag.id));
                  const someHaveTag = selectedPeople.some(p => p.tags?.includes(tag.id));
                  
                  return (
                    <div key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: tag.color,
                        border: '1px solid rgba(0,0,0,0.1)',
                        flexShrink: 0
                      }} />
                      <span style={{ flex: 1, fontSize: '13px', color: '#374151' }}>{tag.name}</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => actions.bulkAddTag(state.selectedNodes, tag.id)}
                          disabled={allHaveTag}
                          style={{
                            padding: '4px 8px',
                            background: allHaveTag ? '#d1d5db' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: allHaveTag ? 'not-allowed' : 'pointer',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                          title={allHaveTag ? 'All selected have this tag' : 'Add to all selected'}
                        >
                          <Plus size={12} />
                          Add
                        </button>
                        <button
                          onClick={() => actions.bulkRemoveTag(state.selectedNodes, tag.id)}
                          disabled={!someHaveTag}
                          style={{
                            padding: '4px 8px',
                            background: !someHaveTag ? '#d1d5db' : '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: !someHaveTag ? 'not-allowed' : 'pointer',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                          title={!someHaveTag ? 'None have this tag' : 'Remove from all selected'}
                        >
                          <Minus size={12} />
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px', fontStyle: 'italic' }}>
                Tip: Tags can be managed in the toolbar
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Footer Actions */}
      <div style={{
        padding: '16px 20px',
        borderTop: '2px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <button
          onClick={applyBulkUpdates}
          style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Check size={16} />
          Apply Changes to {selectedPeople.length} People
        </button>

        <button
          onClick={bulkDelete}
          style={{
            width: '100%',
            padding: '12px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Trash2 size={16} />
          Delete Selected
        </button>
      </div>
    </div>
  );
};

export default BulkEditPanel;
