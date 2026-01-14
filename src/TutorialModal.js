import React, { useState } from 'react';

const TutorialModal = ({ show, onClose }) => {
  const steps = [
    {
      title: 'Add a Person',
      content:
        'Use the "Add Person" button at the top to create a new family member. After entering a name press Enter to quickly fill in an age or birth date.'
    },
    {
      title: 'Add a Relationship',
      content:
        'Select a person and choose a relationship type from their menu to connect people. Relationship options now include Partner and Dating.'
    },
    {
      title: 'Move the Relationship Bubble',
      content:
        'Drag the small circle on a relationship line to reposition the relationship bubble.'
    },
    {
      title: 'Update Relationship Details',
      content:
        'Click a relationship line to edit its type, line style, dates, color and notes.'
    },
    {
      title: 'Pan and Zoom the Canvas',
      content:
        'Hold the space bar or drag the background to pan. Use ctrl+scroll or pinch to zoom and the Fit button to refocus the diagram.'
    },
    {
      title: 'Create a Household',
      content:
        'Click the "Household" button, then draw a boundary around people living together.'
    },
    {
      title: 'Save the File',
      content: 'Use the SAVE button to download a `.geno` file with all your data.'
    },
    {
      title: 'Download Image',
      content:
        'Use the Download Image button to export your genogram as a scalable vector image.'
    },
    {
      title: 'Send Feedback',
      content:
        'Click the Feedback button in the lower left corner to rate the app and share comments.'
    }
  ];

  const [stepIndex, setStepIndex] = useState(0);

  if (!show) return null;
  const step = steps[stepIndex];

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      localStorage.setItem('genogram_tutorial_seen', 'true');
      onClose();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const handleSkip = () => {
    localStorage.setItem('genogram_tutorial_seen', 'true');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', maxWidth: '500px', width: '90%' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 16px 0' }}>{step.title}</h3>
        <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 24px 0' }}>{step.content}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
          <button onClick={handlePrev} disabled={stepIndex === 0} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: stepIndex === 0 ? 'not-allowed' : 'pointer' }}>
            Previous
          </button>
          {stepIndex < steps.length - 1 ? (
            <button onClick={handleNext} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
              Next
            </button>
          ) : (
            <button onClick={handleNext} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: 'white', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
              Finish
            </button>
          )}
        </div>
        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <button onClick={handleSkip} style={{ padding: '4px 8px', background: 'none', border: 'none', color: '#6b7280', fontSize: '12px', cursor: 'pointer' }}>
            Skip Tour
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
