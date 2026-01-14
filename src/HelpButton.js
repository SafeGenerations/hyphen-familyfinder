import React from 'react';
import { HelpCircle } from 'lucide-react';

const HelpButton = ({ onShowTutorial }) => (
  <button
    onClick={onShowTutorial}
    title="Tutorial"
    style={{
      position: 'fixed',
      left: '20px',
      bottom: '80px',
      backgroundColor: '#6b7280',
      color: 'white',
      border: 'none',
      borderRadius: '24px',
      padding: '12px 16px',
      cursor: 'pointer',
      zIndex: 3000,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}
  >
    <HelpCircle size={20} />
  </button>
);

export default HelpButton;
