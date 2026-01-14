// ===== FILE: src-modern/hooks/useRelationshipInteraction.js =====
import { useCallback } from 'react';
import { useGenogram } from '../contexts/GenogramContext';

export const useRelationshipInteraction = (relationship) => {
  const { state, actions } = useGenogram();
  const { isConnecting, connectingType } = state;

  const handleLineMouseDown = useCallback((e) => {
    e.stopPropagation();
    if (!isConnecting) {
      // Start dragging to adjust bubble position
    }
  }, [isConnecting]);

  const handleLineClick = useCallback((e) => {
    e.stopPropagation();
    if (!isConnecting) {
      actions.selectRelationship(relationship);
    }
  }, [isConnecting, relationship, actions]);

  const handleLineRightClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    actions.setContextMenu({
      type: 'relationship',
      relationship: relationship,
      x: e.clientX,
      y: e.clientY
    });
    
    actions.selectRelationship(relationship);
  }, [relationship, actions]);

  const handleBubbleMouseDown = useCallback((e) => {
    e.stopPropagation();
    // Could implement bubble dragging here
  }, []);

  const handleBubbleClick = useCallback((e) => {
    e.stopPropagation();
    
    if (isConnecting && connectingType === 'child') {
      // This is a parent relationship bubble - can connect a child
      actions.startConnection(null, relationship.id, 'child');
    } else {
      actions.selectRelationship(relationship);
    }
  }, [isConnecting, connectingType, relationship, actions]);

  return {
    handleLineMouseDown,
    handleLineClick,
    handleLineRightClick,
    handleBubbleMouseDown,
    handleBubbleClick
  };
};
