// src/components/UI/ConnectionIndicator.js
import React from 'react';
import { useGenogram } from '../../contexts/GenogramContext';

const ConnectionIndicator = () => {
  const { state, actions } = useGenogram();
  const { isConnecting, connectingFrom, connectingFromMarriage, connectingType } = state;

  if (!isConnecting) return null;

  const getMessage = () => {
    if (connectingFromMarriage) {
      return 'Click a person to connect as child';
    }
    if (connectingType === 'child' && connectingFrom) {
      return 'Click the relationship bubble between the parents';
    }
    return `Creating ${connectingType} relationship`;
  };

  const getHelpText = () => {
    if (connectingType === 'child' && connectingFrom) {
      return 'The circle on the line between two parents';
    }
    return null;
  };

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'white',
      border: '2px solid #fbbf24',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
      zIndex: 40
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '8px',
          height: '8px',
          background: '#f59e0b',
          borderRadius: '50%',
          animation: 'pulse 2s infinite'
        }} />
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
            {getMessage()}
          </div>
          {getHelpText() && (
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              {getHelpText()}
            </div>
          )}
        </div>
        <button
          onClick={actions.cancelConnection}
          style={{
            backgroundColor: '#f59e0b',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.5);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ConnectionIndicator;