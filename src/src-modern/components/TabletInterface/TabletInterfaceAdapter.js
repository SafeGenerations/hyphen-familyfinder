// src/src-modern/components/TabletInterface/TabletInterfaceAdapter.js
import React from 'react';
import TabletInterface from './TabletInterface';
import { useGenogram } from '../../contexts/GenogramContext';

/**
 * This adapter component helps map the tablet interface to your existing
 * GenogramContext actions. Update the action mappings based on your actual
 * context implementation.
 */
const TabletInterfaceAdapter = () => {
  const { state, actions } = useGenogram();

  // Create adapted actions that work with your context
  const adaptedActions = {
    ...actions,
    
    // Modal controls - map to your actual action names
    setQuickAddModalOpen: (open) => {
      if (actions.setQuickAddOpen) {
        actions.setQuickAddOpen(open);
      } else if (actions.setQuickAddModalOpen) {
        actions.setQuickAddModalOpen(open);
      } else if (actions.openQuickAddModal) {
        if (open) actions.openQuickAddModal();
      } else {
        console.warn('Quick add modal action not found');
      }
    },

    setQuickEditModalOpen: (open) => {
      if (actions.setQuickEditOpen) {
        actions.setQuickEditOpen(open);
      } else if (actions.setQuickEditModalOpen) {
        actions.setQuickEditModalOpen(open);
      } else if (actions.openQuickEditModal) {
        if (open) actions.openQuickEditModal();
      } else {
        console.warn('Quick edit modal action not found');
      }
    },

    setDeleteModalOpen: (open) => {
      if (actions.setDeleteModalOpen) {
        actions.setDeleteModalOpen(open);
      } else if (actions.setDeleteConfirmationOpen) {
        actions.setDeleteConfirmationOpen(open);
      } else if (actions.openDeleteModal) {
        if (open) actions.openDeleteModal();
      } else {
        console.warn('Delete modal action not found');
      }
    },

    // Add person with relationship
    addPersonWithRelationship: (relationshipType) => {
      if (actions.setQuickAddContext && state.selectedPerson) {
        actions.setQuickAddContext({
          person: state.selectedPerson,
          relationshipType: relationshipType
        });
        actions.setQuickAddOpen?.(true);
      } else if (actions.createChildForPerson && relationshipType === 'child') {
        actions.createChildForPerson(state.selectedPerson);
      } else if (actions.createPartnerForPerson && relationshipType === 'partner') {
        actions.createPartnerForPerson(state.selectedPerson);
      } else if (actions.createParentForPerson && relationshipType === 'parent') {
        actions.createParentForPerson(state.selectedPerson);
      } else {
        console.warn(`Add ${relationshipType} action not found`);
      }
    },

    // Layout actions
    autoLayout: () => {
      if (actions.autoLayout) {
        actions.autoLayout();
      } else if (actions.performAutoLayout) {
        actions.performAutoLayout();
      } else if (actions.arrangeAutomatically) {
        actions.arrangeAutomatically();
      } else {
        console.warn('Auto layout action not found');
      }
    },

    fitToScreen: () => {
      if (actions.fitToScreen) {
        actions.fitToScreen();
      } else if (actions.zoomToFit) {
        actions.zoomToFit();
      } else if (actions.resetView) {
        actions.resetView();
      } else {
        console.warn('Fit to screen action not found');
      }
    },

    toggleSnapToGrid: () => {
      if (actions.toggleSnapToGrid) {
        actions.toggleSnapToGrid();
      } else if (actions.toggleGrid) {
        actions.toggleGrid();
      } else if (actions.setShowGrid && state.showGrid !== undefined) {
        actions.setShowGrid(!state.showGrid);
      } else {
        console.warn('Toggle grid action not found');
      }
    },

    saveGenogram: () => {
      if (actions.saveGenogram) {
        actions.saveGenogram();
      } else if (actions.save) {
        actions.save();
      } else if (actions.exportGenogram) {
        actions.exportGenogram();
      } else {
        console.warn('Save action not found');
      }
    },

    // Add any other action mappings as needed
  };

  // You can also add console logs here to debug what actions are available
  React.useEffect(() => {
    console.log('Available actions:', Object.keys(actions));
    console.log('Current state keys:', Object.keys(state));
  }, []);

  return <TabletInterface />;
};

export default TabletInterfaceAdapter;