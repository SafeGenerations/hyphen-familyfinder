// src/src-modern/components/UI/SelectionIndicator.js
import React, { useState } from 'react';
import { CheckSquare, X, HelpCircle } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';

const SelectionIndicator = () => {
  const { state, actions } = useGenogram();
  const { selectedNodes } = state;
  const [showHelp, setShowHelp] = useState(false);

  if (!selectedNodes || selectedNodes.length === 0) return null;

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#8b5cf6',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 999,
        fontSize: '14px',
        fontWeight: '500',
        animation: 'slideUp 0.3s ease-out'
      }}>
        <CheckSquare size={18} />
        <span>
          {selectedNodes.length} {selectedNodes.length === 1 ? 'person' : 'people'} selected
        </span>
        
        <button
          onClick={() => setShowHelp(!showHelp)}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '6px',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: 'white'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
          title="Show help"
        >
          <HelpCircle size={14} />
        </button>

        <button
          onClick={() => actions.clearNodeSelection()}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '6px',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: 'white'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
          title="Clear selection"
        >
          <X size={14} />
        </button>

        <style>
          {`
            @keyframes slideUp {
              from {
                transform: translateY(20px);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
          `}
        </style>
      </div>

      {/* Help Tooltip */}
      {showHelp && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          backgroundColor: 'white',
          color: '#374151',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 999,
          fontSize: '13px',
          maxWidth: '280px',
          animation: 'slideUp 0.2s ease-out'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>
            Multi-Select Controls
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#6b7280' }}>
            <div><strong>Ctrl+Click:</strong> Add/remove from selection</div>
            <div><strong>Shift+Click:</strong> Range selection (coming soon)</div>
            <div><strong>Right-Click:</strong> Bulk operations menu</div>
            <div><strong>Regular Click:</strong> Clear selection</div>
            <div><strong>Click Empty:</strong> Clear selection</div>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '6px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              color: '#374151'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
          >
            Got it!
          </button>
        </div>
      )}
    </>
  );
};

export default SelectionIndicator;
