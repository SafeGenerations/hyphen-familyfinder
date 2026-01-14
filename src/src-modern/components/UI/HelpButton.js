import React, { useState, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

const HelpButton = ({ onShowTutorial }) => {
  const [showHelp, setShowHelp] = useState(false);

  // Detect OS for proper key display
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const altKey = isMac ? 'Option' : 'Alt';
  const ctrlKey = isMac ? 'Cmd' : 'Ctrl';

  const shortcutCategories = [
    {
      title: 'Canvas Navigation',
      shortcuts: [
        { key: 'Space + Drag', action: 'Pan canvas' },
        { key: `${ctrlKey} + =`, action: 'Zoom in' },
        { key: `${ctrlKey} + -`, action: 'Zoom out' },
        { key: `${altKey} + 0`, action: 'Fit to screen' },
        { key: `${altKey} + G`, action: 'Toggle snap to grid' }
      ]
    },
    {
      title: 'File Operations',
      shortcuts: [
        { key: `${altKey} + S`, action: 'Save genogram' },
        { key: `${altKey} + O`, action: 'Open genogram' },
        { key: `${altKey} + N`, action: 'New genogram' },
        { key: `${altKey} + E`, action: 'Export image' },
        { key: `${altKey} + Shift + E`, action: 'Export image' }
      ]
    },
    {
      title: 'Editing',
      shortcuts: [
        { key: `${altKey} + P`, action: 'Add new person' },
        { key: `${altKey} + T`, action: 'Add text box' },
        { key: 'Delete', action: 'Delete selected item' },
        { key: `${ctrlKey} + Z`, action: 'Undo' },
        { key: `${ctrlKey} + Shift + Z`, action: 'Redo' },
        { key: `${ctrlKey} + Y`, action: 'Redo (Windows)' }
      ]
    },
    {
      title: 'View',
      shortcuts: [
        { key: `${altKey} + Shift + A`, action: 'Auto-arrange' },
        { key: 'Escape', action: 'Cancel operation / Clear selection' },
        { key: '? / F1', action: 'Show this help' }
      ]
    }
  ];

  // Listen for F1 key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1' || (e.key === '?' && !e.target.matches('input, textarea, select'))) {
        e.preventDefault();
        setShowHelp(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Help button */}
      <button
        onClick={() => setShowHelp(true)}
        style={{
          position: 'fixed',
          bottom: '80px',
          left: '24px',
          background: 'white',
          color: '#6366f1',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '2px solid #e2e8f0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 30,
          transition: 'all 0.2s ease'
        }}
        title="Help (F1 or ?)"
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }}
      >
        <HelpCircle size={20} />
      </button>

      {/* Help modal */}
      {showHelp && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowHelp(false);
          }
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1e293b'
              }}>
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1e293b'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{
              flex: 1,
              overflow: 'auto',
              marginBottom: '24px',
              paddingRight: '8px'
            }}>
              {shortcutCategories.map((category, catIndex) => (
                <div key={catIndex} style={{ marginBottom: '24px' }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#475569',
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    {category.title}
                  </h3>
                  {category.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: '1px solid #f8fafc'
                      }}
                    >
                      <kbd style={{
                        background: '#f1f5f9',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        color: '#475569',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        whiteSpace: 'nowrap'
                      }}>
                        {shortcut.key}
                      </kbd>
                      <span style={{
                        fontSize: '14px',
                        color: '#64748b',
                        marginLeft: '12px',
                        textAlign: 'right'
                      }}>
                        {shortcut.action}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: '16px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  setShowHelp(false);
                  if (onShowTutorial) onShowTutorial();
                }}
                style={{
                  padding: '10px 24px',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#4f46e5'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#6366f1'}
              >
                Show Tutorial
              </button>
              <button
                onClick={() => setShowHelp(false)}
                style={{
                  padding: '10px 24px',
                  background: 'transparent',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#64748b',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.color = '#475569';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpButton;