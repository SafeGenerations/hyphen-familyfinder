// src/src-modern/components/Debug/ContextDebugger.js
import React from 'react';
import { useGenogram } from '../../contexts/GenogramContext';

const ContextDebugger = () => {
  const { state, actions } = useGenogram();
  const [showDebug, setShowDebug] = React.useState(false);

  // Get all action names
  const actionNames = Object.keys(actions).sort();
  
  // Get all state keys
  const stateKeys = Object.keys(state).sort();

  return (
    <>
      {/* Debug Toggle Button */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          padding: '8px 16px',
          background: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
      >
        {showDebug ? 'Hide' : 'Show'} Context Debug
      </button>

      {/* Debug Panel */}
      {showDebug && (
        <div
          style={{
            position: 'fixed',
            bottom: '70px',
            left: '20px',
            width: '400px',
            maxHeight: '60vh',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            padding: '20px',
            overflow: 'auto',
            zIndex: 9999,
            fontFamily: 'monospace',
            fontSize: '12px'
          }}
        >
          <h3 style={{ marginTop: 0, fontFamily: 'sans-serif' }}>
            Genogram Context Debug
          </h3>
          
          {/* Actions Section */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ 
              marginBottom: '10px', 
              color: '#6366f1',
              fontFamily: 'sans-serif' 
            }}>
              Available Actions ({actionNames.length})
            </h4>
            <div style={{
              background: '#f8fafc',
              padding: '10px',
              borderRadius: '8px',
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              {actionNames.map(action => (
                <div key={action} style={{ 
                  padding: '2px 0',
                  color: '#475569'
                }}>
                  • {action}
                </div>
              ))}
            </div>
          </div>

          {/* State Section */}
          <div>
            <h4 style={{ 
              marginBottom: '10px', 
              color: '#10b981',
              fontFamily: 'sans-serif' 
            }}>
              State Keys ({stateKeys.length})
            </h4>
            <div style={{
              background: '#f8fafc',
              padding: '10px',
              borderRadius: '8px',
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              {stateKeys.map(key => (
                <div key={key} style={{ 
                  padding: '2px 0',
                  color: '#475569',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>• {key}</span>
                  <span style={{ 
                    color: '#94a3b8',
                    fontSize: '11px'
                  }}>
                    {typeof state[key]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick State Info */}
          <div style={{
            marginTop: '20px',
            padding: '10px',
            background: '#fef3c7',
            borderRadius: '8px',
            fontFamily: 'sans-serif',
            fontSize: '13px'
          }}>
            <strong>Quick Info:</strong>
            <div>People: {state.people?.length || 0}</div>
            <div>Relationships: {state.relationships?.length || 0}</div>
            <div>Selected: {
              state.selectedPerson ? 'Person' :
              state.selectedRelationship ? 'Relationship' :
              state.selectedHousehold ? 'Household' :
              'None'
            }</div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContextDebugger;