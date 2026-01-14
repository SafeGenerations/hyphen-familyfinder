// src/components/EditPanels/HouseholdEditPanel.js
import React from 'react';
import { Trash2 } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';

function MembersSection({ household }) {
  const { state } = useGenogram();
  
  if (!household || !household.members || household.members.length === 0) {
    return (
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Members
        </label>
        <div style={{
          padding: '16px',
          textAlign: 'center',
          color: '#6b7280',
          backgroundColor: '#f9fafb',
          border: '1px dashed #d1d5db',
          borderRadius: '12px'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>No members in this household</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
            People are automatically added when they are positioned inside the household boundary
          </p>
        </div>
      </div>
    );
  }

  // Get person details for each member
  const members = household.members
    .map(memberId => state.people.find(p => p.id === memberId))
    .filter(Boolean); // Remove any null/undefined entries

  return (
    <div>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
        Members ({members.length})
      </label>
      <div style={{
        maxHeight: '400px',
        overflowY: 'auto',
        border: '1px solid #d1d5db',
        borderRadius: '12px',
        backgroundColor: '#f9fafb'
      }}>
        {members.map(person => (
          <div 
            key={person.id} 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ fontSize: '16px', opacity: 0.6 }}>👤</span>
            <span style={{ flex: 1, fontWeight: '500', fontSize: '14px', color: '#374151' }}>
              {person.name || 'Unnamed'}
            </span>
            {person.age && (
              <span style={{ color: '#6b7280', fontSize: '13px' }}>
                ({person.age})
              </span>
            )}
          </div>
        ))}
      </div>
      <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
        Members are automatically updated when people or the household boundary move
      </p>
    </div>
  );
}

