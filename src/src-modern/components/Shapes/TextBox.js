// src/src-modern/components/Shapes/TextBox.js
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGenogram } from '../../contexts/GenogramContext';

const GRID_SIZE = 20;

const TextBox = ({ textBox }) => {
  const { state, actions } = useGenogram();
  const { selectedTextBox, snapToGrid, pan, zoom } = state;
  const textRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const isSelected = selectedTextBox?.id === textBox.id;

  const snapToGridFunc = useCallback((value) => {
    if (!snapToGrid) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, [snapToGrid]);

  // Convert screen coordinates to canvas coordinates
  const getCanvasCoords = useCallback((e) => {
    const svg = e.currentTarget.closest('svg');
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgCoords = pt.matrixTransform(svg.getScreenCTM().inverse());
    return {
      x: (svgCoords.x - pan.x) / zoom,
      y: (svgCoords.y - pan.y) / zoom
    };
  }, [pan, zoom]);

  // Sync HTML content
  useEffect(() => {
    if (textRef.current && textRef.current.innerHTML !== textBox.html && !isEditing) {
      textRef.current.innerHTML = textBox.html;
    }
  }, [textBox.html, isEditing]);

  const handleInput = (e) => {
    const el = e.currentTarget;
    actions.updateTextBox(textBox.id, { 
      html: el.innerHTML
    });
  };

  // Handle pointer down for dragging
  const handlePointerDown = useCallback((e) => {
    // Don't start drag if clicking on the text content itself when it's editable
    if (e.target === textRef.current && isEditing) return;
    
    e.stopPropagation();
    e.preventDefault();

    // Capture the pointer to prevent canvas interference
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    const initialCoords = getCanvasCoords(e);
    const dragOffset = {
      x: initialCoords.x - textBox.x,
      y: initialCoords.y - textBox.y
    };
    const startY = textBox.y;
    setIsDragging(true);

    const handlePointerMove = (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      const canvasCoords = getCanvasCoords(e);
      const newX = snapToGridFunc(canvasCoords.x - dragOffset.x);
      let newY = snapToGridFunc(canvasCoords.y - dragOffset.y);
      if (e.shiftKey) {
        newY = startY;
      }

      actions.updateTextBox(textBox.id, { x: newX, y: newY });
    };

    const handlePointerUp = (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      // Release pointer capture
      if (e.currentTarget.releasePointerCapture) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      
      setIsDragging(false);
      e.currentTarget.removeEventListener('pointermove', handlePointerMove);
      e.currentTarget.removeEventListener('pointerup', handlePointerUp);
      e.currentTarget.removeEventListener('pointercancel', handlePointerUp);
      
      // Save to history after dragging
      actions.saveToHistory({
        people: state.people,
        relationships: state.relationships,
        households: state.households,
        textBoxes: state.textBoxes
      });
    };

    e.currentTarget.addEventListener('pointermove', handlePointerMove);
    e.currentTarget.addEventListener('pointerup', handlePointerUp);
    e.currentTarget.addEventListener('pointercancel', handlePointerUp);
  }, [textBox, snapToGridFunc, actions, isEditing, state, getCanvasCoords]);

  // Handle resize
  const handleResizePointerDown = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();

    // Capture the pointer to prevent canvas interference
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    const initialCoords = getCanvasCoords(e);
    
    // Calculate initial offset from mouse to resize handle
    const handleX = textBox.x + textBox.width;
    const handleY = textBox.y + textBox.height;
    const offsetX = handleX - initialCoords.x;
    const offsetY = handleY - initialCoords.y;
    
    setIsResizing(true);

    let currentWidth = textBox.width;
    let currentHeight = textBox.height;

    const handlePointerMove = (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      const canvasCoords = getCanvasCoords(e);
      
      // Calculate new dimensions based on mouse position + offset
      currentWidth = Math.max(50, (canvasCoords.x + offsetX) - textBox.x);
      currentHeight = Math.max(20, (canvasCoords.y + offsetY) - textBox.y);
      
      actions.updateTextBox(textBox.id, { 
        width: currentWidth, 
        height: currentHeight 
      });
    };

    const handlePointerUp = (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      // Release pointer capture
      if (e.currentTarget.releasePointerCapture) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      
      setIsResizing(false);
      
      // Snap to grid on mouse up if enabled
      if (snapToGrid) {
        actions.updateTextBox(textBox.id, { 
          width: snapToGridFunc(currentWidth), 
          height: snapToGridFunc(currentHeight) 
        });
      }
      
      e.currentTarget.removeEventListener('pointermove', handlePointerMove);
      e.currentTarget.removeEventListener('pointerup', handlePointerUp);
      e.currentTarget.removeEventListener('pointercancel', handlePointerUp);
      
      // Save to history after resizing
      actions.saveToHistory({
        people: state.people,
        relationships: state.relationships,
        households: state.households,
        textBoxes: state.textBoxes
      });
    };

    e.currentTarget.addEventListener('pointermove', handlePointerMove);
    e.currentTarget.addEventListener('pointerup', handlePointerUp);
    e.currentTarget.addEventListener('pointercancel', handlePointerUp);
  }, [textBox.id, textBox.x, textBox.y, textBox.width, textBox.height, actions, snapToGrid, snapToGridFunc, state, getCanvasCoords]);

  // Handle selection changes - blur if we're no longer selected
  useEffect(() => {
    if (!isSelected && isEditing) {
      setIsEditing(false);
      if (textRef.current) {
        textRef.current.blur();
      }
    }
  }, [isSelected, isEditing]);

  // Handle keyboard input to start editing
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Check if this text box is selected and we're not already editing
      // AND make sure the quick add modal is not open
      if (isSelected && !isEditing && !state.quickAddOpen && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Check if it's a printable character
        if (e.key.length === 1) {
          e.preventDefault();
          setIsEditing(true);
          setTimeout(() => {
            if (textRef.current) {
              textRef.current.focus();
              // Place cursor at end of existing content
              const range = document.createRange();
              const selection = window.getSelection();
              range.selectNodeContents(textRef.current);
              range.collapse(false); // false = collapse to end
              selection.removeAllRanges();
              selection.addRange(range);
              // Insert the typed character at cursor position
              document.execCommand('insertText', false, e.key);
            }
          }, 0);
        }
      }
    };

    if (isSelected) {
      document.addEventListener('keypress', handleKeyPress);
      return () => document.removeEventListener('keypress', handleKeyPress);
    }
  }, [isSelected, isEditing, textBox.id, actions, state.quickAddOpen]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (!isDragging && !isResizing) {
      // Single click: select without opening edit panel
      actions.selectTextBox({ textBox, openPanel: false });
      
      // Double click: select with edit panel and start editing
      if (e.detail === 2) {
        actions.selectTextBox({ textBox, openPanel: true });
        setIsEditing(true);
        setTimeout(() => {
          if (textRef.current) {
            textRef.current.focus();
            // Select all text
            const range = document.createRange();
            range.selectNodeContents(textRef.current);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }, 0);
      }
    }
  }, [textBox, actions, isDragging, isResizing]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  return (
    <g>
      {/* Background rect for easier clicking/dragging */}
      <rect
        x={textBox.x}
        y={textBox.y}
        width={textBox.width}
        height={textBox.height}
        fill="transparent"
        stroke={isSelected ? '#3b82f6' : 'transparent'}
        strokeWidth="2"
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      />
      
      <foreignObject
        x={textBox.x}
        y={textBox.y}
        width={textBox.width}
        height={textBox.height}
        data-rich-text
        style={{ overflow: 'visible', pointerEvents: isEditing ? 'auto' : 'none' }}
      >
        <div
          ref={textRef}
          contentEditable={isEditing}
          suppressContentEditableWarning={true}
          style={{ 
            width: '100%', 
            height: '100%', 
            padding: '8px',
            fontSize: `${textBox.fontSize || 14}px`,
            fontFamily: textBox.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            cursor: isEditing ? 'text' : 'inherit',
            background: isEditing ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)',
            borderRadius: '6px',
            lineHeight: '1.4',
            color: textBox.color || '#1f2937',
            border: isEditing ? '1px solid #3b82f6' : '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: isEditing ? '0 0 0 2px rgba(59, 130, 246, 0.1)' : 'none'
          }}
          onInput={handleInput}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            // Prevent event bubbling for text editing
            e.stopPropagation();
            // Exit edit mode on Escape
            if (e.key === 'Escape') {
              setIsEditing(false);
              textRef.current.blur();
            }
          }}
        />
      </foreignObject>
      
      {/* Controls when selected */}
      {isSelected && (
        <>
          {/* Info text */}
          <text
            x={textBox.x}
            y={textBox.y - 5}
            style={{
              fontSize: '11px',
              fill: '#6b7280',
              pointerEvents: 'none',
              userSelect: 'none'
            }}
          >
            {isEditing ? 'Press Esc to finish' : 'Double-click to edit'}
          </text>
          
          {/* Delete button */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              actions.setDeleteConfirmation({
                type: 'textbox',
                title: 'Delete Text',
                message: 'Delete this text box?',
                onConfirm: () => {
                  actions.deleteTextBox(textBox.id);
                  actions.setDeleteConfirmation(null);
                },
                onCancel: () => actions.setDeleteConfirmation(null)
              });
            }}
          >
            <circle
              cx={textBox.x + textBox.width}
              cy={textBox.y}
              r="8"
              fill="#ffffff"
              stroke="#ef4444"
              strokeWidth="2"
            />
            <text
              x={textBox.x + textBox.width}
              y={textBox.y + 4}
              textAnchor="middle"
              style={{ 
                fontSize: '12px', 
                fill: '#ef4444', 
                pointerEvents: 'none', 
                fontWeight: 'bold' 
              }}
            >
              ×
            </text>
          </g>
          
          {/* Resize handle */}
          <rect
            x={textBox.x + textBox.width - 6}
            y={textBox.y + textBox.height - 6}
            width="12"
            height="12"
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth="2"
            style={{ 
              cursor: 'nwse-resize',
              touchAction: 'none'
            }}
            onPointerDown={handleResizePointerDown}
          />
        </>
      )}
    </g>
  );
};

export default TextBox;