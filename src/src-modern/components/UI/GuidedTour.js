// src-modern/components/UI/GuidedTour.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Check, MousePointer, Hand } from 'lucide-react';
import { useGenogram } from '../../contexts/GenogramContext';

const GuidedTour = ({ show, onClose }) => {
  const { state, actions } = useGenogram();
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightBounds, setHighlightBounds] = useState(null);
  const [isWaitingForAction, setIsWaitingForAction] = useState(false);
  const [actionCompleted, setActionCompleted] = useState(false);
  const tourRef = useRef(null);

  const steps = [
    {
      id: 'welcome',
      title: "Welcome to Genogram Builder! 👋",
      content: "I'll guide you through creating your first genogram. You'll be able to try each feature as we go!",
      position: 'center',
      highlight: null,
      action: null
    },
    {
      id: 'toolbar-intro',
      title: "The Floating Toolbar",
      content: "This is your command center. Try dragging it to a new position now!",
      position: 'below-toolbar',
      highlight: '.floating-toolbar',
      action: {
        type: 'drag',
        target: 'toolbar',
        instruction: "Drag the toolbar to move it",
        completed: false
      }
    },
    {
      id: 'add-first-person',
      title: "Let's Add Your First Person",
      content: "Click the 'Add Person' button to create your first family member.",
      position: 'below-toolbar',
      highlight: '[title="Add Person (⌘N)"]',
      action: {
        type: 'click',
        target: 'add-person',
        instruction: "Click 'Add Person'",
        waitFor: 'quickAddOpen'
      }
    },
    {
      id: 'fill-person-details',
      title: "Enter Person Details",
      content: "Type a name (e.g., 'John Smith'), press Enter to jump to age, type '45', then press Enter again to create the person quickly!",
      position: 'bottom-right',
      highlight: '.quick-add-modal',
      action: {
        type: 'complete-form',
        instruction: "Fill in the details and click 'Add Person'",
        waitFor: 'personAdded'
      }
    },
    {
      id: 'person-created',
      title: "Great! You Created a Person",
      content: "You can see John on the canvas. Click on him to select him.",
      position: 'center',
      highlight: 'person-shape',
      action: {
        type: 'click',
        target: 'person',
        instruction: "Click on the person",
        waitFor: 'personSelected',
        preventAutoAdvance: true  // Don't auto-advance even if person is already selected
      }
    },
    {
      id: 'side-panel',
      title: "The Edit Panel",
      content: "When you select someone, this panel opens. Here you can edit all their details. Notice the 'Add Spouse/Partner' button?",
      position: 'left-of-panel',
      highlight: '.side-panel',
      action: {
        type: 'observe',
        instruction: "Review the editing options"
      }
    },
    {
      id: 'add-spouse',
      title: "Add a Spouse",
      content: "Click 'Add Spouse/Partner' to create John's spouse. After you've created the spouse, click Next to continue.",
      position: 'left-of-panel',
      highlight: '.add-spouse-button',
      action: {
        type: 'observe',  // Changed from 'click' to 'observe'
        instruction: "Click 'Add Spouse/Partner' button, then click Next",
        minViewTime: 0  // No minimum time, can advance immediately
      }
    },
    {
      id: 'see-relationship',
      title: "Perfect! See the Relationship?",
      content: "Notice the line connecting them with a circle in the middle. That circle is special - double-click it to add a child!",
      position: 'top-position',  // Position at top to avoid blocking
      highlight: 'relationship-bubble',
      action: {
        type: 'double-click',
        target: 'relationship-bubble',
        instruction: "Double-click the circle on the line",
        waitFor: 'childAdded'
      }
    },
    {
      id: 'child-added',
      title: "Excellent! You Added a Child",
      content: "See how the child appears below the parents with connecting lines? Let's add one more child the same way.",
      position: 'top-position',  // Keep at top to avoid children
      highlight: 'relationship-bubble',
      action: {
        type: 'double-click',
        target: 'relationship-bubble',
        instruction: "Double-click the circle again",
        waitFor: 'secondChildAdded'
      }
    },
    {
      id: 'siblings-connected',
      title: "Notice the Sibling Bar?",
      content: "When you have multiple children, they're automatically connected with a sibling bar. Now let's try right-clicking on a person.",
      position: 'top-position',  // Keep at top to avoid children
      highlight: 'sibling-bar',
      action: {
        type: 'right-click',
        target: 'any-person',
        instruction: "Right-click on any person",
        waitFor: 'contextMenuOpen'
      }
    },
    {
      id: 'siblings-connected',
      title: "Notice the Sibling Bar?",
      content: "When you have multiple children, they're automatically connected with a sibling bar. Now let's try right-clicking on a person.",
      position: 'center',
      highlight: 'sibling-bar',
      action: {
        type: 'right-click',
        target: 'any-person',
        instruction: "Right-click on any person",
        waitFor: 'contextMenuOpen'
      }
    },
    {
      id: 'context-menu',
      title: "The Context Menu",
      content: "This menu has many options! You can create any type of relationship from here. Click elsewhere to close it.",
      position: 'safe-position',
      highlight: '.context-menu',
      action: {
        type: 'click-away',
        instruction: "Click anywhere to close the menu"
      }
    },
    {
      id: 'draw-household',
      title: "Let's Draw a Household",
      content: "Click the household tool to group people who live together.",
      position: 'center',
      highlight: '[title="Draw Household"]',
      action: {
        type: 'click',
        target: 'household-tool',
        instruction: "Click the household tool",
        waitFor: 'householdModeActive'
      }
    },
    {
      id: 'create-household',
      title: "Draw Around Your Family",
      content: "Click at least 3 points around your family to create a boundary. Click the green starting point when done!",
      position: 'top-center',
      highlight: null,
      action: {
        type: 'draw-household',
        instruction: "Click points around the family, then click the green start point",
        waitFor: 'householdCreated'
      }
    },
    {
      id: 'canvas-navigation',
      title: "Navigate Your Canvas",
      content: "Hold Space and drag to pan around. Use Ctrl/Cmd + scroll to zoom. Try it now!",
      position: 'center',
      highlight: null,
      action: {
        type: 'navigate',
        instruction: "Hold Space and drag to pan, Ctrl+scroll to zoom"
      }
    },
    {
      id: 'auto-arrange',
      title: "Auto-Arrange Your Genogram",
      content: "Click the Auto Arrange button to organize everything neatly!",
      position: 'below-toolbar',
      highlight: '[title="Auto Arrange (⌘A)"]',
      action: {
        type: 'click',
        target: 'auto-arrange',
        instruction: "Click Auto Arrange"
      }
    },
    {
      id: 'add-text',
      title: "Add Text Annotations",
      content: "Click the text tool to add notes anywhere on your genogram.",
      position: 'below-toolbar',
      highlight: '[title="Add Text (T)"]',
      action: {
        type: 'click',
        target: 'text-tool',
        instruction: "Click the text tool, then click on the canvas"
      }
    },
    {
      id: 'network-members',
      title: "Highlight Network Members",
      content: "Toggle this to highlight professionals or support people. In highlight mode, click people to mark them as network members.",
      position: 'below-toolbar',
      highlight: '[title="Highlight Network (⌘H)"]',
      action: {
        type: 'click',
        target: 'network-highlight',
        instruction: "Try toggling network highlight"
      }
    },
    {
      id: 'save-your-work',
      title: "Save Your Genogram",
      content: "Click Save to download your genogram as a file. You can also export it as an image!",
      position: 'below-toolbar',
      highlight: '[title="Save (⌘S)"]',
      action: {
        type: 'observe',
        instruction: "Review the save options"
      }
    },
    {
      id: 'complete',
      title: "Congratulations! 🎉",
      content: "You've learned all the basics! Press F1 anytime to see keyboard shortcuts. Ready to build your complete genogram?",
      position: 'center',
      highlight: null,
      action: {
        type: 'complete',
        instruction: "Click 'Start Building' to begin!"
      }
    }
  ];

  // Check if we need full canvas access for certain steps
  const needsFullCanvasAccess = () => {
    const step = steps[currentStep];
    return step.id === 'create-household' || 
           step.id === 'canvas-navigation' ||
           step.id === 'fill-person-details' ||
           step.action?.type === 'navigate' ||
           step.action?.type === 'draw-household' ||
           step.action?.type === 'click-away';
  };

  // Set initial waiting state and time based on first step
  useEffect(() => {
    if (show && steps[currentStep].action?.waitFor) {
      setIsWaitingForAction(true);
    }
    if (show) {
      setStepShownTime(Date.now());
    }
  }, [show, currentStep, steps]);

  // Track when step was first shown for minimum view time
  const [stepShownTime, setStepShownTime] = useState(null);

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setActionCompleted(false);
      setStepShownTime(Date.now()); // Track when step is shown
      // Check if the next step requires waiting for an action
      const nextStepData = steps[nextStep];
      setIsWaitingForAction(nextStepData.action?.waitFor ? true : false);
    } else {
      localStorage.setItem('genogram_tutorial_seen', 'true');
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setActionCompleted(false);
      setIsWaitingForAction(false);
      setStepShownTime(Date.now());
    }
  };

  const handleSkip = () => {
    localStorage.setItem('genogram_tutorial_seen', 'true');
    onClose();
  };

  // Helper to find elements based on step requirements
  const findElementByStep = useCallback((stepData) => {
    switch (stepData.highlight) {
      case '.floating-toolbar':
        return document.querySelector('[style*="position:fixed"][style*="transform:translateX(-50%)"]');
      case 'person-shape':
        return document.querySelector('svg circle, svg rect, svg polygon');
      case '.side-panel':
        return document.querySelector('[style*="width: 384px"]');
      case 'relationship-bubble':
        return document.querySelector('circle[style*="cursor: grab"]');
      case '.context-menu':
        return document.querySelector('[style*="z-index: 1000"]');
      case '.add-spouse-button':
        // Find button containing the text "Add Spouse/Partner"
        const buttons = document.querySelectorAll('button');
        for (let btn of buttons) {
          if (btn.textContent.includes('Add Spouse/Partner')) {
            return btn;
          }
        }
        return null;
      case '.quick-add-modal':
        // Find the modal by looking for the quick add form
        return document.querySelector('[style*="z-index: 50"]');
      case 'sibling-bar':
        // Find the sibling connection bar - look for the drag handle
        const siblingBar = document.querySelector('line[style*="stroke-dasharray: 2,2"]');
        if (siblingBar) {
          // Try to find the drag handle which is more visible
          const dragHandle = siblingBar.parentElement?.querySelector('rect[rx="4"]');
          return dragHandle || siblingBar;
        }
        return null;
      default:
        // Try to find by exact selector first
        try {
          return document.querySelector(stepData.highlight);
        } catch (e) {
          // If selector is invalid, return null
          console.warn('Invalid selector:', stepData.highlight);
          return null;
        }
    }
  }, []);

  // Calculate highlight bounds based on selector
  useEffect(() => {
    if (!show) return;

    const step = steps[currentStep];
    if (step.highlight) {
      try {
        const element = document.querySelector(step.highlight);
        if (element) {
          const rect = element.getBoundingClientRect();
          setHighlightBounds({
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16
          });
        } else {
          // Try to find elements by content or structure
          setTimeout(() => {
            const found = findElementByStep(step);
            if (found) {
              const rect = found.getBoundingClientRect();
              setHighlightBounds({
                top: rect.top - 8,
                left: rect.left - 8,
                width: rect.width + 16,
                height: rect.height + 16
              });
            }
          }, 100);
        }
      } catch (e) {
        // Invalid selector, try custom finder
        console.log('Invalid selector, trying custom finder:', step.highlight);
        setTimeout(() => {
          const found = findElementByStep(step);
          if (found) {
            const rect = found.getBoundingClientRect();
            setHighlightBounds({
              top: rect.top - 8,
              left: rect.left - 8,
              width: rect.width + 16,
              height: rect.height + 16
            });
          }
        }, 100);
      }
    } else {
      setHighlightBounds(null);
    }
  }, [currentStep, show, state, findElementByStep]);

  // Watch for state changes to auto-advance tutorial
  useEffect(() => {
    if (!show) return;

    const step = steps[currentStep];
    if (!step.action) return;

    // Skip auto-advance for manual advance steps
    if (step.action.manualAdvance || step.action.preventAutoAdvance) {
      return;
    }

    // Skip if not waiting for an action
    if (!isWaitingForAction && !step.action.waitFor) return;

    console.log('Tutorial: Checking for action completion', {
      step: step.id,
      waitingFor: step.action.waitFor,
      isWaitingForAction,
      state: {
        quickAddOpen: state.quickAddOpen,
        newPersonModalOpen: state.newPersonModalOpen,
        peopleCount: state.people.length,
        selectedPerson: state.selectedPerson?.name,
        relationshipsCount: state.relationships.length,
        contextMenu: state.contextMenu,
        isDrawingHousehold: state.isDrawingHousehold,
        householdsCount: state.households.length
      }
    });

    let shouldAdvance = false;

    switch (step.action.waitFor) {
      case 'quickAddOpen':
        shouldAdvance = state.quickAddOpen;
        break;
      case 'personAdded':
        shouldAdvance = state.people.length > 0 && !state.quickAddOpen;
        break;
      case 'personSelected':
        shouldAdvance = state.selectedPerson !== null;
        break;
      case 'spouseCreated':
        // More flexible detection - just check if we have 2+ people and 1+ relationships
        shouldAdvance = state.people.length >= 2 && 
                       state.relationships.length > 0 && 
                       !state.quickAddOpen && 
                       !state.newPersonModalOpen;
        break;
      case 'childAdded':
        shouldAdvance = state.people.length >= 3 && !state.quickAddOpen;
        break;
      case 'secondChildAdded':
        shouldAdvance = state.people.length >= 4 && !state.quickAddOpen;
        break;
      case 'contextMenuOpen':
        shouldAdvance = state.contextMenu !== null;
        break;
      case 'householdModeActive':
        shouldAdvance = state.isDrawingHousehold;
        break;
      case 'householdCreated':
        shouldAdvance = state.households.length > 0;
        break;
      default:
        // No auto-advance for other action types
        break;
    }

    // Check if this step prevents auto-advance
    if (shouldAdvance && step.action.preventAutoAdvance) {
      console.log('Tutorial: Auto-advance prevented for step', step.id);
      shouldAdvance = false;
    }

    if (shouldAdvance) {
      console.log('Tutorial: Advancing to next step');
      setActionCompleted(true);
      
      // Give more time for certain steps
      let delay = 1500;
      if (step.action.waitFor === 'personAdded' || 
          step.action.waitFor === 'childAdded' || 
          step.action.waitFor === 'secondChildAdded') {
        delay = 2500; // More time to see the result
      }
      
      setTimeout(() => {
        handleNext();
      }, delay);
    }
  }, [state, isWaitingForAction, currentStep, show, handleNext]);

  // Watch for context menu close
  useEffect(() => {
    if (!show || !isWaitingForAction) return;

    const step = steps[currentStep];
    if (step.action?.type === 'click-away' && state.contextMenu === null) {
      setActionCompleted(true);
      setTimeout(() => {
        handleNext();
      }, 500);
    }
  }, [state.contextMenu, isWaitingForAction, currentStep, show, handleNext]);

  if (!show) return null;

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  // Calculate position for tutorial popup
  const getPopupStyle = () => {
    const baseStyle = {
      position: 'fixed',
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
      zIndex: 1005,
      maxWidth: '420px',
      width: '90%',
      maxHeight: '80vh',
      overflowY: 'auto',
      animation: 'slideIn 0.3s ease-out'
    };

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popupWidth = 420;
    const popupHeight = 400;
    const margin = 20;
    const safeZone = 100; // Keep popup away from edges

    // Default positions when no highlight or special positioning needed
    switch (step.position) {
      case 'center':
        return {
          ...baseStyle,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
      
      case 'below-toolbar':
        return {
          ...baseStyle,
          top: '180px',
          left: '50%',
          transform: 'translateX(-50%)'
        };
      
      case 'left-of-panel':
        return {
          ...baseStyle,
          right: '440px',
          top: '200px'
        };
      
      case 'offset-from-center':
        // For relationship bubble - position to the side
        return {
          ...baseStyle,
          top: '50%',
          right: '50px',
          transform: 'translateY(-50%)'
        };
      
      case 'bottom-right':
        // For modals that appear in center - position tutorial bottom right
        return {
          ...baseStyle,
          bottom: '40px',
          right: '40px',
          maxWidth: '350px'
        };
      
      case 'top-left':
        // Alternative position for modals
        return {
          ...baseStyle,
          top: '40px',
          left: '40px',
          maxWidth: '350px'
        };
      
      case 'top-position':
        // Always position at top center to avoid blocking children below
        return {
          ...baseStyle,
          top: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '450px'
        };
      
      case 'dynamic':
        // Smart positioning based on highlight location
        if (highlightBounds) {
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const centerX = highlightBounds.left + highlightBounds.width / 2;
          const centerY = highlightBounds.top + highlightBounds.height / 2;
          
          // Position based on where the highlight is
          if (centerY < viewportHeight / 3) {
            // Highlight is in top third - position below
            return {
              ...baseStyle,
              top: Math.min(highlightBounds.top + highlightBounds.height + 60, viewportHeight - 300) + 'px',
              left: Math.max(20, Math.min(centerX - 210, viewportWidth - 440)) + 'px',
              maxWidth: '380px'
            };
          } else if (centerY > viewportHeight * 2/3) {
            // Highlight is in bottom third - position above
            return {
              ...baseStyle,
              bottom: Math.max(20, viewportHeight - highlightBounds.top + 40) + 'px',
              left: Math.max(20, Math.min(centerX - 210, viewportWidth - 440)) + 'px',
              maxWidth: '380px'
            };
          } else {
            // Highlight is in middle - position to the side with most space
            if (centerX < viewportWidth / 2) {
              // More space on right
              return {
                ...baseStyle,
                top: Math.max(20, centerY - 150) + 'px',
                left: Math.min(highlightBounds.left + highlightBounds.width + 60, viewportWidth - 440) + 'px',
                maxWidth: '380px'
              };
            } else {
              // More space on left
              return {
                ...baseStyle,
                top: Math.max(20, centerY - 150) + 'px',
                right: Math.max(20, viewportWidth - highlightBounds.left + 40) + 'px',
                maxWidth: '380px'
              };
            }
          }
        }
        // Fallback to center
        return {
          ...baseStyle,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
      
      case 'top-center':
        return {
          ...baseStyle,
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)'
        };
      
      default:
        // Smart positioning based on highlight bounds
        if (highlightBounds) {
          let position = {};
          
          // Calculate available space in each direction
          const spaceLeft = highlightBounds.left;
          const spaceRight = viewportWidth - (highlightBounds.left + highlightBounds.width);
          const spaceTop = highlightBounds.top;
          const spaceBottom = viewportHeight - (highlightBounds.top + highlightBounds.height);
          
          // Try to position where there's most space
          if (spaceRight > popupWidth + safeZone) {
            position.left = Math.min(highlightBounds.left + highlightBounds.width + 40, viewportWidth - popupWidth - margin) + 'px';
            position.top = Math.max(margin, Math.min(highlightBounds.top, viewportHeight - popupHeight - margin)) + 'px';
          } else if (spaceLeft > popupWidth + safeZone) {
            position.right = Math.max(margin, viewportWidth - highlightBounds.left + 40) + 'px';
            position.top = Math.max(margin, Math.min(highlightBounds.top, viewportHeight - popupHeight - margin)) + 'px';
          } else if (spaceBottom > popupHeight + safeZone) {
            position.top = Math.min(highlightBounds.top + highlightBounds.height + 40, viewportHeight - popupHeight - margin) + 'px';
            position.left = '50%';
            position.transform = 'translateX(-50%)';
          } else {
            // Default to center if no good position
            position.top = '50%';
            position.left = '50%';
            position.transform = 'translate(-50%, -50%)';
          }
          
          return { ...baseStyle, ...position };
        }
        
        return {
          ...baseStyle,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }
  };

  // Check if we need to show UI elements clearly
  const needsClearUI = () => {
    const step = steps[currentStep];
    return step.id === 'fill-person-details' || 
           step.id === 'side-panel' ||
           step.id === 'add-spouse' ||
           state.quickAddOpen ||
           state.newPersonModalOpen ||
           (state.sidePanelOpen && state.selectedPerson);
  };

  return (
    <>
      {/* Semi-transparent overlay that doesn't block clicks */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: needsClearUI() ? 'rgba(0, 0, 0, 0.15)' : (needsFullCanvasAccess() ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.25)'),
        pointerEvents: 'none',
        zIndex: 998,  // Lower z-index to ensure it doesn't block UI
        animation: 'fadeIn 0.3s ease-out',
        transition: 'background 0.3s ease'
      }} />

      {/* Additional darkening for better contrast with highlights - REMOVED the mask gradient */}

      {/* Spotlight effect around highlighted area */}
      {highlightBounds && !needsClearUI() && (
        <>
          {/* Simple white background for better visibility */}
          <div style={{
            position: 'fixed',
            top: (highlightBounds.top - 20) + 'px',
            left: (highlightBounds.left - 20) + 'px',
            width: (highlightBounds.width + 40) + 'px',
            height: (highlightBounds.height + 40) + 'px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            pointerEvents: 'none',
            zIndex: 999
          }} />
          
          {/* Highlight border */}
          <div style={{
            position: 'fixed',
            top: highlightBounds.top + 'px',
            left: highlightBounds.left + 'px',
            width: highlightBounds.width + 'px',
            height: highlightBounds.height + 'px',
            border: '3px solid #3b82f6',
            borderRadius: '12px',
            backgroundColor: 'transparent',
            pointerEvents: 'none',
            zIndex: 1001,
            animation: 'pulse 2s infinite',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)'
          }} />
        </>
      )}
      
      {/* Strong highlight for UI elements */}
      {highlightBounds && needsClearUI() && (
        <div style={{
          position: 'fixed',
          top: highlightBounds.top + 'px',
          left: highlightBounds.left + 'px',
          width: highlightBounds.width + 'px',
          height: highlightBounds.height + 'px',
          border: '3px solid #3b82f6',
          borderRadius: '12px',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          pointerEvents: 'none',
          zIndex: 1001,
          animation: 'pulse 2s infinite',
          boxShadow: '0 0 40px rgba(59, 130, 246, 1), inset 0 0 20px rgba(59, 130, 246, 0.4)'
        }} />
      )}

      {/* Visual connector line between popup and highlight */}
      {highlightBounds && tourRef.current && !needsClearUI() && (
        <svg
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1004
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#3b82f6"
              />
            </marker>
          </defs>
          <path
            d={(() => {
              const popupRect = tourRef.current.getBoundingClientRect();
              const highlightCenterX = highlightBounds.left + highlightBounds.width / 2;
              const highlightCenterY = highlightBounds.top + highlightBounds.height / 2;
              
              // Find the closest point on the popup to the highlight
              let startX, startY;
              
              if (highlightCenterX < popupRect.left) {
                startX = popupRect.left;
              } else if (highlightCenterX > popupRect.right) {
                startX = popupRect.right;
              } else {
                startX = highlightCenterX;
              }
              
              if (highlightCenterY < popupRect.top) {
                startY = popupRect.top;
              } else if (highlightCenterY > popupRect.bottom) {
                startY = popupRect.bottom;
              } else {
                startY = highlightCenterY;
              }
              
              // Create a curved path
              const midX = (startX + highlightCenterX) / 2;
              const midY = (startY + highlightCenterY) / 2;
              const curveOffset = 30;
              
              return `M ${startX},${startY} Q ${midX + curveOffset},${midY} ${highlightCenterX},${highlightCenterY}`;
            })()}
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="5,5"
            fill="none"
            opacity="0.6"
            markerEnd="url(#arrowhead)"
          />
        </svg>
      )}

      {/* Tutorial popup */}
      <div ref={tourRef} style={getPopupStyle()}>
        {/* Progress indicator */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '24px',
          justifyContent: 'center'
        }}>
          {steps.map((_, index) => (
            <div
              key={index}
              style={{
                width: index === currentStep ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: index === currentStep ? '#3b82f6' : 
                               index < currentStep ? '#93c5fd' : '#e5e7eb',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* Step content */}
        <h3 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '16px',
          color: '#1e293b',
          lineHeight: '1.3'
        }}>
          {step.title}
        </h3>
        
        <p style={{
          fontSize: '16px',
          color: '#475569',
          marginBottom: '24px',
          lineHeight: '1.6'
        }}>
          {step.content}
        </p>

        {/* Action instruction */}
        {step.action && (
          <div style={{
            background: actionCompleted ? '#d1fae5' : '#f0f9ff',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: `2px solid ${actionCompleted ? '#10b981' : '#3b82f6'}`,
            transition: 'all 0.3s ease'
          }}>
            {actionCompleted ? (
              <Check size={24} color="#10b981" />
            ) : step.action.type === 'click' || step.action.type === 'double-click' ? (
              <MousePointer size={24} color="#3b82f6" />
            ) : (
              <Hand size={24} color="#3b82f6" />
            )}
            <div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: actionCompleted ? '#065f46' : '#1e40af' 
              }}>
                {actionCompleted ? 'Well done!' : 'Your turn:'}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: actionCompleted ? '#047857' : '#1e40af' 
              }}>
                {step.action.instruction}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '32px'
        }}>
          <button
            onClick={handleSkip}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '8px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#64748b'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            Skip tutorial
          </button>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {!isFirstStep && (
              <button
                onClick={handlePrevious}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}

            <span style={{
              fontSize: '13px',
              color: '#94a3b8',
              minWidth: '60px',
              textAlign: 'center'
            }}>
              {currentStep + 1} of {steps.length}
            </span>

            {/* Show next button for all steps */}
            <button
              onClick={() => {
                const step = steps[currentStep];
                
                // For steps with minimum view time, check if enough time has passed
                if (step.action?.minViewTime) {
                  const timeViewed = stepShownTime ? Date.now() - stepShownTime : Infinity;
                  if (timeViewed < step.action.minViewTime) {
                    console.log('Tutorial: Not enough time viewed', timeViewed, 'of', step.action.minViewTime);
                    return;
                  }
                }
                
                console.log('Tutorial: Next button clicked on step', currentStep);
                handleNext();
              }}
              style={{
                padding: '10px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
            >
              {isLastStep ? 'Start Building' : 'Next'}
              {!isLastStep && <ChevronRight size={16} />}
            </button>
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

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }

        @keyframes glow {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }
      `}</style>
    </>
  );
};

export default GuidedTour;