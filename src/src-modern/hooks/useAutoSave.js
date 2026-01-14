// ===== FILE: src-modern/hooks/useAutoSave.js =====
import { useEffect, useRef } from 'react';
import { useGenogram } from '../contexts/GenogramContext';
import { useCanvasOperations } from './useCanvasOperations';

export const useAutoSave = (interval = 30000) => { // 30 seconds default
  const { state, actions } = useGenogram();
  const { fitToCanvas } = useCanvasOperations();
  const saveTimeoutRef = useRef(null);

  // Helper function to save data
  const saveData = () => {
    const data = {
      people: state.people,
      relationships: state.relationships,
      households: state.households,
      placements: state.placements || [],
      textBoxes: state.textBoxes,
      metadata: state.metadata || {},
      customAttributes: state.customAttributes || [],
      tagDefinitions: state.tagDefinitions || [],
      filterTemplates: state.filterTemplates || [],
      fileName: state.fileName,
      version: '2.0',
      savedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('genogram_autosave', JSON.stringify(data));
      console.log('Auto-saved at', new Date().toLocaleTimeString());
      
      // Flush batched audit logs on auto-save
      if (actions.flushPendingAudits) {
        actions.flushPendingAudits();
      }
      
      actions.setDirty(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  // Save on unmount if there's data (regardless of dirty state)
  // This ensures navigation between genogram and admin preserves state
  useEffect(() => {
    return () => {
      if (state.people.length > 0) {
        console.log('Saving before unmount...');
        saveData();
      }
    };
  }, []); // Empty deps - only runs on unmount

  useEffect(() => {
    if (!state.isDirty || interval === 0) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      saveData();
    }, interval);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, actions, interval]);

  // Load auto-save on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('genogram_autosave');
      if (saved && state.people.length === 0) {
        const data = JSON.parse(saved);
        const savedTime = new Date(data.savedAt);
        const now = new Date();
        const minutesAgo = (now - savedTime) / 1000 / 60;
        
        // Check if user is returning from admin
        const returningFromAdmin = sessionStorage.getItem('returning_from_admin') === 'true';
        if (returningFromAdmin) {
          sessionStorage.removeItem('returning_from_admin');
        }
        
        // Auto-load if saved within last 30 minutes OR returning from admin
        // Otherwise, ask for confirmation
        if (minutesAgo < 30 || returningFromAdmin) {
          console.log('Auto-loading recent genogram (saved', Math.floor(minutesAgo), 'minutes ago)');
          actions.loadData(data);
          
          // Auto-fit to canvas after loading auto-saved data
          setTimeout(() => {
            fitToCanvas();
          }, 500);
        } else {
          const shouldLoad = window.confirm(
            `Found auto-saved genogram from ${savedTime.toLocaleString()}. Load it?`
          );
          if (shouldLoad) {
            actions.loadData(data);

            // Auto-fit to canvas after loading auto-saved data
            setTimeout(() => {
              fitToCanvas();
            }, 500);
          } else {
            // User declined to load autosave, clear it
            localStorage.removeItem('genogram_autosave');
          }
        }
      }
    } catch (error) {
      console.error('Error loading auto-save:', error);
    }
  }, [actions, fitToCanvas, state.people.length]); // Include dependencies
};