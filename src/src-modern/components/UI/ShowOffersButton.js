// src/src-modern/components/UI/ShowOffersButton.js
import React from 'react';
import { Gift } from 'lucide-react';

const ShowOffersButton = ({ onClick, visible, hasNewOffer = false }) => {
  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        left: '20px',
        bottom: '140px', // Position above help and feedback buttons
        backgroundColor: '#764ba2',
        color: 'white',
        border: 'none',
        borderRadius: '24px',
        padding: '12px 16px',
        cursor: 'pointer',
        zIndex: 30,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s',
        animation: 'pulse 2s infinite'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#667eea';
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#764ba2';
        e.currentTarget.style.transform = 'scale(1)';
      }}
      title="View special offers"
    >
      <Gift size={18} />
      <span>Show Offers</span>
      {hasNewOffer && (
        <span style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          background: '#ef4444',
          color: 'white',
          fontSize: '11px',
          fontWeight: 'bold',
          padding: '2px 6px',
          borderRadius: '10px',
          border: '2px solid white'
        }}>
          NEW
        </span>
      )}
      <style jsx>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          50% {
            box-shadow: 0 4px 20px rgba(118, 75, 162, 0.4);
          }
          100% {
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
        }
      `}</style>
    </button>
  );
};

export default ShowOffersButton;