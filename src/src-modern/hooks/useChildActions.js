// src/src-modern/hooks/useChildActions.js
import { useState } from 'react';
import { useGenogram } from '../contexts/GenogramContext';

const GRID_SIZE = 20;

export const useChildActions = () => {
  const { state, actions } = useGenogram();
  const { relationships, snapToGrid } = state;
  const [showChildOptions, setShowChildOptions] = useState(false);

  // Grid snapping function
  const snapToGridFunc = (value) => {
    if (!snapToGrid) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  // Get partner relationships for a person
  const getPartnerRelationships = (personId) => {
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
    
    return relationships.filter(r => 
      (r.from === personId || r.to === personId) &&
      PARENT_RELATIONSHIP_TYPES.includes(r.type)
    );
  };

  // Create a partnership with an unknown parent AND immediately add a child
  const createChildWithUnknownParent = (person) => {
    // Create unknown parent
    const unknownParent = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: 'Unknown',
      gender: 'unknown',
      x: snapToGridFunc(person.x + 150),
      y: snapToGridFunc(person.y),
    age: '',
    birthDate: '',
    deceasedSymbol: 'halo',
    deceasedGentleTreatment: 'none',
      isDeceased: false,
      specialStatus: null,
      networkMember: false
    };
    
    // Create partnership
    const partnership = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      from: person.id,
      to: unknownParent.id,
      type: 'partner',
      color: '#9ca3af',
      lineStyle: 'dashed',
      isActive: false,
      notes: 'Unknown co-parent',
      bubblePosition: 0.5,
      startDate: '',
      endDate: '',
      abbr: ''
    };
    
    // Create the child
    const child = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: 'New Child',
      gender: 'unknown',
      x: snapToGridFunc(person.x),
      y: snapToGridFunc(person.y + 150),
    age: '',
    birthDate: '',
    deceasedSymbol: 'halo',
    deceasedGentleTreatment: 'none',
      isDeceased: false,
      specialStatus: null,
      networkMember: false
    };
    
    // Create child relationship
    const childRelationship = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      from: partnership.id,
      to: child.id,
      type: 'child',
      color: partnership.color,
      lineStyle: 'default',
      isActive: true
    };
    
    // Add everything at once
    actions.addPerson(unknownParent);
    actions.addRelationship(partnership);
    actions.addPerson(child);
    actions.addRelationship(childRelationship);
    
    // Select the new child for editing
    setTimeout(() => {
      actions.selectPerson(child);
    }, 100);
    
    return { partnership, child };
  };

  // Create a single parent adoption AND immediately add a child
  const createSingleParentAdoption = (person) => {
    // Create adoption relationship (self-referential)
    const adoptionRelationship = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      from: person.id,
      to: person.id,
      type: 'adoption',
      color: '#06b6d4',
      lineStyle: 'dotted',
      isActive: true,
      notes: 'Single parent adoption',
      bubblePosition: 0.5,
      abbr: 'A'
    };
    
    // Create adopted child
    const child = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: 'Adopted Child',
      gender: 'unknown',
      x: snapToGridFunc(person.x),
      y: snapToGridFunc(person.y + 150),
      age: '',
      birthDate: '',
      deceasedSymbol: 'halo',
      deceasedGentleTreatment: 'none',
      isDeceased: false,
      specialStatus: 'adopted',
      networkMember: false
    };
    
    // Create child relationship
    const childRelationship = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      from: adoptionRelationship.id,
      to: child.id,
      type: 'child',
      color: adoptionRelationship.color,
      lineStyle: 'dashed',
      isActive: true
    };
    
    // Add everything
    actions.addRelationship(adoptionRelationship);
    actions.addPerson(child);
    actions.addRelationship(childRelationship);
    
    // Select the new child
    setTimeout(() => {
      actions.selectPerson(child);
    }, 100);
    
    return { adoptionRelationship, child };
  };

  // For existing partnerships, add a child directly
  const addChildToRelationship = (relationship, person) => {
    // Calculate child position
    const child = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: 'New Child',
      gender: 'unknown',
      x: snapToGridFunc(person.x),
      y: snapToGridFunc(person.y + 150),
      age: '',
      birthDate: '',
      isDeceased: false,
      deceasedSymbol: 'halo',
      deceasedGentleTreatment: 'none',
      specialStatus: null,
      networkMember: false
    };
    
    // Create child relationship
    const childRelationship = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      from: relationship.id,
      to: child.id,
      type: 'child',
      color: relationship.color || '#3b82f6',
      lineStyle: 'default',
      isActive: true
    };
    
    // Add child
    actions.addPerson(child);
    actions.addRelationship(childRelationship);
    
    // Select the new child
    setTimeout(() => {
      actions.selectPerson(child);
    }, 100);
    
    return child;
  };

  // Select a partnership and add a child immediately
const selectPartnerRelationship = (relationship, person) => {
  console.log('selectPartnerRelationship called with:', {
    relationship,
    person,
    relationshipId: relationship?.id
  });
  
  if (!relationship || !relationship.id) {
    console.error('Invalid relationship passed to selectPartnerRelationship');
    return;
  }
  
  if (actions.addChildToRelationship) {
    console.log('Calling addChildToRelationship with ID:', relationship.id);
    actions.addChildToRelationship(relationship.id);
  } else {
    console.error('addChildToRelationship not available in context!');
  }
};

  return {
    showChildOptions,
    setShowChildOptions,
    getPartnerRelationships,
    createChildWithUnknownParent,
    createSingleParentAdoption,
    selectPartnerRelationship,
    addChildToRelationship
  };
};