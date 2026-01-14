import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useResponsive, constrainToViewport } from '../../utils/responsive';

const ResponsiveModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = '600px',
  fullScreenOnMobile = true,
  closeOnOverlayClick = true,
  showCloseButton = true,
  className = '',
  style = {}
}) => {
  const { dimensions, breakpoint } = useResponsive();
  const modalRef = useRef(null);
  
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;

  const isFullScreen = fullScreenOnMobile && (breakpoint === 'xs' || breakpoint === 'sm');

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: isFullScreen ? 'flex-end' : 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: isFullScreen ? 0 : dimensions.baseSpacing,
    animation: 'fadeIn 0.2s ease-out',
    touchAction: 'none' // Prevent scrolling on overlay
  };

  const modalStyle = {
    backgroundColor: 'white',
    borderRadius: isFullScreen ? '16px 16px 0 0' : '16px',
    width: isFullScreen ? '100%' : '100%',
    maxWidth: isFullScreen ? '100%' : maxWidth,
    maxHeight: isFullScreen ? '90vh' : '85vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
    animation: isFullScreen ? 'slideUp 0.3s ease-out' : 'scaleIn 0.2s ease-out',
    ...style
  };

  const headerStyle = {
    padding: dimensions.baseSpacing,
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: dimensions.minTouchTarget,
    flexShrink: 0
  };

  const titleStyle = {
    fontSize: `${dimensions.baseFontSize + 4}px`, 
    fontWeight: '600', 
    margin: 0,
    color: '#1e293b',
    paddingRight: showCloseButton ? '40px' : '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  };

  const contentStyle = {
    padding: dimensions.baseSpacing,
    overflowY: 'auto',
    overflowX: 'hidden',
    flex: 1,
    fontSize: `${dimensions.baseFontSize}px`,
    WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
    touchAction: 'pan-y', // Allow vertical scrolling
    // Custom scrollbar for better UX
    scrollbarWidth: 'thin',
    scrollbarColor: '#cbd5e1 #f1f5f9'
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: dimensions.baseSpacing,
    right: dimensions.baseSpacing,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    minWidth: dimensions.minTouchTarget,
    minHeight: dimensions.minTouchTarget,
    touchAction: 'manipulation' // Prevent double-tap zoom
  };

  return (
    <>
      <div 
        style={overlayStyle} 
        onClick={(e) => {
          if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
          }
        }}
        className="modal-overlay"
      >
        <div 
          ref={modalRef}
          style={modalStyle} 
          className={`modal-content ${className}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Drag handle for mobile */}
          {isFullScreen && (
            <div style={{
              width: '40px',
              height: '4px',
              backgroundColor: '#cbd5e1',
              borderRadius: '2px',
              margin: '8px auto 0',
              cursor: 'grab',
              touchAction: 'none'
            }} />
          )}
          
          {/* Header */}
          {title && (
            <div style={headerStyle}>
              <h2 id="modal-title" style={titleStyle}>
                {title}
              </h2>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  style={closeButtonStyle}
                  aria-label="Close modal"
                  onPointerEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.color = '#1e293b';
                  }}
                  onPointerLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#64748b';
                  }}
                >
                  <X size={24} />
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div style={contentStyle}>
            {children}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        /* Custom scrollbar styles */
        .modal-content::-webkit-scrollbar {
          width: 8px;
        }
        
        .modal-content::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .modal-content::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        .modal-content::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </>
  );
};

export default ResponsiveModal;