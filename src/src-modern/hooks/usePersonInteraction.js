import { useCallback } from 'react';
import { useGenogram } from '../contexts/GenogramContext';

export const usePersonInteraction = (person) => {
  const { state, actions } = useGenogram();
  const { isConnecting, connectingFrom, connectingType, connectingFromMarriage } = state;

  const handleMouseDown = useCallback((e) => {
    e.stopPropagation();
    if (isConnecting) return;

    // Don't try to calculate drag offset here - let the canvas handle it
  }, [isConnecting]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    
    if (isConnecting) {
      if (connectingFrom && connectingFrom !== person.id) {
        // Create relationship between two people
        const colors = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
        const colorIndex = state.relationships.length % colors.length;
        
        const newRelationship = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          from: connectingFrom,
          to: person.id,
          type: connectingType,
          color: colors[colorIndex],
          lineStyle: 'default',
          startDate: '',
          endDate: '',
          isActive: !['divorce', 'separation', 'nullity'].includes(connectingType),
          abbr: state.REL_ABBREVIATIONS?.[connectingType] || '',
          notes: '',
          bubblePosition: 0.5
        };
        
        actions.addRelationship(newRelationship);
        actions.cancelConnection();
      } else if (connectingFromMarriage && connectingType === 'child') {
        // Connect person as child to marriage
        const colors = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
        const colorIndex = state.relationships.length % colors.length;
        
        const childRelationship = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          from: connectingFromMarriage,
          to: person.id,
          type: 'child',
          color: colors[colorIndex],
          lineStyle: 'default',
          startDate: '',
          endDate: '',
          isActive: true,
          abbr: '',
          notes: '',
          bubblePosition: 0.5
        };
        
        actions.addRelationship(childRelationship);
        actions.cancelConnection();
      }
    } else {
      actions.selectPerson(person);
    }
  }, [person, isConnecting, connectingFrom, connectingFromMarriage, connectingType, state.relationships, actions, state.REL_ABBREVIATIONS]);

  const handleRightClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isConnecting) return;
    
    actions.setContextMenu({
      type: 'person',
      person: person,
      x: e.clientX,
      y: e.clientY
    });
    
    actions.selectPerson(person);
  }, [person, isConnecting, actions]);

  return {
    handleMouseDown,
    handleClick,
    handleRightClick
  };
};