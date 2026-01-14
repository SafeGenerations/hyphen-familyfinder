// src/src-modern/hooks/usePersonActions.js
import { useCallback } from 'react';
import { useGenogram } from '../contexts/GenogramContext';
import { REL_ABBREVIATIONS } from '../utils/relationshipConstants';
import { NodeType } from '../constants/nodeTypes';
import { trackPersonAction, trackRelationshipAction } from '../../utils/analytics';

const GRID_SIZE = 20;

export const usePersonActions = () => {
  const { state, actions } = useGenogram();
  const { people, relationships, selectedPerson, snapToGrid } = state;

  const snapToGridFunc = useCallback((value) => {
    if (!snapToGrid) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, [snapToGrid]);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const createPerson = useCallback((data = {}) => {
    const newPerson = {
      id: generateId(),
      name: data.name || `Person ${people.length + 1}`,
      type: NodeType.PERSON,
      gender: data.gender || 'female',
      age: data.age || '',
      birthDate: '',
    deathDate: '',
    deceasedSymbol: 'halo',
    deceasedGentleTreatment: 'none',
      isDeceased: false,
      x: snapToGridFunc(data.x || (300 + Math.random() * 200)),
      y: snapToGridFunc(data.y || (200 + Math.random() * 200)),
      generation: data.generation || 0,
      specialStatus: null,
      sexualOrientation: 'not-specified',
      networkMember: false,
      role: '',
      notes: ''
    };

    actions.addPerson(newPerson);
    
    // Track the event
    trackPersonAction('add_person', `gender:${newPerson.gender}`);
    
    return newPerson;
  }, [people.length, snapToGridFunc, actions]);

  const createSpouse = useCallback(() => {
    if (!selectedPerson) return;

    const defaultGender = selectedPerson.gender === 'male' ? 'female' : 
                         selectedPerson.gender === 'female' ? 'male' : 
                         'female';

    const spouse = {
      id: generateId(),
      name: `Person ${people.length + 1}`,
      type: NodeType.PERSON,
      gender: defaultGender,
      age: '',
      birthDate: '',
    deathDate: '',
    deceasedSymbol: 'halo',
    deceasedGentleTreatment: 'none',
      isDeceased: false,
      x: snapToGridFunc(selectedPerson.x + 120),
      y: snapToGridFunc(selectedPerson.y),
      generation: selectedPerson.generation || 0,
      specialStatus: null,
      sexualOrientation: 'not-specified',
      networkMember: false,
      role: '',
      notes: ''
    };

    actions.addPerson(spouse);

    // Create marriage relationship
    const colors = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    const colorIndex = relationships.length % colors.length;

    const marriage = {
      id: generateId(),
      from: selectedPerson.id,
      to: spouse.id,
      type: 'marriage',
      color: colors[colorIndex],
      lineStyle: 'default',
      startDate: '',
      endDate: '',
      isActive: true,
      abbr: REL_ABBREVIATIONS['marriage'] || '',
      notes: '',
      bubblePosition: 0.5
    };

    actions.addRelationship(marriage);
    
    // Track both events
    trackPersonAction('add_spouse', `gender:${spouse.gender}`);
    trackRelationshipAction('create_relationship', 'marriage');
    
    return spouse;
  }, [selectedPerson, people.length, relationships.length, snapToGridFunc, actions]);

  const createParents = useCallback(() => {
    if (!selectedPerson) return;

    const parentGen = (selectedPerson.generation || 0) - 1;
    const baseY = snapToGridFunc(selectedPerson.y - 150);
    const baseFatherX = snapToGridFunc(selectedPerson.x - 60);
    const baseMotherX = snapToGridFunc(baseFatherX + 120);

    const father = {
      id: generateId(),
      name: `Person ${people.length + 1}`,
      type: NodeType.PERSON,
      gender: 'male',
      age: '',
      birthDate: '',
    deathDate: '',
    deceasedSymbol: 'halo',
    deceasedGentleTreatment: 'none',
      isDeceased: false,
      x: baseFatherX,
      y: baseY,
      generation: parentGen,
      specialStatus: null,
      sexualOrientation: 'not-specified',
      networkMember: false,
      role: '',
      notes: ''
    };

    const mother = {
      id: generateId(),
      name: `Person ${people.length + 2}`,
      type: NodeType.PERSON,
      gender: 'female',
      age: '',
      birthDate: '',
    deathDate: '',
    deceasedSymbol: 'halo',
    deceasedGentleTreatment: 'none',
      isDeceased: false,
      x: baseMotherX,
      y: baseY,
      generation: parentGen,
      specialStatus: null,
      sexualOrientation: 'not-specified',
      networkMember: false,
      role: '',
      notes: ''
    };

    actions.addPerson(father);
    actions.addPerson(mother);

    // Create marriage between parents
    const colors = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    const colorIndex = relationships.length % colors.length;

    const marriage = {
      id: generateId(),
      from: father.id,
      to: mother.id,
      type: 'marriage',
      color: colors[colorIndex],
      lineStyle: 'default',
      startDate: '',
      endDate: '',
      isActive: true,
      abbr: REL_ABBREVIATIONS['marriage'] || '',
      notes: '',
      bubblePosition: 0.5
    };

    actions.addRelationship(marriage);

    // Create child relationship
    const childRel = {
      id: generateId(),
      from: marriage.id,
      to: selectedPerson.id,
      type: 'child',
      color: marriage.color,
      lineStyle: 'default',
      startDate: '',
      endDate: '',
      isActive: true,
      abbr: REL_ABBREVIATIONS['child'] || '',
      notes: '',
      bubblePosition: 0.5
    };

    actions.addRelationship(childRel);
    actions.selectPerson(mother);
    
    // Track the event
    trackPersonAction('add_parents', 'both_parents');
    trackRelationshipAction('create_relationship', 'parent-child');
  }, [selectedPerson, people.length, relationships.length, snapToGridFunc, actions]);

  const createChild = useCallback((marriageId = null) => {
    if (!marriageId && selectedPerson) {
      // Find existing marriage/partner relationship
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
      
      const marriage = relationships.find(r => 
        (r.from === selectedPerson.id || r.to === selectedPerson.id) && 
        PARENT_RELATIONSHIP_TYPES.includes(r.type)
      );

      if (!marriage) {
        // Create spouse first
        const spouse = createSpouse();
        if (!spouse) return;

        // Get the newly created marriage
        const newMarriage = relationships.find(r => 
          (r.from === selectedPerson.id && r.to === spouse.id) ||
          (r.from === spouse.id && r.to === selectedPerson.id)
        );
        marriageId = newMarriage?.id;
      } else {
        marriageId = marriage.id;
      }
    }

    if (!marriageId) return;

    const marriage = relationships.find(r => r.id === marriageId);
    if (!marriage) return;

    const parent1 = people.find(p => p.id === marriage.from);
    const parent2 = people.find(p => p.id === marriage.to);
    if (!parent1 || !parent2) return;

    const childGen = Math.max(parent1.generation || 0, parent2.generation || 0) + 1;
    const centerX = (parent1.x + parent2.x) / 2;

    const existingChildRels = relationships.filter(r =>
      r.type === 'child' && r.from === marriageId
    );

    let baseY = snapToGridFunc(Math.max(parent1.y, parent2.y) + 150);
    if (existingChildRels.length > 0) {
      const lastChildRel = existingChildRels[existingChildRels.length - 1];
      const lastChild = people.find(p => p.id === lastChildRel.to);
      if (lastChild) {
        baseY = lastChild.y;
      }
    }

    const existingChildren = existingChildRels.length;

    const child = {
      id: generateId(),
      name: `Child ${existingChildren + 1}`,
      type: NodeType.PERSON,
      gender: Math.random() > 0.5 ? 'male' : 'female',
      age: '',
      birthDate: '',
    deathDate: '',
    deceasedSymbol: 'halo',
    deceasedGentleTreatment: 'none',
      isDeceased: false,
      x: snapToGridFunc(centerX + (existingChildren * 120)),
      y: baseY,
      generation: childGen,
      specialStatus: null,
      sexualOrientation: 'not-specified',
      networkMember: false,
      role: '',
      notes: ''
    };

    actions.addPerson(child);

    // Create child relationship
    const childRel = {
      id: generateId(),
      from: marriageId,
      to: child.id,
      type: 'child',
      color: marriage.color,
      lineStyle: 'default',
      startDate: '',
      endDate: '',
      isActive: true,
      abbr: REL_ABBREVIATIONS['child'] || '',
      notes: '',
      bubblePosition: 0.5
    };

    actions.addRelationship(childRel);
    actions.selectPerson(child);
    
    // Track the event
    trackPersonAction('add_child', `gender:${child.gender}`);
    trackRelationshipAction('create_relationship', 'child');

    return child;
  }, [selectedPerson, people, relationships, snapToGridFunc, actions, createSpouse]);

  const createSpouseAndChild = useCallback((person) => {
    if (!person) return;

    const defaultGender = person.gender === 'male' ? 'female' : 
                         person.gender === 'female' ? 'male' : 
                         'female';

    const spouse = {
      id: generateId(),
      name: `Person ${people.length + 1}`,
      type: NodeType.PERSON,
      gender: defaultGender,
      age: '',
      birthDate: '',
    deathDate: '',
    deceasedSymbol: 'halo',
    deceasedGentleTreatment: 'none',
      isDeceased: false,
      x: snapToGridFunc(person.x + 120),
      y: snapToGridFunc(person.y),
      generation: person.generation || 0,
      specialStatus: null,
      sexualOrientation: 'not-specified',
      networkMember: false,
      role: '',
      notes: ''
    };

    actions.addPerson(spouse);

    // Create marriage relationship
    const colors = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    const colorIndex = relationships.length % colors.length;

    const marriage = {
      id: generateId(),
      from: person.id,
      to: spouse.id,
      type: 'marriage',
      color: colors[colorIndex],
      lineStyle: 'default',
      startDate: '',
      endDate: '',
      isActive: true,
      abbr: REL_ABBREVIATIONS['marriage'] || '',
      notes: '',
      bubblePosition: 0.5
    };

    actions.addRelationship(marriage);

    // Create child
    const childGen = Math.max(person.generation || 0, spouse.generation || 0) + 1;
    const centerX = (person.x + spouse.x) / 2;
    const baseY = snapToGridFunc(Math.max(person.y, spouse.y) + 150);

    const child = {
      id: generateId(),
      name: 'New Child',
      type: NodeType.PERSON,
      gender: Math.random() > 0.5 ? 'male' : 'female',
      age: '',
      birthDate: '',
      deathDate: '',
      isDeceased: false,
      x: snapToGridFunc(centerX),
      y: baseY,
      generation: childGen,
      specialStatus: null,
      sexualOrientation: 'not-specified',
      networkMember: false,
      role: '',
      notes: ''
    };

    actions.addPerson(child);

    // Create child relationship
    const childRel = {
      id: generateId(),
      from: marriage.id,
      to: child.id,
      type: 'child',
      color: marriage.color,
      lineStyle: 'default',
      startDate: '',
      endDate: '',
      isActive: true,
      abbr: REL_ABBREVIATIONS['child'] || '',
      notes: '',
      bubblePosition: 0.5
    };

    actions.addRelationship(childRel);
    actions.selectPerson(child);
    
    // Track both events
    trackPersonAction('add_spouse', `gender:${spouse.gender}`);
    trackPersonAction('add_child', `gender:${child.gender}`);
    trackRelationshipAction('create_relationship', 'marriage');
    trackRelationshipAction('create_relationship', 'child');
    
    return { spouse, child, marriage };
  }, [people.length, relationships.length, snapToGridFunc, actions]);

  const startConnectionFromPerson = useCallback((type) => {
    console.log('=== START CONNECTION FROM PERSON DEBUG ===');
    console.log('Selected person:', selectedPerson?.name);
    console.log('Connection type:', type);
    
    if (!selectedPerson) {
      console.log('❌ No selected person');
      return;
    }
    
    console.log('🚀 Starting connection:', selectedPerson.id, null, type);
    actions.startConnection(selectedPerson.id, null, type);
    
    // Track connection start
    trackRelationshipAction('start_connection', type);
  }, [selectedPerson, actions]);

  const deleteSelectedPerson = useCallback(() => {
    if (!selectedPerson) return;
    
    actions.setDeleteConfirmation({
      type: 'person',
      title: 'Delete Person',
      message: `Are you sure you want to delete "${selectedPerson.name}"?`,
      onConfirm: () => {
        actions.deletePerson(selectedPerson.id);
        actions.setDeleteConfirmation(null);
        
        // Track deletion
        trackPersonAction('delete_person', `network:${selectedPerson.networkMember}`);
      },
      onCancel: () => actions.setDeleteConfirmation(null)
    });
  }, [selectedPerson, actions]);

  const disconnectChildFromParents = useCallback(() => {
    if (!selectedPerson) return;

    // Find the child relationship for this person
    const childRelationship = relationships.find(r => 
      r.type === 'child' && r.to === selectedPerson.id
    );

    if (!childRelationship) {
      console.log('No parent relationship found for this person');
      return;
    }

    // Find the parent relationship to get parent names for confirmation
    const parentRelationship = relationships.find(r => r.id === childRelationship.from);
    if (!parentRelationship) {
      console.log('Parent relationship not found');
      return;
    }

    // Get parent names for confirmation message
    const parent1 = people.find(p => p.id === parentRelationship.from);
    const parent2 = people.find(p => p.id === parentRelationship.to);
    
    let parentNames = '';
    if (parent1 && parent2) {
      parentNames = `${parent1.name} and ${parent2.name}`;
    } else if (parent1) {
      parentNames = parent1.name;
    } else if (parent2) {
      parentNames = parent2.name;
    } else {
      parentNames = 'their parents';
    }

    // Show confirmation dialog
    actions.setDeleteConfirmation({
      type: 'relationship',
      title: 'Disconnect from Parents',
      message: `Disconnect ${selectedPerson.name} from ${parentNames}?`,
      onConfirm: () => {
        actions.deleteRelationship(childRelationship.id);
        actions.setDeleteConfirmation(null);
        
        // Track the event
        trackRelationshipAction('delete_relationship', 'parent-child-disconnect');
      },
      onCancel: () => actions.setDeleteConfirmation(null)
    });
  }, [selectedPerson, relationships, people, actions]);

  return {
    createPerson,
    createSpouse,
    createSpouseAndChild,
    createParents,
    createChild,
    startConnectionFromPerson,
    deleteSelectedPerson,
    disconnectChildFromParents
  };
};