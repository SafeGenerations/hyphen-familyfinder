// src/hooks/useKeyboardShortcuts.js
import { useEffect } from 'react';
import { useGenogram } from '../contexts/GenogramContext';
import { usePersonActions } from './usePersonActions';
import { useCanvasOperations } from './useCanvasOperations';
import { useFileOperations } from './useFileOperations';

export const useKeyboardShortcuts = (disabled = false) => {
  const { state, actions } = useGenogram();
  const { createPerson } = usePersonActions();
  const { autoArrange, fitToCanvas } = useCanvasOperations();
  const { handleSave, handleLoad, handleExportPNG, handleExportSVG, handleExportPDF } = useFileOperations();

  useEffect(() => {
    // Early return if disabled (for mobile)
    if (disabled) return;

    const handleKeyDown = (e) => {
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || 
          e.target.tagName === 'TEXTAREA' || 
          e.target.tagName === 'SELECT' ||
          e.target.isContentEditable) {
        return;
      }

      // Don't handle shortcuts if drawing household (except Escape and Enter)
      if (state.isDrawingHousehold) {
        if (e.key === 'Escape') {
          e.preventDefault();
          if (actions.cancelDrawingHousehold) {
            actions.cancelDrawingHousehold();
          }
          return;
        }
        return;
      }

      // Alt-based shortcuts (browser-safe)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        switch(e.key.toLowerCase()) {
          case 'p':
            e.preventDefault();
            // Open quick add dialog
            actions.setQuickAddOpen(true);
            break;
            
          case 'n':
            e.preventDefault();
            // New genogram
            const createNew = async () => {
              if (state.isDirty) {
                const shouldSave = window.confirm('Save changes before clearing the genogram?');
                if (shouldSave) {
                  const saved = await handleSave();
                  if (!saved) return; // Only stop if user cancelled the save dialog
                }
                // If shouldSave is false (user clicked Cancel), continue to create new
              }
              actions.newGenogram();
            };
            createNew();
            break;
            
          case 's':
            e.preventDefault();
            handleSave();
            break;
            
          case 'o':
            e.preventDefault();
            handleLoad();
            break;
            
          case 'e':
            e.preventDefault();
            if (e.shiftKey) {
              handleExportSVG();
            } else {
              handleExportPNG();
            }
            break;

          case 'r':
            e.preventDefault();
            handleExportPDF();
            break;
            
          case 't':
            e.preventDefault();
            // Add text box
            const newTextBox = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              x: 300 + Math.random() * 200,
              y: 200 + Math.random() * 200,
              width: 150,
              height: 50,
              html: 'New Text'
            };
            actions.addTextBox(newTextBox);
            break;
            
          case 'g':
            e.preventDefault();
            // Toggle snap to grid
            actions.toggleSnapToGrid();
            break;
            
          case 'a':
            e.preventDefault();
            if (e.shiftKey) {
              // Auto arrange
              autoArrange();
            }
            break;
            
          case '0':
            e.preventDefault();
            // Fit to canvas
            fitToCanvas();
            break;
            
          default:
            break;
        }
      } 
      // Cmd/Ctrl shortcuts (keep standard ones only)
      else if (e.metaKey || e.ctrlKey) {
        switch(e.key.toLowerCase()) {
          case 'c':
            e.preventDefault();
            // Copy selected item
            if (state.selectedPerson) {
              actions.copyToClipboard('person', state.selectedPerson);
            } else if (state.selectedTextBox) {
              actions.copyToClipboard('textBox', state.selectedTextBox);
            } else if (state.selectedHousehold) {
              actions.copyToClipboard('household', state.selectedHousehold);
            }
            break;
            
          case 'v':
            e.preventDefault();
            // Paste from clipboard
            actions.pasteFromClipboard(50, 50);
            break;
            
          case ']':
            e.preventDefault();
            // Bring to front
            if (state.selectedPerson) {
              actions.bringToFront('person', state.selectedPerson.id);
            } else if (state.selectedTextBox) {
              actions.bringToFront('textBox', state.selectedTextBox.id);
            } else if (state.selectedHousehold) {
              actions.bringToFront('household', state.selectedHousehold.id);
            }
            break;
            
          case '[':
            e.preventDefault();
            // Send to back
            if (state.selectedPerson) {
              actions.sendToBack('person', state.selectedPerson.id);
            } else if (state.selectedTextBox) {
              actions.sendToBack('textBox', state.selectedTextBox.id);
            } else if (state.selectedHousehold) {
              actions.sendToBack('household', state.selectedHousehold.id);
            }
            break;
            
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              actions.redo();
            } else {
              actions.undo();
            }
            break;
            
          case 'y':
            e.preventDefault();
            actions.redo();
            break;
            
          case '=':
          case '+':
            e.preventDefault();
            actions.setZoom(Math.min(5, state.zoom * 1.2));
            break;
            
          case '-':
            e.preventDefault();
            actions.setZoom(Math.max(0.2, state.zoom * 0.8));
            break;
            
          default:
            // Let browser handle other Ctrl shortcuts
            break;
        }
      } 
      // Single key shortcuts (when no modifiers pressed)
      else if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
        // Only work when no input is focused
        if (document.activeElement === document.body || 
            document.activeElement.tagName === 'BUTTON' ||
            document.activeElement.classList.contains('canvas')) {
          
          switch(e.key.toLowerCase()) {
            case '?':
              e.preventDefault();
              // Trigger help modal
              const helpButton = document.querySelector('[title*="Help"]');
              if (helpButton) helpButton.click();
              break;
              
            default:
              break;
          }
        }

        // These work regardless of focus
        switch(e.key) {
          case 'F1':
            e.preventDefault();
            // Show help
            const helpBtn = document.querySelector('[title*="Help"]');
            if (helpBtn) helpBtn.click();
            break;
            
          case 'Tab':
            e.preventDefault();
            // Cycle through selectable items (people, households, textBoxes)
            const selectableItems = [
              ...state.people.map(p => ({ type: 'person', item: p, zIndex: p.zIndex || 0 })),
              ...state.households.map(h => ({ type: 'household', item: h, zIndex: h.zIndex || 0 })),
              ...state.textBoxes.map(t => ({ type: 'textBox', item: t, zIndex: t.zIndex || 0 }))
            ].sort((a, b) => a.zIndex - b.zIndex); // Sort by zIndex
            
            if (selectableItems.length === 0) break;
            
            // Find current selection index
            let currentIndex = -1;
            if (state.selectedPerson) {
              currentIndex = selectableItems.findIndex(s => s.type === 'person' && s.item.id === state.selectedPerson.id);
            } else if (state.selectedHousehold) {
              currentIndex = selectableItems.findIndex(s => s.type === 'household' && s.item.id === state.selectedHousehold.id);
            } else if (state.selectedTextBox) {
              currentIndex = selectableItems.findIndex(s => s.type === 'textBox' && s.item.id === state.selectedTextBox.id);
            }
            
            // Move to next item (or first if none selected)
            const nextIndex = e.shiftKey 
              ? (currentIndex <= 0 ? selectableItems.length - 1 : currentIndex - 1) // Shift+Tab goes backward
              : (currentIndex + 1) % selectableItems.length; // Tab goes forward
            
            const nextItem = selectableItems[nextIndex];
            if (nextItem.type === 'person') {
              actions.selectPerson(nextItem.item);
            } else if (nextItem.type === 'household') {
              actions.selectHousehold(nextItem.item);
            } else if (nextItem.type === 'textBox') {
              actions.selectTextBox(nextItem.item);
            }
            break;
            
          case 'Escape':
            e.preventDefault();
            // Cancel all operations
            if (actions.cancelConnection) actions.cancelConnection();
            if (actions.cancelDrawingHousehold) actions.cancelDrawingHousehold();
            if (actions.setContextMenu) actions.setContextMenu(null);
            if (actions.clearSelection) actions.clearSelection();
            if (actions.setQuickAddOpen) actions.setQuickAddOpen(false);
            
            // Close any open modals
            const closeButtons = document.querySelectorAll('[aria-label="Close"], .modal-close, button[title*="Close"]');
            closeButtons.forEach(btn => btn.click());
            break;
            
          case 'Delete':
          case 'Backspace':
            e.preventDefault();
            // Delete selected item
            if (state.selectedPerson) {
              actions.setDeleteConfirmation({
                type: 'person',
                title: 'Delete Person',
                message: `Delete ${state.selectedPerson.name}?`,
                onConfirm: () => {
                  actions.deletePerson(state.selectedPerson.id);
                  actions.setDeleteConfirmation(null);
                },
                onCancel: () => actions.setDeleteConfirmation(null)
              });
            } else if (state.selectedRelationship) {
              actions.setDeleteConfirmation({
                type: 'relationship',
                title: 'Delete Relationship',
                message: 'Delete this relationship?',
                onConfirm: () => {
                  actions.deleteRelationship(state.selectedRelationship.id);
                  actions.setDeleteConfirmation(null);
                },
                onCancel: () => actions.setDeleteConfirmation(null)
              });
            } else if (state.selectedTextBox) {
              actions.setDeleteConfirmation({
                type: 'textBox',
                title: 'Delete Text',
                message: 'Delete this text box?',
                onConfirm: () => {
                  actions.deleteTextBox(state.selectedTextBox.id);
                  actions.setDeleteConfirmation(null);
                },
                onCancel: () => actions.setDeleteConfirmation(null)
              });
            } else if (state.selectedHousehold) {
              actions.setDeleteConfirmation({
                type: 'household',
                title: 'Delete Household',
                message: `Delete ${state.selectedHousehold.name}?`,
                onConfirm: () => {
                  actions.deleteHousehold(state.selectedHousehold.id);
                  actions.setDeleteConfirmation(null);
                  
                  // Save to history after household deletion
                  actions.saveToHistory({
                    people: state.people,
                    relationships: state.relationships,
                    households: state.households.filter(h => h.id !== state.selectedHousehold.id),
                    textBoxes: state.textBoxes
                  });
                },
                onCancel: () => actions.setDeleteConfirmation(null)
              });
            }
            break;
            
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [disabled, state, actions, createPerson, autoArrange, fitToCanvas, handleSave, handleLoad, handleExportPNG, handleExportSVG, handleExportPDF]);
};