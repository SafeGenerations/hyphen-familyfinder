// src/components/UI/SidePanel.js
import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';
import NodeEditPanel from '../EditPanels/NodeEditPanel';
import RelationshipEditPanel from '../EditPanels/RelationshipEditPanel';
import HouseholdEditPanel from '../EditPanels/HouseholdEditPanel';
import TextBoxEditPanel from '../EditPanels/TextBoxEditPanel';

const SidePanel = () => {
  const { state, actions } = useGenogram();
  const {
    sidePanelOpen,
    selectedPerson,
    selectedRelationship,
    selectedHousehold,
    selectedTextBox,
    focusedNodeId
  } = state;

  const focusActive = selectedPerson && focusedNodeId === selectedPerson.id;

  // Don't show if nothing is selected
  if (!selectedPerson && !selectedRelationship && !selectedHousehold && !selectedTextBox) {
    return null;
  }

  const getTitle = () => {
    if (selectedPerson) return `Edit: ${selectedPerson.name}`;
    if (selectedRelationship) return 'Edit Relationship';
    if (selectedHousehold) return 'Edit Household';
    if (selectedTextBox) return 'Edit Text';
    return 'Details';
  };

  const renderContent = () => {
  if (selectedPerson) return <NodeEditPanel />;
    if (selectedRelationship) return <RelationshipEditPanel />;
    if (selectedHousehold) return <HouseholdEditPanel />;
    if (selectedTextBox) return <TextBoxEditPanel />;
    return null;
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={actions.toggleSidePanel}
        style={{
          position: 'fixed',
          right: sidePanelOpen ? '384px' : '0',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 40,
          background: 'white',
          borderRadius: '8px 0 0 8px',
          boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
          padding: '8px',
          border: '1px solid #e2e8f0',
          borderRight: 'none',
          cursor: 'pointer',
          transition: 'right 0.3s ease-out'
        }}
      >
        {sidePanelOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
      
      {/* Panel */}
      <div style={{
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100%',
        background: 'white',
        boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
        zIndex: 30,
        transform: sidePanelOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-out',
        width: '384px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '24px', 
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1e293b', 
            margin: 0 
          }}>
            {getTitle()}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {focusActive && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#e0f2fe',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  color: '#0369a1',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                <span>Focus Mode</span>
                <button
                  onClick={actions.exitFocusMode}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#0369a1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  aria-label="Exit focus mode"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <button
              onClick={actions.clearSelection}
              style={{
                padding: '4px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          padding: '24px'
        }}>
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default SidePanel;