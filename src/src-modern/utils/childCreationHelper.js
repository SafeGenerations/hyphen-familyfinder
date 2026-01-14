// src/src-modern/utils/childCreationHelper.js

/**
 * Helper function to handle child creation with sophisticated logic
 * This ensures consistent behavior across all UI components
 */
export const handleChildCreation = (selectedPerson, relationships, actions) => {
  if (!selectedPerson || !actions) return;

  // Find all partner relationships for the selected person
  const PARENT_RELATIONSHIP_TYPES = [
    // Romantic relationships
    'marriage', 'partner', 'cohabitation', 'engagement', 'dating', 'love-affair', 'secret-affair', 'single-encounter',
    // Ended relationships (they can still have children from when they were together)
    'divorce', 'separation', 'nullity', 'widowed',
    // Complex dynamics (can still have children)
    'complicated', 'on-off', 'toxic', 'dependency', 'codependent',
    // Special family relationships
    'adoption', 'step-relationship',
    // Emotional relationships that might have children
    'close', 'love', 'best-friends',
    // Social services relationships
    'caregiver', 'supportive'
  ];
  
  const partners = relationships.filter(r => 
    (r.from === selectedPerson.id || r.to === selectedPerson.id) && 
    PARENT_RELATIONSHIP_TYPES.includes(r.type)
  );

  if (partners.length === 0) {
    // No partners - create child with unknown parent
    if (actions.createChildWithUnknownParent) {
      actions.createChildWithUnknownParent(selectedPerson);
    } else {
      console.warn('createChildWithUnknownParent action not available');
    }
  } else if (partners.length === 1) {
    // Exactly one partner - add child to that relationship
    if (actions.addChildToRelationship) {
      actions.addChildToRelationship(partners[0].id);
    } else {
      console.warn('addChildToRelationship action not available');
    }
  } else {
    // Multiple partners - show partner selection
    if (actions.setChildCreationState) {
      actions.setChildCreationState({
        isOpen: true,
        parentPerson: selectedPerson,
        availablePartners: partners
      });
    } else if (actions.showPartnerSelectionModal) {
      // Alternative action name
      actions.showPartnerSelectionModal({
        parentPerson: selectedPerson,
        partners: partners
      });
    } else {
      console.warn('Multiple partners but no partner selection action available');
      // Fallback: add to first partner relationship
      if (actions.addChildToRelationship) {
        actions.addChildToRelationship(partners[0].id);
      }
    }
  }
};

/**
 * Helper function to handle spouse/partner creation
 */
export const handleSpouseCreation = (selectedPerson, actions) => {
  if (!selectedPerson || !actions) return;

  if (actions.createSpouse) {
    actions.createSpouse(selectedPerson);
  } else if (actions.createPartnerForPerson) {
    actions.createPartnerForPerson(selectedPerson);
  } else if (actions.addPartner) {
    actions.addPartner(selectedPerson);
  } else {
    console.warn('No spouse/partner creation action available');
  }
};

/**
 * Helper function to handle parent creation
 */
export const handleParentCreation = (selectedPerson, actions) => {
  if (!selectedPerson || !actions) return;

  if (actions.createParents) {
    actions.createParents(selectedPerson);
  } else if (actions.createParentsForPerson) {
    actions.createParentsForPerson(selectedPerson);
  } else if (actions.addParents) {
    actions.addParents(selectedPerson);
  } else {
    console.warn('No parent creation action available');
  }
};

/**
 * Helper function to start connection drawing
 */
export const handleConnectionStart = (selectedPerson, actions) => {
  if (!actions) return;

  actions.setConnectionDrawing(true);
  if (selectedPerson && actions.selectPerson) {
    actions.selectPerson(selectedPerson);
  }
};

/**
 * Helper function to handle deletion
 */
export const handleDeletion = (state, actions) => {
  if (!state || !actions) return;

  const hasSelection = state.selectedPerson || state.selectedRelationship || 
                      state.selectedHousehold || state.selectedTextBox;

  if (hasSelection) {
    if (actions.setDeleteModalOpen) {
      actions.setDeleteModalOpen(true);
    } else if (actions.setDeleteConfirmationOpen) {
      actions.setDeleteConfirmationOpen(true);
    } else if (actions.showDeleteConfirmation) {
      actions.showDeleteConfirmation();
    } else {
      console.warn('No delete confirmation action available');
    }
  }
};