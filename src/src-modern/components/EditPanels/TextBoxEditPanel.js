// src/components/EditPanels/TextBoxEditPanel.js
import React from 'react';
import { Trash2 } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';

const TextBoxEditPanel = () => {
  const { state, actions } = useGenogram();
  const { selectedTextBox } = state;

  if (!selectedTextBox) return null;

  const updateTextBox = (updates) => {
    actions.updateTextBox(selectedTextBox.id, updates);
  };

  // Simple text extraction from HTML
  const getPlainText = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleTextChange = (e) => {
    // Convert plain text to simple HTML with line breaks
    const html = e.target.value
      .split('\n')
      .map(line => line || '<br>')
      .join('<br>');
    updateTextBox({ html });
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '24px',
      padding: '0 4px', // Add small padding to prevent edge touching
      marginBottom: '16px' // Extra bottom margin for mobile
    }}>
      {/* Text Content */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Text Content
        </label>
        <textarea
          value={getPlainText(selectedTextBox.html || '')}
          onChange={handleTextChange}
          placeholder="Enter your text here..."
          style={{
            width: '100%',
            height: '120px',
            border: '1px solid #d1d5db',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '16px', // Larger font for mobile
            backgroundColor: '#f9fafb',
            resize: 'vertical',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            lineHeight: '1.5'
          }}
        />
      </div>

      {/* Font & Styling */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Font & Style
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Font Family
            </label>
            <select
              value={selectedTextBox.fontFamily || 'system'}
              onChange={(e) => {
                const fontMap = {
                  'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  'arial': 'Arial, sans-serif',
                  'helvetica': '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  'georgia': 'Georgia, "Times New Roman", Times, serif',
                  'times': '"Times New Roman", Times, serif',
                  'courier': '"Courier New", Courier, monospace',
                  'verdana': 'Verdana, Geneva, sans-serif'
                };
                updateTextBox({ fontFamily: fontMap[e.target.value] });
              }}
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '14px',
                backgroundColor: '#f9fafb'
              }}
            >
              <option value="system">System Default</option>
              <option value="arial">Arial</option>
              <option value="helvetica">Helvetica</option>
              <option value="georgia">Georgia</option>
              <option value="times">Times New Roman</option>
              <option value="courier">Courier New</option>
              <option value="verdana">Verdana</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Font Size
            </label>
            <input
              type="range"
              min="10"
              max="24"
              value={selectedTextBox.fontSize || 14}
              onChange={(e) => updateTextBox({ fontSize: parseInt(e.target.value) })}
              style={{
                width: '100%',
                marginBottom: '4px'
              }}
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: '12px', 
              color: '#6b7280' 
            }}>
              <span>10px</span>
              <span>{selectedTextBox.fontSize || 14}px</span>
              <span>24px</span>
            </div>
          </div>
        </div>
      </div>

      {/* Size */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Size
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Width
            </label>
            <input
              type="number"
              value={selectedTextBox.width}
              onChange={(e) => updateTextBox({ width: parseInt(e.target.value) || 150 })}
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '14px',
                backgroundColor: '#f9fafb'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Height
            </label>
            <input
              type="number"
              value={selectedTextBox.height}
              onChange={(e) => updateTextBox({ height: parseInt(e.target.value) || 50 })}
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '14px',
                backgroundColor: '#f9fafb'
              }}
            />
          </div>
        </div>
      </div>

      {/* Position */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Position
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              X
            </label>
            <input
              type="number"
              value={Math.round(selectedTextBox.x)}
              onChange={(e) => updateTextBox({ x: parseInt(e.target.value) || 0 })}
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '14px',
                backgroundColor: '#f9fafb'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Y
            </label>
            <input
              type="number"
              value={Math.round(selectedTextBox.y)}
              onChange={(e) => updateTextBox({ y: parseInt(e.target.value) || 0 })}
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '14px',
                backgroundColor: '#f9fafb'
              }}
            />
          </div>
        </div>
      </div>

      {/* Color */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          Text Color
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['#1f2937', '#374151', '#6b7280', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'].map(color => (
            <button
              key={color}
              onClick={() => updateTextBox({ color })}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: color,
                border: selectedTextBox.color === color ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            />
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          💡 Quick Tips
        </label>
        <div style={{
          padding: '16px',
          backgroundColor: '#f0f9ff',
          borderRadius: '12px',
          border: '1px solid #bae6fd',
          fontSize: '14px',
          color: '#0369a1',
          lineHeight: '1.5'
        }}>
          <p style={{ margin: '0 0 8px 0' }}>📱 <strong>Tap</strong> to select • <strong>Double-tap</strong> to edit</p>
          <p style={{ margin: '0 0 8px 0' }}>✋ <strong>Drag</strong> to move • <strong>Pinch corners</strong> to resize</p>
          <p style={{ margin: '0' }}>⌨️ <strong>Type directly</strong> on canvas when selected</p>
        </div>
      </div>

      {/* Delete Button */}
      <button
        onClick={() => {
          actions.setDeleteConfirmation({
            type: 'textbox',
            title: 'Delete Text',
            message: 'Delete this text box?',
            onConfirm: () => {
              actions.deleteTextBox(selectedTextBox.id);
              actions.setDeleteConfirmation(null);
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
        Delete Text Box
      </button>
    </div>
  );
};

export default TextBoxEditPanel;