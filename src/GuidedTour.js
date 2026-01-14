import React, { useState, useEffect, useRef } from 'react';

const steps = [
  {
    selector: '#add-person-button',
    title: 'Add Two People',
    content:
      'Click the "Add Person" button twice to create two family members. After typing a name press Enter to jump to the age field.'
  },
  {
    selector: '#gender-identity-select',
    title: 'Change Gender',
    content: "Select 'Person 2' and change their gender identity to match the sex of the individual, for example 'Female' in the edit person panel.",
    placement: 'left'
  },
  {
    selector: '[data-person-index="1"]',
    title: 'Add a Relationship',
    content: 'Right click Person 2 or use the person menu on the right to choose a relationship type such as Partner or Dating.'
  },
  {
    selector: '[data-person-index="0"]',
    title: 'Connect Relationship',
    content: 'Select Person 1 to create a relationship between the two people.'
  },
  {
    selector: '[data-relationship-index="0"]',
    title: 'View Relationship Details',
    content: 'Click the highlighted line to open relationship details on the right. Adjust the line style, dates, color, abbreviations or notes.'
  },
  {
    selector: '#add-person-button',
    title: 'Add a Child',
    content: 'Use the Add Person button to create a new child. You can designate a special status to a person, such as Adopted or Foster in the person menu.'
  },
  {
    selector: '[data-tour="relationship-bubble"]',
    title: 'Connect the Child to a Relationship',
    content: 'Select the relationship bubble then select the new child to link them. NOTE: Children must connect to a RELATIONSHIP BUBBLE, not directly to an individual.'
  },
  {
    selector: '[data-tour="relationship-bubble"]',
    title: 'Move the Relationship Bubble',
    content: 'Drag the small circle on a relationship line to reposition the relationship bubble for your preferred layout.'
  },
  {
    selector: '#household-button',
    title: 'Create a Household',
    content: 'Click the "Household" button, then draw a boundary around people living together.'
  },
  {
    selector: '#save-button',
    title: 'Save the File',
    content: 'Use the SAVE button to download a `.geno` file with all your data.'
  },
  {
    selector: '#svg-button',
    title: 'Download Image',
    content: 'Use the Download Image button to export your genogram as a scalable vector image.'
  },
  {
    selector: null,
    title: 'Pan and Zoom',
    content:
      'Drag the background or hold the space bar to pan. Use ctrl+scroll or pinch to zoom and click Fit to center everything.'
  },
  {
    selector: null,
    title: 'Auto Arrange',
    content:
      'Use the Auto Arrange button to tidy up generations and placement automatically.'
  },
  {
    selector: null,
    title: 'Send Feedback',
    content:
      'Click the Feedback button in the lower left corner to rate the app and share comments.'
  }
];

const GuidedTour = ({ show, onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef(null);

  useEffect(() => {
    setDragOffset({ x: 0, y: 0 });
  }, [stepIndex, show]);

  useEffect(() => {
    if (!show) return;
    const step = steps[stepIndex];
    if (step.selector) {
      const el = document.querySelector(step.selector);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
        if (typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setTargetRect(null);
      }
      const interval = setInterval(() => {
        const element = document.querySelector(step.selector);
        if (element) {
          setTargetRect(element.getBoundingClientRect());
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [show, stepIndex]);

  useEffect(() => {
    setStepIndex(0);
  }, [show]);

  if (!show) return null;
  const step = steps[stepIndex];

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      localStorage.setItem('genogram_tutorial_seen', 'true');
      setStepIndex(0);
      onClose();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const handleSkip = () => {
    localStorage.setItem('genogram_tutorial_seen', 'true');
    setStepIndex(0);
    onClose();
  };

  const startDrag = (e) => {
    if (e.target.closest('button') || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
      return;
    }
    dragStartRef.current = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    };
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', endDrag);
  };

  const handleDrag = (e) => {
    setDragOffset({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
  };

  const endDrag = () => {
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', endDrag);
  };

  const highlightStyle = targetRect
    ? {
        position: 'absolute',
        top: targetRect.top + window.scrollY - 4,
        left: targetRect.left + window.scrollX - 4,
        width: targetRect.width + 8,
        height: targetRect.height + 8,
        border: '2px solid #6366f1',
        borderRadius: '10px',
        pointerEvents: 'none',
        boxSizing: 'border-box'
      }
    : null;

  const boxBase = {
    position: 'absolute',
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
    zIndex: 4001,
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
    maxWidth: '300px'
  };

  const boxStyle = targetRect
    ? (() => {
        const placement = step.placement || 'bottom';
        if (placement === 'right') {
          return {
            ...boxBase,
            top: targetRect.top + window.scrollY,
            left: targetRect.right + window.scrollX + 12
          };
        }
        if (placement === 'left') {
          return {
            ...boxBase,
            top: targetRect.top + window.scrollY,
            left: targetRect.left + window.scrollX - 320
          };
        }
        if (placement === 'top') {
          return {
            ...boxBase,
            top: targetRect.top + window.scrollY - 160,
            left: targetRect.left + window.scrollX
          };
        }
        return {
          ...boxBase,
          top: targetRect.bottom + window.scrollY + 12,
          left: targetRect.left + window.scrollX
        };
      })()
    : {
        ...boxBase,
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: `translate(calc(-50% + ${dragOffset.x}px), calc(-50% + ${dragOffset.y}px))`
      };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)', zIndex: 4000, pointerEvents: 'none' }}>
      {highlightStyle && <div style={highlightStyle} />}
      <div style={{ ...boxStyle, pointerEvents: 'auto', cursor: 'move' }} onMouseDown={startDrag}>
        <h3
          style={{
            margin: '0 0 12px 0',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'inherit',
            background: 'linear-gradient(90deg, #6366f1, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {step.title}
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151' }}>{step.content}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
          <button onClick={handlePrev} disabled={stepIndex === 0} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: stepIndex === 0 ? 'not-allowed' : 'pointer' }}>Previous</button>
          {stepIndex < steps.length - 1 ? (
            <button onClick={handleNext} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#6366f1', color: 'white' }}>Next</button>
          ) : (
            <button onClick={handleNext} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white' }}>Finish</button>
          )}
        </div>
        <div style={{ marginTop: '12px', textAlign: 'right' }}>
          <button onClick={handleSkip} style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>Skip Tour</button>
        </div>
      </div>
    </div>
  );
};

export default GuidedTour;
