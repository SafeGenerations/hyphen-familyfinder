// ===== BottomSheet.js - COMPLETE FILE =====
// src/src-modern/components/EditPanels/BottomSheet.js
import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const BottomSheet = ({ isOpen, onClose, title, children, height = 'auto' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const sheetRef = useRef(null);
  const startY = useRef(0);
  const pointerId = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key to close the sheet
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handlePointerDown = (e) => {
    // Only handle primary button
    if (e.button !== 0) return;
    
    // Don't start dragging if clicking on interactive elements
    const target = e.target;
    if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) {
      return;
    }
    
    // Only start dragging from the drag handle area or header
    const dragHandle = target.closest('.drag-handle');
    const header = target.closest('.bottom-sheet-header');
    if (!dragHandle && !header) {
      return;
    }
    
    pointerId.current = e.pointerId;
    startY.current = e.clientY;
    setIsDragging(true);
    
    // Capture pointer for smooth dragging
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || e.pointerId !== pointerId.current) return;
    
    const currentY = e.clientY;
    const diff = currentY - startY.current;
    
    // Only allow dragging down
    if (diff > 0) {
      setDragOffset(diff);
    }
  };

  const handlePointerUp = (e) => {
    if (e.pointerId !== pointerId.current) return;
    
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    
    // If dragged more than 100px, close the sheet
    if (dragOffset > 100) {
      onClose();
    }
    setDragOffset(0);
    pointerId.current = null;
  };

  const handlePointerCancel = (e) => {
    if (e.pointerId !== pointerId.current) return;
    
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    setDragOffset(0);
    pointerId.current = null;
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 60,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
          touchAction: 'none'
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 -2px 20px rgba(0, 0, 0, 0.1)',
          zIndex: 65,
          maxHeight: '85vh',
          height: height,
          transform: `translateY(${isOpen ? dragOffset : '100%'}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          paddingBottom: 'env(safe-area-inset-bottom, 0)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {/* Drag Handle */}
        <div 
          className="drag-handle"
          style={{
            padding: '8px',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            userSelect: 'none'
          }}
        >
          <div style={{
            width: '40px',
            height: '4px',
            backgroundColor: '#cbd5e1',
            borderRadius: '2px',
            margin: '0 auto'
          }} />
        </div>

        {/* Header */}
        {title && (
          <div 
            className="bottom-sheet-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px 16px',
              borderBottom: '1px solid #f1f5f9'
            }}
          >
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1e293b',
              margin: 0
            }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                backgroundColor: '#f1f5f9',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
            >
              <X size={20} color="#64748b" />
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'manipulation' // Allow normal touch interactions
        }}>
          {children}
        </div>
      </div>
    </>
  );
};

export default BottomSheet;