export default function HouseholdEditPanel({ household, onUpdate, onClose }) {
  const { state, actions } = useGenogram();
  const { selectedHousehold } = state;

  if (!selectedHousehold) return null;

  const updateHousehold = (updates) => {
    actions.updateHousehold(selectedHousehold.id, updates);
    
    // Save to history after household property updates
    actions.saveToHistory({
      people: state.people,
      relationships: state.relationships,
      households: state.households,
      textBoxes: state.textBoxes
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Household Name */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Household Name
        </label>
        <input
          type="text"
          value={selectedHousehold.name}
          onChange={(e) => updateHousehold({ name: e.target.value })}
          style={{
            width: '100%',
            border: '1px solid #d1d5db',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            backgroundColor: '#f9fafb'
          }}
        />
      </div>

      {/* Colors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Border Color
          </label>
          <input
            type="color"
            value={selectedHousehold.color || '#6366f1'}
            onChange={(e) => updateHousehold({ color: e.target.value })}
            style={{
              width: '100%',
              height: '48px',
              border: '1px solid #d1d5db',
              borderRadius: '12px',
              padding: '8px',
              backgroundColor: '#f9fafb',
              cursor: 'pointer'
            }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Label Color
          </label>
          <input
            type="color"
            value={selectedHousehold.labelColor || selectedHousehold.color || '#6366f1'}
            onChange={(e) => updateHousehold({ labelColor: e.target.value })}
            style={{
              width: '100%',
              height: '48px',
              border: '1px solid #d1d5db',
              borderRadius: '12px',
              padding: '8px',
              backgroundColor: '#f9fafb',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>

      {/* Border Style */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Border Style
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => updateHousehold({ borderStyle: 'curved', smoothness: 0.25 })}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: `2px solid ${(selectedHousehold.borderStyle || 'curved') === 'curved' ? '#6366f1' : '#d1d5db'}`,
              borderRadius: '12px',
              backgroundColor: (selectedHousehold.borderStyle || 'curved') === 'curved' ? '#eff6ff' : '#f9fafb',
              color: (selectedHousehold.borderStyle || 'curved') === 'curved' ? '#6366f1' : '#6b7280',
              fontWeight: '500',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Curved
          </button>
          <button
            onClick={() => updateHousehold({ borderStyle: 'straight', smoothness: 0 })}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: `2px solid ${selectedHousehold.borderStyle === 'straight' ? '#6366f1' : '#d1d5db'}`,
              borderRadius: '12px',
              backgroundColor: selectedHousehold.borderStyle === 'straight' ? '#eff6ff' : '#f9fafb',
              color: selectedHousehold.borderStyle === 'straight' ? '#6366f1' : '#6b7280',
              fontWeight: '500',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Straight
          </button>
        </div>
      </div>

      {/* Label Position */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Label Position
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
          <button
            onClick={() => updateHousehold({ labelPosition: 'top' })}
            style={{
              padding: '10px 12px',
              border: `2px solid ${(selectedHousehold.labelPosition || 'top') === 'top' ? '#6366f1' : '#d1d5db'}`,
              borderRadius: '12px',
              backgroundColor: (selectedHousehold.labelPosition || 'top') === 'top' ? '#eff6ff' : '#f9fafb',
              color: (selectedHousehold.labelPosition || 'top') === 'top' ? '#6366f1' : '#6b7280',
              fontWeight: '500',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Top
          </button>
          <button
            onClick={() => updateHousehold({ labelPosition: 'center' })}
            style={{
              padding: '10px 12px',
              border: `2px solid ${selectedHousehold.labelPosition === 'center' ? '#6366f1' : '#d1d5db'}`,
              borderRadius: '12px',
              backgroundColor: selectedHousehold.labelPosition === 'center' ? '#eff6ff' : '#f9fafb',
              color: selectedHousehold.labelPosition === 'center' ? '#6366f1' : '#6b7280',
              fontWeight: '500',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Center
          </button>
          <button
            onClick={() => updateHousehold({ labelPosition: 'bottom' })}
            style={{
              padding: '10px 12px',
              border: `2px solid ${selectedHousehold.labelPosition === 'bottom' ? '#6366f1' : '#d1d5db'}`,
              borderRadius: '12px',
              backgroundColor: selectedHousehold.labelPosition === 'bottom' ? '#eff6ff' : '#f9fafb',
              color: selectedHousehold.labelPosition === 'bottom' ? '#6366f1' : '#6b7280',
              fontWeight: '500',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Bottom
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={() => updateHousehold({ labelPosition: 'left' })}
            style={{
              padding: '10px 12px',
              border: `2px solid ${selectedHousehold.labelPosition === 'left' ? '#6366f1' : '#d1d5db'}`,
              borderRadius: '12px',
              backgroundColor: selectedHousehold.labelPosition === 'left' ? '#eff6ff' : '#f9fafb',
              color: selectedHousehold.labelPosition === 'left' ? '#6366f1' : '#6b7280',
              fontWeight: '500',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Left
          </button>
          <button
            onClick={() => updateHousehold({ labelPosition: 'right' })}
            style={{
              padding: '10px 12px',
              border: `2px solid ${selectedHousehold.labelPosition === 'right' ? '#6366f1' : '#d1d5db'}`,
              borderRadius: '12px',
              backgroundColor: selectedHousehold.labelPosition === 'right' ? '#eff6ff' : '#f9fafb',
              color: selectedHousehold.labelPosition === 'right' ? '#6366f1' : '#6b7280',
              fontWeight: '500',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Right
          </button>
        </div>
      </div>

      {/* Border Smoothness - only show if curved style selected */}
      {(selectedHousehold.borderStyle || 'curved') === 'curved' && (
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Curve Intensity
          </label>
          <div style={{ marginBottom: '8px' }}>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.05"
              value={selectedHousehold.smoothness || 0.25}
              onChange={(e) => updateHousehold({ smoothness: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${((selectedHousehold.smoothness || 0.25) / 0.5) * 100}%, #6366f1 ${((selectedHousehold.smoothness || 0.25) / 0.5) * 100}%, #6366f1 100%)`,
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
            <span>Gentle</span>
            <span style={{ color: '#6366f1', fontWeight: '500' }}>
              {Math.round(((selectedHousehold.smoothness || 0.25) / 0.5) * 100)}%
            </span>
            <span>Very curved</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Instructions
        </label>
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '1px solid #d1d5db',
          fontSize: '13px',
          color: '#6b7280'
        }}>
          <p style={{ margin: '0 0 8px 0' }}>• Click and drag the boundary to move it</p>
          <p style={{ margin: '0 0 8px 0' }}>• Click and drag points to reshape</p>
          <p style={{ margin: '0 0 8px 0' }}>• Right-click boundary to add points</p>
          <p style={{ margin: '0 0 8px 0' }}>• Right-click points to delete them</p>
          <p style={{ margin: '0' }}>• Click the × button to delete</p>
        </div>
      </div>

      {/* Members Section */}
      <MembersSection household={selectedHousehold} />

      {/* Notes */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Notes
        </label>
        <textarea
          value={selectedHousehold.notes || ''}
          onChange={(e) => updateHousehold({ notes: e.target.value })}
          placeholder="Add notes about this household..."
          style={{
            width: '100%',
            height: '80px',
            border: '1px solid #d1d5db',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            backgroundColor: '#f9fafb',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Display Order */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Display Order
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => actions.bringToFront('household', selectedHousehold.id)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 12px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}
            title="Bring to front (Page Up)"
          >
            ⬆️ Front
          </button>
          
          <button
            onClick={() => actions.sendToBack('household', selectedHousehold.id)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 12px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}
            title="Send to back (Page Down)"
          >
            ⬇️ Back
          </button>
        </div>
      </div>

      {/* Delete Button */}
      <button
        onClick={() => {
          actions.setDeleteConfirmation({
            type: 'household',
            title: 'Delete Household',
            message: `Delete ${selectedHousehold.name}?`,
            onConfirm: () => {
              actions.deleteHousehold(selectedHousehold.id);
              actions.setDeleteConfirmation(null);
              
              // Save to history after household deletion
              actions.saveToHistory({
                people: state.people,
                relationships: state.relationships,
                households: state.households.filter(h => h.id !== selectedHousehold.id),
                textBoxes: state.textBoxes
              });
            },
            onCancel: () => actions.setDeleteConfirmation(null)
          });
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid #fecaca',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        <Trash2 size={16} />
        Delete Household
      </button>
    </div>
  );
}