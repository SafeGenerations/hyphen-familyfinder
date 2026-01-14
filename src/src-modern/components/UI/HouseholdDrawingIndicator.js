// src/components/UI/HouseholdDrawingIndicator.js
import React from 'react';
import { Home } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';

const HouseholdDrawingIndicator = () => {
  const { state, actions } = useGenogram();
  const { isDrawingHousehold, currentHouseholdPoints } = state;

  if (!isDrawingHousehold) return null;

  const instructionText = currentHouseholdPoints.length < 3 
    ? `Click to add points (${currentHouseholdPoints.length} points)`
    : "Click the green starting point or press Enter to close the shape";

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'white',
      border: '2px solid #6366f1',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
      zIndex: 40
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <Home size={20} color="#4338ca" />
        <div>
          <p style={{ 
            color: '#4338ca', 
            fontSize: '14px', 
            fontWeight: '600', 
            margin: '0 0 4px 0' 
          }}>
            Drawing Household Boundary
          </p>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '13px', 
            margin: 0 
          }}>
            Click points to create a freeform boundary around people living together
          </p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{
          backgroundColor: currentHouseholdPoints.length >= 3 ? '#10b981' : '#6366f1',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {instructionText}
        </div>
        <button
          onClick={actions.cancelDrawingHousehold}
          style={{
            backgroundColor: '#ef4444',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Cancel (Esc)
        </button>
      </div>
    </div>
  );
};

export default HouseholdDrawingIndicator;