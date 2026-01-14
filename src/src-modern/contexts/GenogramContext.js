// src/contexts/GenogramContext.js
import React, { createContext, useContext, useReducer, useRef } from 'react';
import { NodeType } from '../constants/nodeTypes';
import { ConnectionStatus, PlacementStatus, CareStatus, FosterCareStatus } from '../constants/connectionStatus';
import { createAuditLog } from '../services/auditService';
import { updateHouseholdsWithMembers } from '../utils/householdUtils';

const GenogramContext = createContext();

const ensureNodeDefaults = (person = {}) => {
  const type = person.type || NodeType.PERSON;
  const base = {
    ...person,
    type,
    notes: person.notes ?? '',
    notesRichText: typeof person.notesRichText === 'string' ? person.notesRichText : '',
    typeData: person.typeData && typeof person.typeData === 'object' && !Array.isArray(person.typeData)
      ? person.typeData
      : {},
    deceasedGentleTreatment: person.deceasedGentleTreatment ?? 'none',
    caseLog: Array.isArray(person.caseLog) ? person.caseLog : [],
    tags: Array.isArray(person.tags) ? person.tags : [], // Array of tag IDs
    contactInfo: person.contactInfo && typeof person.contactInfo === 'object' && !Array.isArray(person.contactInfo)
      ? {
          phones: Array.isArray(person.contactInfo.phones) ? person.contactInfo.phones : [],
          emails: Array.isArray(person.contactInfo.emails) ? person.contactInfo.emails : [],
          addresses: Array.isArray(person.contactInfo.addresses) ? person.contactInfo.addresses : []
        }
      : { phones: [], emails: [], addresses: [] },
    // Child welfare case management fields
    careStatus: person.careStatus ?? CareStatus.NOT_APPLICABLE,
    caseData: person.caseData && typeof person.caseData === 'object' && !Array.isArray(person.caseData)
      ? {
          removalDate: person.caseData.removalDate || null,
          caseGoal: person.caseData.caseGoal || null,
          permanencyTimeline: person.caseData.permanencyTimeline || null,
          caseworker: person.caseData.caseworker || '',
          caseNumber: person.caseData.caseNumber || ''
        }
      : { removalDate: null, caseGoal: null, permanencyTimeline: null, caseworker: '', caseNumber: '' },
    // Foster care caregiver fields
    fosterCareStatus: person.fosterCareStatus ?? FosterCareStatus.NOT_APPLICABLE,
    fosterCareData: person.fosterCareData && typeof person.fosterCareData === 'object' && !Array.isArray(person.fosterCareData)
      ? {
          licenseNumber: person.fosterCareData.licenseNumber || '',
          licenseExpiration: person.fosterCareData.licenseExpiration || null,
          licenseType: person.fosterCareData.licenseType || null,
          maxChildren: person.fosterCareData.maxChildren || null,
          currentChildren: person.fosterCareData.currentChildren || 0,
          ageRangeMin: person.fosterCareData.ageRangeMin || null,
          ageRangeMax: person.fosterCareData.ageRangeMax || null,
          specialNeeds: person.fosterCareData.specialNeeds ?? false,
          notes: person.fosterCareData.notes || ''
        }
      : { licenseNumber: '', licenseExpiration: null, licenseType: null, maxChildren: null, currentChildren: 0, ageRangeMin: null, ageRangeMax: null, specialNeeds: false, notes: '' }
  };

  if (type === NodeType.PERSON) {
    base.deceasedSymbol = base.deceasedSymbol ?? 'halo';
    if (Object.prototype.hasOwnProperty.call(person, 'networkNotes')) {
      base.networkNotes = person.networkNotes ?? '';
    } else if (person.networkMember && typeof person.notes === 'string' && person.notes.trim().length > 0) {
      base.networkNotes = person.notes;
    } else if (base.networkNotes === undefined) {
      base.networkNotes = '';
    }
  } else if (Object.prototype.hasOwnProperty.call(person, 'networkNotes')) {
    base.networkNotes = person.networkNotes ?? '';
  }

  return base;
};

const mergeNodeUpdates = (person, updates = {}) => {
  const hasTypeDataUpdate = Object.prototype.hasOwnProperty.call(updates, 'typeData');
  let nextTypeData = person.typeData || {};

  if (hasTypeDataUpdate) {
    const updateValue = updates.typeData;
    if (updateValue === null) {
      nextTypeData = {};
    } else if (updateValue && typeof updateValue === 'object' && !Array.isArray(updateValue)) {
      nextTypeData = { ...nextTypeData, ...updateValue };
    } else {
      nextTypeData = updateValue;
    }
  }

  const merged = {
    ...person,
    ...updates,
    typeData: nextTypeData
  };

  return ensureNodeDefaults(merged);
};

const initialState = {
  // Data
  people: [],
  relationships: [],
  households: [],
  placements: [], // Placement considerations (child-to-caregiver many-to-many)
  textBoxes: [],
  customAttributes: [],
  metadata: {},
  nextPersonPosition: null,
  
  // Tags - custom categorization system
  tagDefinitions: [], // Array of { id, name, color, description }
  
  // Search history and filter templates
  searchHistory: [], // Recent filter configurations: { id, filters, timestamp }
  filterTemplates: [], // Saved templates: { id, name, description, filters, createdAt, usageCount }
  
  // Selection
  selectedPerson: null,
  selectedRelationship: null,
  selectedTextBox: null,
  selectedHousehold: null,
  selectedPlacement: null,
  
  // Connection mode
  isConnecting: false,
  connectingFrom: null,
  connectingFromMarriage: null,
  connectingType: 'marriage',
  connectionPreview: null,
  
  // Drawing mode
  isDrawingHousehold: false,
  currentHouseholdPoints: [],
  
  // UI State
  sidePanelOpen: false,
  quickAddOpen: false,
  discoveryPanelOpen: false,
  analyticsPanelOpen: false,
  searchModalOpen: false,
  contextMenu: null,
  deleteConfirmation: null,  
  newPersonModalOpen: false,  
  quickEditOpen: false,
  mobileMenuOpen: false,
  childConnectionOptions: null,
  showBulkEditPanel: false, // Bulk edit panel for multi-select
  searchingNetworkFor: null, // Person to search network connections for
  
  // Multi-select state
  selectedNodes: [], // Array of selected node IDs for bulk operations
  lastSelectedNode: null, // Track last selected for Shift+click range selection
  
  // Clipboard
  clipboard: null, // { type: 'person' | 'relationship' | 'textBox' | 'household', data: {...} }
  
  // Canvas State
  zoom: 1,
  pan: { x: 0, y: 0 },
  snapToGrid: true,
  highlightNetwork: false,
  filteredNodes: null, // null = show all, array = show only these IDs
  showConnectionBadges: true,
  showPlacementBadges: true,
  showRelationshipBubbles: 'full', // 'full' | 'labels-only' | 'hidden'
  focusedNodeId: null,
  
  // File State
  fileName: 'Untitled Genogram',
  isDirty: false,
  
  // History
  history: [],
  historyIndex: -1
};

function genogramReducer(state, action) {
  switch (action.type) {
    // People Actions
    case 'ADD_PERSON':
      const normalizedPerson = ensureNodeDefaults(action.payload);
      return {
        ...state,
        people: [...state.people, normalizedPerson],
        selectedPerson: normalizedPerson,
        selectedRelationship: null,
        selectedTextBox: null,
        selectedHousehold: null,
        sidePanelOpen: true,
        isDirty: true
      };

    case 'SET_NEXT_PERSON_POSITION':
      return {
        ...state,
        nextPersonPosition: action.payload
      };
    case 'SET_QUICK_EDIT_OPEN':
      return { 
      ...state, 
      quickEditOpen: action.payload 
      };
      
        case 'SET_MOBILE_MENU_OPEN':
      return {
        ...state,
        mobileMenuOpen: action.payload
      };
      
    case 'SET_CHILD_CONNECTION_OPTIONS':
      return {
        ...state,
        childConnectionOptions: action.payload,
        isConnecting: false,
        connectingFrom: null,
        connectingFromMarriage: null,
        connectingType: 'marriage',
        connectionPreview: null
      };  

    case 'UPDATE_PERSON': {
      const updatedPeople = state.people.map(p => 
        p.id === action.payload.id 
          ? mergeNodeUpdates(p, action.payload.updates)
          : p
      );
      
      // Recalculate household members when a person's position changes
      const shouldRecalculateMembers = 
        action.payload.updates.x !== undefined || 
        action.payload.updates.y !== undefined;
      
      const updatedHouseholds = shouldRecalculateMembers
        ? updateHouseholdsWithMembers(state.households, updatedPeople)
        : state.households;
      
      return {
        ...state,
        people: updatedPeople,
        households: updatedHouseholds,
        selectedPerson: state.selectedPerson?.id === action.payload.id
          ? mergeNodeUpdates(state.selectedPerson, action.payload.updates)
          : state.selectedPerson,
        isDirty: true
      };
    }
      
    case 'COPY_TO_CLIPBOARD':
      return {
        ...state,
        clipboard: action.payload
      };
      
    case 'DELETE_PERSON':
      const removedRelIds = state.relationships
        .filter(r => r.from === action.payload || r.to === action.payload)
        .map(r => r.id);
      
      // Also delete any placements involving this person (as child or caregiver)
      const updatedPlacements = state.placements.filter(p => 
        p.childId !== action.payload && p.caregiverId !== action.payload
      );
      
      // Check if the person being deleted is a child
      const childRelationship = state.relationships.find(r => 
        r.type === 'child' && r.to === action.payload
      );
      
      let updatedPeopleAfterDelete = state.people.filter(p => p.id !== action.payload);
      
      // If this person was a child, re-space their siblings
      if (childRelationship) {
        const parentRelationshipId = childRelationship.from;
        
        // Find the parent relationship
        const parentRelationship = state.relationships.find(r => r.id === parentRelationshipId);
        
        if (parentRelationship) {
          // Find the parents
          const parent1 = state.people.find(p => p.id === parentRelationship.from);
          const parent2 = state.people.find(p => p.id === parentRelationship.to);
          
          // Calculate center position between parents
          let centerX;
          if (parent1 && parent2) {
            centerX = (parent1.x + parent2.x) / 2;
          } else if (parent1) {
            centerX = parent1.x;
          } else if (parent2) {
            centerX = parent2.x;
          }
          
          if (centerX !== undefined) {
            // Find all remaining siblings of this parent relationship
            const remainingSiblingRelationships = state.relationships.filter(r =>
              r.type === 'child' && 
              r.from === parentRelationshipId && 
              r.to !== action.payload
            );
            
            const remainingSiblings = remainingSiblingRelationships.map(rel =>
              updatedPeopleAfterDelete.find(p => p.id === rel.to)
            ).filter(Boolean);
            
            if (remainingSiblings.length > 0) {
              // Sort siblings by current X position
              const sortedSiblings = [...remainingSiblings].sort((a, b) => a.x - b.x);
              
              // Calculate new positions with proper spacing
              const SPACING = 100;
              const totalWidth = (sortedSiblings.length - 1) * SPACING;
              const startX = centerX - (totalWidth / 2);
              
              console.log(`Re-spacing ${sortedSiblings.length} remaining siblings after deletion`);
              
              // Update positions of remaining siblings
              sortedSiblings.forEach((sibling, index) => {
                const newX = startX + (index * SPACING);
                const personIndex = updatedPeopleAfterDelete.findIndex(p => p.id === sibling.id);
                if (personIndex !== -1) {
                  console.log(`Moving sibling "${sibling.name}" to X=${newX}`);
                  updatedPeopleAfterDelete[personIndex] = {
                    ...updatedPeopleAfterDelete[personIndex],
                    x: newX
                  };
                }
              });
            }
          }
        }
      }
      
      // Filter relationships
      const updatedRelationships = state.relationships.filter(r => {
        if (r.from === action.payload || r.to === action.payload) return false;
        if (r.type === 'child' && removedRelIds.includes(r.from)) return false;
        return true;
      });
      
      return {
        ...state,
        people: updatedPeopleAfterDelete,
        relationships: updatedRelationships,
        placements: updatedPlacements,
        selectedPerson: null,
        selectedRelationship: null,
        focusedNodeId: state.focusedNodeId === action.payload ? null : state.focusedNodeId,
        isDirty: true
      };
      
    // Relationship Actions
    case 'ADD_RELATIONSHIP':
      return {
        ...state,
        relationships: [...state.relationships, action.payload],
        isDirty: true
      };

    case 'ADD_PLACEMENT':
      return {
        ...state,
        placements: [...state.placements, action.payload],
        isDirty: true
      };

    case 'UPDATE_PLACEMENT':
      return {
        ...state,
        placements: state.placements.map(p => 
          p.id === action.payload.id 
            ? { ...p, ...action.payload.updates }
            : p
        ),
        isDirty: true
      };

    case 'DELETE_PLACEMENT':
      return {
        ...state,
        placements: state.placements.filter(p => p.id !== action.payload),
        selectedPlacement: state.selectedPlacement?.id === action.payload ? null : state.selectedPlacement,
        isDirty: true
      };

    case 'SET_SELECTED_PLACEMENT':
      return {
        ...state,
        selectedPlacement: action.payload,
        sidePanelOpen: action.payload !== null
      };

    case 'UPDATE_RELATIONSHIP':
      console.log('=== UPDATE_RELATIONSHIP - PRESERVING CHILDREN ===');
      console.log('Updating relationship:', action.payload.id);
      console.log('Updates:', action.payload.updates);
      
      // Check if this relationship has children
      const childRelationships = state.relationships.filter(r => 
        r.type === 'child' && r.from === action.payload.id
      );
      
      if (childRelationships.length > 0) {
        console.log(`⚠️  PRESERVING ${childRelationships.length} child relationships for updated relationship`);
        console.log('Child relationships:', childRelationships.map(r => r.id));
      }
      
      // Update the relationship while preserving all existing child relationships
      return {
        ...state,
        relationships: state.relationships.map(r => 
          r.id === action.payload.id 
            ? { ...r, ...action.payload.updates } 
            : r
        ),
        selectedRelationship: state.selectedRelationship?.id === action.payload.id
          ? { ...state.selectedRelationship, ...action.payload.updates }
          : state.selectedRelationship,
        isDirty: true
      };
      
    case 'DELETE_RELATIONSHIP':
      console.log('=== DELETE_RELATIONSHIP - CHECKING CHILDREN ===');
      console.log('Deleting relationship:', action.payload);
      
      // Check if this relationship has children
      const childrenToDelete = state.relationships.filter(r => 
        r.type === 'child' && r.from === action.payload
      );
      
      if (childrenToDelete.length > 0) {
        console.log(`⚠️  WARNING: Deleting relationship will also remove ${childrenToDelete.length} child relationships`);
        console.log('Child relationships being deleted:', childrenToDelete.map(r => r.id));
        
        // Find the child people who will lose their parent relationship
        const childPeople = childrenToDelete.map(childRel => {
          const child = state.people.find(p => p.id === childRel.to);
          return child ? child.name : 'Unknown';
        });
        console.log('Children affected:', childPeople);
      }
      
      return {
        ...state,
        relationships: state.relationships.filter(r => {
          if (r.id === action.payload) return false;
          if (r.type === 'child' && r.from === action.payload) return false;
          return true;
        }),
        selectedRelationship: null,
        isDirty: true
      };
      
    // Household Actions
    case 'ADD_HOUSEHOLD': {
      // Calculate members for all households including the new one
      const updatedHouseholds = updateHouseholdsWithMembers(
        [...state.households, action.payload],
        state.people
      );
      
      // Find the newly added household with calculated members
      const householdWithMembers = updatedHouseholds.find(h => h.id === action.payload.id);
      
      return {
        ...state,
        households: updatedHouseholds,
        selectedHousehold: householdWithMembers,
        isDrawingHousehold: false,
        currentHouseholdPoints: [],
        isDirty: true
      };
    }
      
    case 'UPDATE_HOUSEHOLD': {
      const updatedHouseholds = state.households.map(h => 
        h.id === action.payload.id 
          ? { ...h, ...action.payload.updates } 
          : h
      );
      
      // Recalculate members for all households after update
      const householdsWithMembers = updateHouseholdsWithMembers(updatedHouseholds, state.people);
      const updatedHousehold = householdsWithMembers.find(h => h.id === action.payload.id);
      
      return {
        ...state,
        households: householdsWithMembers,
        selectedHousehold: state.selectedHousehold?.id === action.payload.id
          ? updatedHousehold
          : state.selectedHousehold,
        isDirty: true
      };
    }
      
    case 'DELETE_HOUSEHOLD':
      return {
        ...state,
        households: state.households.filter(h => h.id !== action.payload),
        selectedHousehold: null,
        isDirty: true
      };


      
    case 'ADD_POINT_TO_HOUSEHOLD':
      return {
        ...state,
        households: state.households.map(h => {
          if (h.id === action.payload.householdId) {
            const newPoints = [...h.points];
            // Insert the new point at the specified index, or at the end if no index
            if (action.payload.index !== undefined) {
              newPoints.splice(action.payload.index + 1, 0, action.payload.point);
            } else {
              newPoints.push(action.payload.point);
            }
            return { ...h, points: newPoints };
          }
          return h;
        }),
        isDirty: true
      };  

    // Text Box Actions
    case 'ADD_TEXTBOX':
      return {
        ...state,
        textBoxes: [...state.textBoxes, action.payload],
        selectedTextBox: action.payload,
        selectedPerson: null,
        selectedRelationship: null,
        selectedHousehold: null,
        sidePanelOpen: true,
        isDirty: true
      };
      
    case 'UPDATE_TEXTBOX':
      return {
        ...state,
        textBoxes: state.textBoxes.map(t => 
          t.id === action.payload.id 
            ? { ...t, ...action.payload.updates } 
            : t
        ),
        selectedTextBox: state.selectedTextBox?.id === action.payload.id
          ? { ...state.selectedTextBox, ...action.payload.updates }
          : state.selectedTextBox,
        isDirty: true
      };
      
    case 'DELETE_TEXTBOX':
      return {
        ...state,
        textBoxes: state.textBoxes.filter(t => t.id !== action.payload),
        selectedTextBox: null,
        isDirty: true
      };

    // Custom Attributes Actions
    case 'SET_CUSTOM_ATTRIBUTES':
      return {
        ...state,
        customAttributes: action.payload,
        isDirty: true
      };

    // Tag Management Actions
    case 'ADD_TAG_DEFINITION':
      return {
        ...state,
        tagDefinitions: [...state.tagDefinitions, action.payload],
        isDirty: true
      };

    case 'UPDATE_TAG_DEFINITION':
      return {
        ...state,
        tagDefinitions: state.tagDefinitions.map(tag =>
          tag.id === action.payload.id ? { ...tag, ...action.payload.updates } : tag
        ),
        isDirty: true
      };

    case 'DELETE_TAG_DEFINITION':
      const tagIdToDelete = action.payload;
      return {
        ...state,
        tagDefinitions: state.tagDefinitions.filter(tag => tag.id !== tagIdToDelete),
        // Remove this tag from all people
        people: state.people.map(person => ({
          ...person,
          tags: person.tags.filter(tagId => tagId !== tagIdToDelete)
        })),
        isDirty: true
      };

    // Search History Actions
    case 'ADD_TO_SEARCH_HISTORY':
      const updatedSearchHistory = [
        action.payload,
        ...state.searchHistory.filter(h => JSON.stringify(h.filters) !== JSON.stringify(action.payload.filters))
      ].slice(0, 10); // Keep last 10 searches
      return {
        ...state,
        searchHistory: updatedSearchHistory
      };

    case 'CLEAR_SEARCH_HISTORY':
      return {
        ...state,
        searchHistory: []
      };

    // Filter Template Actions
    case 'ADD_FILTER_TEMPLATE':
      return {
        ...state,
        filterTemplates: [...state.filterTemplates, action.payload],
        isDirty: true
      };

    case 'UPDATE_FILTER_TEMPLATE':
      return {
        ...state,
        filterTemplates: state.filterTemplates.map(template =>
          template.id === action.payload.id ? { ...template, ...action.payload.updates } : template
        ),
        isDirty: true
      };

    case 'DELETE_FILTER_TEMPLATE':
      return {
        ...state,
        filterTemplates: state.filterTemplates.filter(template => template.id !== action.payload),
        isDirty: true
      };

    case 'ADD_TAG_TO_PERSON':
      const updatedPeopleWithTag = state.people.map(person =>
        person.id === action.payload.personId
          ? { ...person, tags: [...new Set([...person.tags, action.payload.tagId])] }
          : person
      );
      const updatedPersonWithTag = updatedPeopleWithTag.find(p => p.id === action.payload.personId);
      return {
        ...state,
        people: updatedPeopleWithTag,
        selectedPerson: state.selectedPerson?.id === action.payload.personId ? updatedPersonWithTag : state.selectedPerson,
        isDirty: true
      };

    case 'REMOVE_TAG_FROM_PERSON':
      const updatedPeopleWithoutTag = state.people.map(person =>
        person.id === action.payload.personId
          ? { ...person, tags: person.tags.filter(id => id !== action.payload.tagId) }
          : person
      );
      const updatedPersonWithoutTag = updatedPeopleWithoutTag.find(p => p.id === action.payload.personId);
      return {
        ...state,
        people: updatedPeopleWithoutTag,
        selectedPerson: state.selectedPerson?.id === action.payload.personId ? updatedPersonWithoutTag : state.selectedPerson,
        isDirty: true
      };

    case 'BULK_ADD_TAG':
      return {
        ...state,
        people: state.people.map(person =>
          action.payload.personIds.includes(person.id)
            ? { ...person, tags: [...new Set([...person.tags, action.payload.tagId])] }
            : person
        ),
        isDirty: true
      };

    case 'BULK_REMOVE_TAG':
      return {
        ...state,
        people: state.people.map(person =>
          action.payload.personIds.includes(person.id)
            ? { ...person, tags: person.tags.filter(id => id !== action.payload.tagId) }
            : person
        ),
        isDirty: true
      };

    // Selection Actions
    case 'SELECT_PERSON':
      const person = action.payload?.person || action.payload;
      const shouldOpenPanel = action.payload?.openPanel !== false && person !== null;
      const nextFocusedNodeId = person && state.selectedPerson?.id === person?.id
        ? state.focusedNodeId
        : null;
      return {
        ...state,
        selectedPerson: person,
        selectedRelationship: null,
        selectedTextBox: null,
        selectedHousehold: null,
        sidePanelOpen: shouldOpenPanel,
        focusedNodeId: nextFocusedNodeId
      };

    case 'SET_NEW_PERSON_MODAL':
      return {
       ...state,
       newPersonModalOpen: action.payload
      };  

    case 'SELECT_RELATIONSHIP':
      const relationship = action.payload?.relationship || action.payload;
      const shouldOpenRelationshipPanel = action.payload?.openPanel !== false && relationship !== null;
      return {
        ...state,
        selectedRelationship: relationship,
        selectedPerson: null,
        selectedTextBox: null,
        selectedHousehold: null,
        sidePanelOpen: shouldOpenRelationshipPanel,
        focusedNodeId: null
      };
      
    case 'SELECT_TEXTBOX':
      const textBox = action.payload?.textBox || action.payload;
      const shouldOpenTextBoxPanel = action.payload?.openPanel !== false && textBox !== null;
      return {
        ...state,
        selectedTextBox: textBox,
        selectedPerson: null,
        selectedRelationship: null,
        selectedHousehold: null,
        sidePanelOpen: shouldOpenTextBoxPanel,
        focusedNodeId: null
      };
      
    case 'SELECT_HOUSEHOLD':
      return {
        ...state,
        selectedHousehold: action.payload,
        selectedPerson: null,
        selectedRelationship: null,
        selectedTextBox: null,
        sidePanelOpen: action.payload !== null,
        focusedNodeId: null
      };
      
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedPerson: null,
        selectedRelationship: null,
        selectedTextBox: null,
        selectedHousehold: null,
        contextMenu: null,
        sidePanelOpen: false,
        mobileMenuOpen: false,
        focusedNodeId: null,
        selectedNodes: []
      };
      
    // Connection Mode
    case 'START_CONNECTION':
      console.log('=== START_CONNECTION REDUCER DEBUG ===');
      console.log('Payload:', action.payload);
      console.log('Setting isConnecting to true');
      console.log('connectingFrom:', action.payload.personId);
      console.log('connectingFromMarriage:', action.payload.marriageId);
      console.log('connectingType:', action.payload.type);
      
      return {
        ...state,
        isConnecting: true,
        connectingFrom: action.payload.personId,
        connectingFromMarriage: action.payload.marriageId,
        connectingType: action.payload.type,
        connectionPreview: null
      };
      
    case 'CANCEL_CONNECTION':
      console.log('=== CANCEL_CONNECTION REDUCER DEBUG ===');
      console.log('Canceling connection mode');
      console.log('Previous state:', {
        isConnecting: state.isConnecting,
        connectingFrom: state.connectingFrom,
        connectingType: state.connectingType
      });
      
      return {
        ...state,
        isConnecting: false,
        connectingFrom: null,
        connectingFromMarriage: null,
        connectingType: 'marriage',
        connectionPreview: null
      };
      
    // Household Drawing
    case 'START_DRAWING_HOUSEHOLD':
      return {
        ...state,
        isDrawingHousehold: true,
        currentHouseholdPoints: []
      };
      
    case 'ADD_HOUSEHOLD_POINT':
      return {
        ...state,
        currentHouseholdPoints: [...state.currentHouseholdPoints, action.payload]
      };
      
    case 'FINISH_HOUSEHOLD':
      if (state.currentHouseholdPoints.length >= 3) {
        // Generate default household name
        const existingHouseholdNumbers = state.households
          .map(h => h.label || h.name || '')
          .filter(name => /^Household \d+$/.test(name))
          .map(name => parseInt(name.replace('Household ', '')))
          .filter(num => !isNaN(num))
          .sort((a, b) => a - b);
        
        let nextNumber = 1;
        for (const num of existingHouseholdNumbers) {
          if (num === nextNumber) {
            nextNumber++;
          } else {
            break;
          }
        }
        
        const newHousehold = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          points: [...state.currentHouseholdPoints],
          label: `Household ${nextNumber}`,
          name: `Household ${nextNumber}`, // Also set name for compatibility
          color: '#6366f1'
        };
        
        return {
          ...state,
          households: [...state.households, newHousehold],
          selectedHousehold: newHousehold,
          isDrawingHousehold: false,
          currentHouseholdPoints: [],
          sidePanelOpen: true,
          isDirty: true
        };
      }
      return state;
      
    case 'CANCEL_DRAWING_HOUSEHOLD':
      return {
        ...state,
        isDrawingHousehold: false,
        currentHouseholdPoints: []
      };
      
    // UI Actions
    case 'SET_CONTEXT_MENU':
      return {
        ...state,
        contextMenu: action.payload
      };
      
    case 'SET_DELETE_CONFIRMATION':
      return {
        ...state,
        deleteConfirmation: action.payload
      };
      
    case 'TOGGLE_SIDE_PANEL':
      return {
        ...state,
        sidePanelOpen: !state.sidePanelOpen
      };

    case 'SET_SIDE_PANEL_OPEN':
      return {
        ...state,
        sidePanelOpen: Boolean(action.payload)
      };
      
    case 'SET_QUICK_ADD_OPEN':
      return {
        ...state,
        quickAddOpen: action.payload
      };

    case 'SET_DISCOVERY_PANEL_OPEN':
      return {
        ...state,
        discoveryPanelOpen: action.payload
      };

    case 'SET_ANALYTICS_PANEL_OPEN':
      return {
        ...state,
        analyticsPanelOpen: action.payload
      };

    case 'SET_SEARCH_MODAL_OPEN':
      return {
        ...state,
        searchModalOpen: action.payload
      };

    case 'SET_FILTERED_NODES':
      return {
        ...state,
        filteredNodes: action.payload
      };

    case 'SET_SHOW_BULK_EDIT_PANEL':
      return {
        ...state,
        showBulkEditPanel: action.payload
      };

    case 'SET_SEARCHING_NETWORK_FOR':
      return {
        ...state,
        searchingNetworkFor: action.payload
      };

    // Multi-select Actions
    case 'ADD_TO_SELECTION':
      return {
        ...state,
        selectedNodes: [...state.selectedNodes, action.payload]
      };

    case 'REMOVE_FROM_SELECTION':
      return {
        ...state,
        selectedNodes: state.selectedNodes.filter(id => id !== action.payload)
      };

    case 'TOGGLE_NODE_SELECTION':
      const isSelected = state.selectedNodes.includes(action.payload);
      let newSelectedNodes;
      
      // If starting a multi-select (no nodes currently multi-selected but there's a selectedPerson)
      // Include the currently selected person in the multi-select
      if (state.selectedNodes.length === 0 && state.selectedPerson && state.selectedPerson.id !== action.payload) {
        newSelectedNodes = [state.selectedPerson.id, action.payload];
      } else {
        // Normal toggle behavior
        newSelectedNodes = isSelected
          ? state.selectedNodes.filter(id => id !== action.payload)
          : [...state.selectedNodes, action.payload];
      }
      
      return {
        ...state,
        selectedNodes: newSelectedNodes,
        lastSelectedNode: action.payload
      };

    case 'SET_SELECTED_NODES':
      return {
        ...state,
        selectedNodes: action.payload
      };
      
    // Canvas Actions
    case 'SET_ZOOM':
      return {
        ...state,
        zoom: action.payload
      };
      
    case 'SET_PAN':
      return {
        ...state,
        pan: action.payload
      };

    case 'SET_CONNECTION_PREVIEW':
      return {
        ...state,
        connectionPreview: action.payload
      };
      
    case 'TOGGLE_SNAP_TO_GRID':
      return {
        ...state,
        snapToGrid: !state.snapToGrid
      };
      
    case 'TOGGLE_HIGHLIGHT_NETWORK':
      const nextHighlightNetwork = !state.highlightNetwork;
      return {
        ...state,
        highlightNetwork: nextHighlightNetwork,
        focusedNodeId: nextHighlightNetwork ? null : state.focusedNodeId
      };

    case 'TOGGLE_CONNECTION_BADGES':
      return {
        ...state,
        showConnectionBadges: !state.showConnectionBadges
      };

    case 'TOGGLE_PLACEMENT_BADGES':
      return {
        ...state,
        showPlacementBadges: !state.showPlacementBadges
      };

    case 'CYCLE_RELATIONSHIP_BUBBLES':
      const bubbleStates = ['full', 'labels-only', 'hidden'];
      const currentIndex = bubbleStates.indexOf(state.showRelationshipBubbles);
      const nextIndex = (currentIndex + 1) % bubbleStates.length;
      return {
        ...state,
        showRelationshipBubbles: bubbleStates[nextIndex]
      };

    case 'SET_FOCUSED_NODE':
      return {
        ...state,
        focusedNodeId: action.payload
      };
      
    // File Actions
    case 'SET_FILE_NAME':
      return {
        ...state,
        fileName: action.payload
      };
      
    case 'SET_DIRTY':
      return {
        ...state,
        isDirty: action.payload
      };
      
    case 'LOAD_DATA':
      // Ensure backward compatibility for relationships
      const ensureRelationshipDefaults = (rel) => ({
        ...rel,
        connectionStatus: rel.connectionStatus || ConnectionStatus.CONFIRMED,
        discoverySource: rel.discoverySource || null,
        discoveryDate: rel.discoveryDate || null,
        discoveryNotes: rel.discoveryNotes || '',
        placementStatus: rel.placementStatus || null,
        placementNotes: rel.placementNotes || ''
      });
      
      const loadedState = {
        ...state,
        people: (action.payload.people || []).map(person => ensureNodeDefaults(person)),
        relationships: (action.payload.relationships || []).map(rel => ensureRelationshipDefaults(rel)),
        households: action.payload.households || [],
        placements: action.payload.placements || [],
        textBoxes: action.payload.textBoxes || [],
        customAttributes: action.payload.customAttributes || [],
        metadata: action.payload.metadata || {},
        fileName: action.payload.fileName || 'Untitled Genogram',
        isDirty: false,
        selectedPerson: null,
        selectedRelationship: null,
        selectedTextBox: null,
        selectedHousehold: null,
        focusedNodeId: null,
        discoveryPanelOpen: false,
        analyticsPanelOpen: false,
        // Reset zoom and pan when loading new data to ensure fitToCanvas works properly
        zoom: 1,
        pan: { x: 0, y: 0 }
      };
      
      // Reset history with the loaded state as the initial entry
      return {
        ...loadedState,
        history: [loadedState],
        historyIndex: 0
      };
      
    case 'NEW_GENOGRAM':
      const newState = {
        ...initialState,
        zoom: state.zoom,
        pan: state.pan,
        snapToGrid: state.snapToGrid
      };
      
      // Reset history with the new empty state as the initial entry
      return {
        ...newState,
        history: [newState],
        historyIndex: 0
      };
      
    // History Actions
    case 'SAVE_TO_HISTORY':
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(action.payload);
      if (newHistory.length > 50) newHistory.shift();
      
      return {
        ...state,
        history: newHistory,
        historyIndex: Math.min(state.historyIndex + 1, 49)
      };
      
    case 'UNDO':
      if (state.historyIndex > 0) {
        const prevState = state.history[state.historyIndex - 1];
        return {
          ...state,
          people: prevState.people,
          relationships: prevState.relationships,
          households: prevState.households || [],
          textBoxes: prevState.textBoxes || [],
          historyIndex: state.historyIndex - 1,
          selectedPerson: null,
          selectedRelationship: null,
          selectedTextBox: null,
          selectedHousehold: null
        };
      }
      return state;
      
    case 'REDO':
      if (state.historyIndex < state.history.length - 1) {
        const nextState = state.history[state.historyIndex + 1];
        return {
          ...state,
          people: nextState.people,
          relationships: nextState.relationships,
          households: nextState.households || [],
          textBoxes: nextState.textBoxes || [],
          historyIndex: state.historyIndex + 1,
          selectedPerson: null,
          selectedRelationship: null,
          selectedTextBox: null,
          selectedHousehold: null
        };
      }
      return state;

    // Handle batch updates for custom actions
    case 'BATCH_UPDATE':
      console.log('BATCH_UPDATE - payload:', action.payload);
      console.log('BATCH_UPDATE - newPersonModalOpen:', action.payload.newPersonModalOpen);
      return {
        ...state,
        ...action.payload,
        isDirty: true
      };

    default:
      return state;
  }
} // <-- Close genogramReducer function

export function GenogramProvider({ children }) {
  const [state, dispatch] = useReducer(genogramReducer, initialState);
  
  // Track pending audit changes to batch on auto-save
  const pendingAuditChanges = useRef(new Map()); // Map<personId, {beforeState, latestUpdates}>
  
  // Grid snapping utility
  const GRID_SIZE = 20;
  const snapToGridFunc = React.useCallback((value) => {
    if (!state.snapToGrid) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, [state.snapToGrid]);
  
  // Add user-driven override from App toggle
const [userInteractionOverride, setUserInteractionOverride] = React.useState(() => {
  const attr = document.body.getAttribute('data-interaction') || document.documentElement.getAttribute('data-interaction');
  return attr === 'touch' || attr === 'desktop' ? attr : null;
});

React.useEffect(() => {
  const handler = (e) => {
    const mode = e?.detail?.mode || document.body.getAttribute('data-interaction') || document.documentElement.getAttribute('data-interaction');
    setUserInteractionOverride(mode === 'touch' || mode === 'desktop' ? mode : null);
  };
  window.addEventListener('interaction-mode-changed', handler);
  return () => window.removeEventListener('interaction-mode-changed', handler);
}, []);

// Base detection used when there is no user override
const baseIsMobile = React.useMemo(() => {
	try {
		if (typeof window !== 'undefined') {
			if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return true;
			const touchCapable = 'ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0);
			const smallScreen = window.innerWidth <= 1024;
			return touchCapable || smallScreen;
		}
		return false;
	} catch {
		return false;
	}
}, []);

const baseIsTouch = baseIsMobile;

// Effective flags honor user override first, then fall back to base detection
const effectiveIsMobile = React.useMemo(() => {
	if (userInteractionOverride === 'touch') return true;
	if (userInteractionOverride === 'desktop') return false;
	return baseIsMobile;
}, [baseIsMobile, userInteractionOverride]);

const effectiveIsTouch = React.useMemo(() => {
	if (userInteractionOverride === 'touch') return true;
	if (userInteractionOverride === 'desktop') return false;
	return baseIsTouch;
}, [baseIsTouch, userInteractionOverride]);

  // Helper functions that wrap dispatch
  const actions = React.useMemo(() => {
    // Helper functions (formerly useCallback, now just functions using latest state)
    const addPerson = (person) => {
      const normalized = ensureNodeDefaults(person);
      dispatch({ type: 'ADD_PERSON', payload: normalized });
      
      // Log to audit trail
      createAuditLog({
        action: 'CREATE_PERSON',
        entityType: 'Person',
        entityId: normalized.id,
        beforeState: null,
        afterState: normalized,
        metadata: { type: normalized.type, name: normalized.name || 'Unnamed' }
      }).catch(err => console.warn('Audit log failed:', err));
    };
    const updatePerson = (id, updates, options = {}) => {
      // Get current state before update
      const beforeState = state.people.find(p => p.id === id);
      
      dispatch({ type: 'UPDATE_PERSON', payload: { id, updates } });
      
      // Skip audit logging for visual-only changes (position, styling, etc.)
      const skipAudit = options.skipAudit || false;
      const visualOnlyFields = ['x', 'y', 'customColor', 'customFill', 'customStroke'];
      const isVisualOnlyUpdate = Object.keys(updates).every(key => visualOnlyFields.includes(key));
      
      // Accumulate meaningful changes for batched audit logging on auto-save
      if (!skipAudit && !isVisualOnlyUpdate && beforeState) {
        const pending = pendingAuditChanges.current;
        
        if (!pending.has(id)) {
          // First change for this person - store original beforeState
          pending.set(id, {
            beforeState: { ...beforeState },
            latestUpdates: { ...updates }
          });
        } else {
          // Subsequent change - accumulate updates, keep original beforeState
          const entry = pending.get(id);
          entry.latestUpdates = { ...entry.latestUpdates, ...updates };
        }
      }
    };
    const flushPendingAudits = async () => {
      const pending = pendingAuditChanges.current;
      if (pending.size === 0) return;
      
      // Batch create audit logs for all pending changes
      const auditPromises = [];
      pending.forEach((entry, personId) => {
        const { beforeState, latestUpdates } = entry;
        const afterState = mergeNodeUpdates(beforeState, latestUpdates);
        
        auditPromises.push(
          createAuditLog({
            action: 'UPDATE_PERSON',
            entityType: 'Person',
            entityId: personId,
            beforeState,
            afterState,
            metadata: {
              name: beforeState.name || 'Unnamed',
              updatedFields: Object.keys(latestUpdates),
              batched: true
            }
          }).catch(err => console.warn('Audit log failed for person', personId, ':', err))
        );
      });
      
      // Wait for all audit logs to complete
      await Promise.all(auditPromises);
      
      // Clear pending changes
      pending.clear();
      console.log(`Flushed ${auditPromises.length} batched audit log(s)`);
    };
    
    const deletePerson = (id) => {
      // Get current state before deletion
      const beforeState = state.people.find(p => p.id === id);
      
      // Remove from pending changes if present
      pendingAuditChanges.current.delete(id);
      
      dispatch({ type: 'DELETE_PERSON', payload: id });
      
      // Log deletion immediately (not batched - important event)
      if (beforeState) {
        createAuditLog({
          action: 'DELETE_PERSON',
          entityType: 'Person',
          entityId: id,
          beforeState,
          afterState: null,
          metadata: { name: beforeState.name || 'Unnamed', type: beforeState.type }
        }).catch(err => console.warn('Audit log failed:', err));
      }
    };
    const setNextPersonPosition = (position) => dispatch({ type: 'SET_NEXT_PERSON_POSITION', payload: position });
    const setNewPersonModal = (open) => dispatch({ type: 'SET_NEW_PERSON_MODAL', payload: open });

    const addRelationship = (relationship) => dispatch({ type: 'ADD_RELATIONSHIP', payload: relationship });
    const updateRelationship = (id, updates) => dispatch({ type: 'UPDATE_RELATIONSHIP', payload: { id, updates } });
    const deleteRelationship = (id) => dispatch({ type: 'DELETE_RELATIONSHIP', payload: id });

    const addPlacement = (placement) => dispatch({ type: 'ADD_PLACEMENT', payload: placement });
    const updatePlacement = (id, updates) => dispatch({ type: 'UPDATE_PLACEMENT', payload: { id, updates } });
    const deletePlacement = (id) => dispatch({ type: 'DELETE_PLACEMENT', payload: id });
    const setSelectedPlacement = (id) => dispatch({ type: 'SET_SELECTED_PLACEMENT', payload: id });
    
    // Helper to create placement consideration
    const createPlacementConsideration = (childId, caregiverId, options = {}) => {
      const placement = {
        id: `placement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        childId,
        caregiverId,
        placementStatus: options.placementStatus || PlacementStatus.POTENTIAL_TEMPORARY,
        placementType: options.placementType || 'foster_care',
        householdId: options.householdId || null,
        assessmentData: options.assessmentData || {},
        discoveryMetadata: {
          discoveryDate: options.discoveryDate || new Date().toISOString(),
          discoverySource: options.discoverySource || null,
          discoveryNotes: options.discoveryNotes || ''
        }
      };
      addPlacement(placement);
      return placement;
    };

    const addHousehold = (household) => dispatch({ type: 'ADD_HOUSEHOLD', payload: household });
    const updateHousehold = (id, updates) => dispatch({ type: 'UPDATE_HOUSEHOLD', payload: { id, updates } });
    const deleteHousehold = (id) => dispatch({ type: 'DELETE_HOUSEHOLD', payload: id });

    const addTextBox = (textBox) => dispatch({ type: 'ADD_TEXTBOX', payload: textBox });
    const updateTextBox = (id, updates) => dispatch({ type: 'UPDATE_TEXTBOX', payload: { id, updates } });
    const deleteTextBox = (id) => dispatch({ type: 'DELETE_TEXTBOX', payload: id });

    const setCustomAttributes = (attributes) => dispatch({ type: 'SET_CUSTOM_ATTRIBUTES', payload: attributes });

    // Tag Management Actions
    const addTagDefinition = (tag) => dispatch({ type: 'ADD_TAG_DEFINITION', payload: tag });
    const updateTagDefinition = (id, updates) => dispatch({ type: 'UPDATE_TAG_DEFINITION', payload: { id, updates } });
    const deleteTagDefinition = (id) => dispatch({ type: 'DELETE_TAG_DEFINITION', payload: id });
    const addTagToPerson = (personId, tagId) => dispatch({ type: 'ADD_TAG_TO_PERSON', payload: { personId, tagId } });
    const removeTagFromPerson = (personId, tagId) => dispatch({ type: 'REMOVE_TAG_FROM_PERSON', payload: { personId, tagId } });
    const bulkAddTag = (personIds, tagId) => dispatch({ type: 'BULK_ADD_TAG', payload: { personIds, tagId } });
    const bulkRemoveTag = (personIds, tagId) => dispatch({ type: 'BULK_REMOVE_TAG', payload: { personIds, tagId } });

    // Search History Actions
    const addToSearchHistory = (filters) => {
      const historyItem = {
        id: `history-${Date.now()}`,
        filters,
        timestamp: new Date().toISOString()
      };
      dispatch({ type: 'ADD_TO_SEARCH_HISTORY', payload: historyItem });
    };
    const clearSearchHistory = () => dispatch({ type: 'CLEAR_SEARCH_HISTORY' });

    // Filter Template Actions
    const addFilterTemplate = (name, description, filters) => {
      const template = {
        id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        description: description || '',
        filters,
        createdAt: new Date().toISOString(),
        usageCount: 0
      };
      dispatch({ type: 'ADD_FILTER_TEMPLATE', payload: template });
      return template;
    };
    const updateFilterTemplate = (id, updates) => dispatch({ type: 'UPDATE_FILTER_TEMPLATE', payload: { id, updates } });
    const deleteFilterTemplate = (id) => dispatch({ type: 'DELETE_FILTER_TEMPLATE', payload: id });
    const incrementTemplateUsage = (id) => {
      const template = state.filterTemplates.find(t => t.id === id);
      if (template) {
        updateFilterTemplate(id, { usageCount: (template.usageCount || 0) + 1 });
      }
    };

    const selectPerson = (person, forceEdit = false) => {
      // Handle new format: { person, openPanel } or legacy format: just person
      const personObj = person?.person || person;
      const openPanel = person?.openPanel;
      
      if (state.highlightNetwork && !forceEdit) {
        // Network toggle mode - get current person from state to avoid stale data
        const currentPerson = state.people.find(p => p.id === personObj.id);
        if (currentPerson) {
          dispatch({ type: 'UPDATE_PERSON', payload: { id: personObj.id, updates: { networkMember: !currentPerson.networkMember } } });
        }
      } else {
        // Pass the openPanel parameter if specified
        if (openPanel !== undefined) {
          dispatch({ type: 'SELECT_PERSON', payload: { person: personObj, openPanel } });
        } else {
          dispatch({ type: 'SELECT_PERSON', payload: personObj });
        }
      }
    };
    const selectRelationship = (relationship, openPanel = true) => {
      // Handle new format: { relationship, openPanel } or legacy format: just relationship
      const relationshipObj = relationship?.relationship || relationship;
      const shouldOpenPanel = relationship?.openPanel !== undefined ? relationship.openPanel : openPanel;
      
      if (shouldOpenPanel !== undefined) {
        dispatch({ type: 'SELECT_RELATIONSHIP', payload: { relationship: relationshipObj, openPanel: shouldOpenPanel } });
      } else {
        dispatch({ type: 'SELECT_RELATIONSHIP', payload: relationshipObj });
      }
    };
    const selectTextBox = (textBox, openPanel = true) => {
      // Handle new format: { textBox, openPanel } or legacy format: just textBox
      const textBoxObj = textBox?.textBox || textBox;
      const shouldOpenPanel = textBox?.openPanel !== undefined ? textBox.openPanel : openPanel;
      
      if (shouldOpenPanel !== undefined) {
        dispatch({ type: 'SELECT_TEXTBOX', payload: { textBox: textBoxObj, openPanel: shouldOpenPanel } });
      } else {
        dispatch({ type: 'SELECT_TEXTBOX', payload: textBoxObj });
      }
    };
    const selectHousehold = (household) => dispatch({ type: 'SELECT_HOUSEHOLD', payload: household });
    const clearSelection = () => dispatch({ type: 'CLEAR_SELECTION' });
    const setFocusedNode = (nodeId) => dispatch({ type: 'SET_FOCUSED_NODE', payload: nodeId });
    const exitFocusMode = () => dispatch({ type: 'SET_FOCUSED_NODE', payload: null });

    const startConnection = (personId, marriageId, type) =>
      dispatch({ type: 'START_CONNECTION', payload: { personId, marriageId, type } });
    const cancelConnection = () => dispatch({ type: 'CANCEL_CONNECTION' });

    const startDrawingHousehold = () => dispatch({ type: 'START_DRAWING_HOUSEHOLD' });
    const addHouseholdPoint = (point) => dispatch({ type: 'ADD_HOUSEHOLD_POINT', payload: point });
    const finishHousehold = () => dispatch({ type: 'FINISH_HOUSEHOLD' });
    const cancelDrawingHousehold = () => dispatch({ type: 'CANCEL_DRAWING_HOUSEHOLD' });

    const setContextMenu = (menu) => dispatch({ type: 'SET_CONTEXT_MENU', payload: menu });
    const setDeleteConfirmation = (confirmation) => dispatch({ type: 'SET_DELETE_CONFIRMATION', payload: confirmation });
    const toggleSidePanel = () => dispatch({ type: 'TOGGLE_SIDE_PANEL' });
  const setSidePanelOpen = (open) => dispatch({ type: 'SET_SIDE_PANEL_OPEN', payload: open });
    const setQuickAddOpen = (open) => dispatch({ type: 'SET_QUICK_ADD_OPEN', payload: open });
    const setDiscoveryPanelOpen = (open) => dispatch({ type: 'SET_DISCOVERY_PANEL_OPEN', payload: open });
    const setAnalyticsPanelOpen = (open) => dispatch({ type: 'SET_ANALYTICS_PANEL_OPEN', payload: open });
    const setSearchModalOpen = (open) => dispatch({ type: 'SET_SEARCH_MODAL_OPEN', payload: open });
    const setFilteredNodes = (nodeIds) => dispatch({ type: 'SET_FILTERED_NODES', payload: nodeIds });
    const setQuickEditOpen = (open) => dispatch({ type: 'SET_QUICK_EDIT_OPEN', payload: open });
    const setMobileMenuOpen = (open) => dispatch({ type: 'SET_MOBILE_MENU_OPEN', payload: open });
    const setShowBulkEditPanel = (show) => dispatch({ type: 'SET_SHOW_BULK_EDIT_PANEL', payload: show });
    const setSearchingNetworkFor = (person) => dispatch({ type: 'SET_SEARCHING_NETWORK_FOR', payload: person });
    
    // Multi-select actions
    const addToSelection = (nodeId) => dispatch({ type: 'ADD_TO_SELECTION', payload: nodeId });
    const removeFromSelection = (nodeId) => dispatch({ type: 'REMOVE_FROM_SELECTION', payload: nodeId });
    const toggleNodeSelection = (nodeId) => dispatch({ type: 'TOGGLE_NODE_SELECTION', payload: nodeId });
    const setSelectedNodes = (nodeIds) => dispatch({ type: 'SET_SELECTED_NODES', payload: nodeIds });
    const clearNodeSelection = () => dispatch({ type: 'CLEAR_SELECTION' });
    
    const handlePersonClick = (person, options = {}) => {
      if (!person) {
        return;
      }

      const nodeType = person.type || NodeType.PERSON;
      const { openPanel } = options;

      if (state.highlightNetwork && nodeType === NodeType.PERSON) {
        const currentPerson = state.people.find((p) => p.id === person.id);
        if (currentPerson) {
          dispatch({
            type: 'UPDATE_PERSON',
            payload: {
              id: person.id,
              updates: { networkMember: !currentPerson.networkMember }
            }
          });
        }
        return;
      }

      if (state.selectedPerson?.id === person.id) {
        if (!state.sidePanelOpen) {
          dispatch({ type: 'SET_SIDE_PANEL_OPEN', payload: true });
        }

        if (state.focusedNodeId === person.id) {
          dispatch({ type: 'SET_FOCUSED_NODE', payload: null });
        } else {
          dispatch({ type: 'SET_FOCUSED_NODE', payload: person.id });
        }
        return;
      }

      if (openPanel === undefined) {
        dispatch({ type: 'SELECT_PERSON', payload: person });
      } else {
        dispatch({ type: 'SELECT_PERSON', payload: { person, openPanel } });
      }
    };
    

    const setZoom = (zoom) => dispatch({ type: 'SET_ZOOM', payload: zoom });
    const setPan = (pan) => dispatch({ type: 'SET_PAN', payload: pan });
    const setConnectionPreview = (preview) =>
      dispatch({ type: 'SET_CONNECTION_PREVIEW', payload: preview });
    const toggleSnapToGrid = () => dispatch({ type: 'TOGGLE_SNAP_TO_GRID' });
    const toggleHighlightNetwork = () => dispatch({ type: 'TOGGLE_HIGHLIGHT_NETWORK' });
    const toggleConnectionBadges = () => dispatch({ type: 'TOGGLE_CONNECTION_BADGES' });
    const togglePlacementBadges = () => dispatch({ type: 'TOGGLE_PLACEMENT_BADGES' });
    const cycleRelationshipBubbles = () => dispatch({ type: 'CYCLE_RELATIONSHIP_BUBBLES' });

    const setFileName = (name) => dispatch({ type: 'SET_FILE_NAME', payload: name });
    const setDirty = (dirty) => dispatch({ type: 'SET_DIRTY', payload: dirty });
    const loadData = (data) => dispatch({ type: 'LOAD_DATA', payload: data });
    const newGenogram = async () => {
      // Flush any pending audits before clearing
      await flushPendingAudits();
      dispatch({ type: 'NEW_GENOGRAM' });
    };

    const saveToHistory = (stateToSave) => dispatch({ type: 'SAVE_TO_HISTORY', payload: stateToSave });
    const undo = () => dispatch({ type: 'UNDO' });
    const redo = () => dispatch({ type: 'REDO' });

    // Create a relationship between two existing people
    const createRelationship = (fromId, toId, type, options = {}) => {
      const colors = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
      const colorIndex = state.relationships.length % colors.length;
      const newRelationship = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        from: fromId,
        to: toId,
        type,
        color: colors[colorIndex],
        lineStyle: 'default',
        startDate: '',
        endDate: '',
        isActive: !['divorce', 'separation', 'nullity'].includes(type),
        abbr: state.REL_ABBREVIATIONS?.[type] || '',
        notes: '',
        bubblePosition: 0.5,
        // Family finding fields
        connectionStatus: options.connectionStatus || ConnectionStatus.CONFIRMED,
        discoverySource: options.discoverySource || null,
        discoveryDate: options.discoveryDate || null,
        discoveryNotes: options.discoveryNotes || '',
        placementStatus: options.placementStatus || null,
        placementNotes: options.placementNotes || ''
      };
      
      // Add the relationship, cancel connection mode, and auto-select for editing
      dispatch({ type: 'ADD_RELATIONSHIP', payload: newRelationship });
      dispatch({ type: 'CANCEL_CONNECTION' }); // End connection mode immediately
      
      // Use timeout to ensure the relationship is added before selecting it
      setTimeout(() => {
        dispatch({ type: 'SELECT_RELATIONSHIP', payload: newRelationship });
      }, 100);
    };

    // Link an existing person as a child of a relationship
    const createChildRelationship = (relationshipId, childId) => {
      const rel = state.relationships.find(r => r.id === relationshipId);
      const childRelationship = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + '_childrel',
        from: relationshipId,
        to: childId,
        type: 'child',
        color: rel?.color || '#3b82f6',
        lineStyle: 'default',
        startDate: '',
        endDate: '',
        isActive: true,
        abbr: state.REL_ABBREVIATIONS?.['child'] || '',
        notes: '',
        bubblePosition: 0.5,
        connectionStatus: ConnectionStatus.CONFIRMED,
        discoverySource: null,
        discoveryDate: null,
        discoveryNotes: '',
        placementStatus: null,
        placementNotes: ''
      };
      dispatch({ type: 'ADD_RELATIONSHIP', payload: childRelationship });
    };

    const createChildWithUnknownParent = (person) => {
     console.log('createChildWithUnknownParent called for:', person.name);

      // Create unknown parent
      const unknownParent = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: 'Unknown',
        type: NodeType.PERSON,
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
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + '_rel',
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
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + '_child',
        name: 'New Child',
        type: NodeType.PERSON,
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
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + '_childrel',
        from: partnership.id,
        to: child.id,
        type: 'child',
        color: partnership.color,
        lineStyle: 'default',
        isActive: true
      };

      console.log('Creating:', { unknownParent, partnership, child, childRelationship });

      // Update state with all items at once
      dispatch({
        type: 'BATCH_UPDATE',
        payload: {
          people: [...state.people, unknownParent, child],
          relationships: [...state.relationships, partnership, childRelationship],
          selectedPerson: child,
          selectedRelationship: null,
          sidePanelOpen: true,
          connectionPreview: null
        }
      });
    };

    const createSingleParentAdoption = (person) => {
      console.log('createSingleParentAdoption called for:', person.name);

      // Create adoption relationship (self-referential)
      const adoptionRelationship = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + '_adopt',
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
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + '_child',
        name: 'Adopted Child',
        type: NodeType.PERSON,
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
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + '_childrel',
        from: adoptionRelationship.id,
        to: child.id,
        type: 'child',
        color: adoptionRelationship.color,
        lineStyle: 'dashed',
        isActive: true
      };

      console.log('Creating:', { adoptionRelationship, child, childRelationship });

      // Update state with all items
      dispatch({
        type: 'BATCH_UPDATE',
        payload: {
          people: [...state.people, child],
          relationships: [...state.relationships, adoptionRelationship, childRelationship],
          selectedPerson: child,
          selectedRelationship: null,
          sidePanelOpen: true,
          connectionPreview: null
        }
      });
    };

    const connectExistingPersonAsChild = (parentPerson, childPerson) => {
      // Find existing partner relationships for the parent
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
      
      const partnerRelationships = state.relationships.filter(r => 
        (r.from === parentPerson.id || r.to === parentPerson.id) && 
        PARENT_RELATIONSHIP_TYPES.includes(r.type)
      );

      if (partnerRelationships.length === 0) {
        // No partners - show child connection options
        console.log('No partners - showing child connection options');
        dispatch({
          type: 'SET_CHILD_CONNECTION_OPTIONS',
          payload: {
            isOpen: true,
            parentPerson: parentPerson,
            childPerson: childPerson,
            availablePartners: []
          }
        });
      } else if (partnerRelationships.length === 1) {
        // One partner - directly connect child to that relationship
        console.log('One partner - connecting directly');
        const partnership = partnerRelationships[0];
        connectChildToExistingRelationship(partnership.id, childPerson);
      } else {
        // Multiple partners - show selection options
        console.log('Multiple partners - showing selection options');
        dispatch({
          type: 'SET_CHILD_CONNECTION_OPTIONS',
          payload: {
            isOpen: true,
            parentPerson: parentPerson,
            childPerson: childPerson,
            availablePartners: partnerRelationships
          }
        });
      }
    };

    const connectChildToExistingRelationship = (relationshipId, childPerson) => {
      console.log('connectChildToExistingRelationship called:', {
        relationshipId,
        childName: childPerson.name
      });

      // Create child relationship from existing partnership to existing child
      const relationship = state.relationships.find(r => r.id === relationshipId);
      if (!relationship) {
        console.error('Relationship not found:', relationshipId);
        return;
      }

      const childRelationship = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + '_childrel',
        from: relationshipId,
        to: childPerson.id,
        type: 'child',
        color: relationship.color || '#3b82f6',
        lineStyle: 'default',
        isActive: true
      };

      console.log('Creating child relationship:', childRelationship);

      // Add the child relationship and clear connection state
      dispatch({
        type: 'BATCH_UPDATE',
        payload: {
          people: state.people,
          relationships: [...state.relationships, childRelationship],
          selectedPerson: childPerson,
          selectedRelationship: null,
          isConnecting: false,
          connectingFrom: null,
          connectingFromMarriage: null,
          connectingType: 'marriage',
          connectionPreview: null,
          sidePanelOpen: false
        }
      });
    };

    const handleChildConnectionOption = (optionType, parentPerson = null, childPerson = null, relationship = null) => {
      console.log('handleChildConnectionOption called:', {
        optionType,
        parentName: parentPerson?.name,
        childName: childPerson?.name,
        relationship: relationship?.id
      });
      
      // For cancel, we don't need parent or child validation
      if (optionType === 'cancel') {
        console.log('Child connection cancelled');
        dispatch({
          type: 'SET_CHILD_CONNECTION_OPTIONS',
          payload: null
        });
        return;
      }
      
      // Safety check - ensure we have valid parent and child for other operations
      if (!parentPerson || !childPerson) {
        console.error('handleChildConnectionOption: Missing parent or child person', {
          parentPerson,
          childPerson
        });
        dispatch({
          type: 'SET_CHILD_CONNECTION_OPTIONS',
          payload: null
        });
        return;
      }

      switch (optionType) {
        case 'unknown':
          // Create unknown co-parent and connect child
          createChildConnectionWithUnknownParent(parentPerson, childPerson);
          break;
        case 'newPartner':
          // Create new partner and connect child
          createChildConnectionWithNewPartner(parentPerson, childPerson);
          break;
        case 'singleAdoption':
          // Create single parent adoption and connect child
          createChildConnectionWithSingleAdoption(parentPerson, childPerson);
          break;
        case 'selectPartner':
          // Connect child to existing partner relationship
          connectChildToExistingRelationship(relationship.id, childPerson);
          break;
        default:
          break;
      }
      
      // Close the child connection options modal
      dispatch({
        type: 'SET_CHILD_CONNECTION_OPTIONS',
        payload: null
      });
    };

    const createChildConnectionWithUnknownParent = (parentPerson, childPerson) => {
      console.log('createChildConnectionWithUnknownParent called');

      // Create unknown parent
      const unknownParent = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: 'Unknown',
        type: NodeType.PERSON,
        gender: 'unknown',
        x: snapToGridFunc(parentPerson.x + 150),
        y: snapToGridFunc(parentPerson.y),
        age: '',
        birthDate: '',
        isDeceased: false,
        specialStatus: null,
        networkMember: false
      };

      // Create partnership between parent and unknown parent
      const partnership = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + '_rel',
        from: parentPerson.id,
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

      // Create child relationship from partnership to existing child
      const childRelationship = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + '_childrel',
        from: partnership.id,
        to: childPerson.id,
        type: 'child',
        color: partnership.color,
        lineStyle: 'default',
        isActive: true
      };

      // Update state with all items at once
      dispatch({
        type: 'BATCH_UPDATE',
        payload: {
          people: [...state.people, unknownParent],
          relationships: [...state.relationships, partnership, childRelationship],
          selectedPerson: childPerson,
          selectedRelationship: null,
          isConnecting: false,
          connectingFrom: null,
          connectingFromMarriage: null,
          connectingType: 'marriage',
          connectionPreview: null,
          sidePanelOpen: false
        }
      });
    };

    const createChildConnectionWithNewPartner = (parentPerson, childPerson) => {
      console.log('createChildConnectionWithNewPartner called');

      // Create new partner
      const defaultGender = parentPerson.gender === 'male' ? 'female' : 
                           parentPerson.gender === 'female' ? 'male' : 
                           'female';

      const newPartner = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: `Person ${state.people.length + 1}`,
        type: NodeType.PERSON,
        gender: defaultGender,
        age: '',
        birthDate: '',
        deathDate: '',
    deceasedSymbol: 'halo',
    deceasedGentleTreatment: 'none',
        isDeceased: false,
        x: snapToGridFunc(parentPerson.x + 120),
        y: snapToGridFunc(parentPerson.y),
        generation: parentPerson.generation || 0,
        specialStatus: null,
        sexualOrientation: 'not-specified',
        networkMember: false,
        role: '',
        notes: ''
      };

      // Create marriage relationship
      const colors = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
      const colorIndex = state.relationships.length % colors.length;

      const marriage = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + '_rel',
        from: parentPerson.id,
        to: newPartner.id,
        type: 'marriage',
        color: colors[colorIndex],
        lineStyle: 'default',
        startDate: '',
        endDate: '',
        isActive: true,
        abbr: state.REL_ABBREVIATIONS?.['marriage'] || '',
        notes: '',
        bubblePosition: 0.5
      };

      // Create child relationship
      const childRelationship = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + '_childrel',
        from: marriage.id,
        to: childPerson.id,
        type: 'child',
        color: marriage.color,
        lineStyle: 'default',
        isActive: true
      };

      // Update state with all items
      dispatch({
        type: 'BATCH_UPDATE',
        payload: {
          people: [...state.people, newPartner],
          relationships: [...state.relationships, marriage, childRelationship],
          selectedPerson: childPerson,
          selectedRelationship: null,
          isConnecting: false,
          connectingFrom: null,
          connectingFromMarriage: null,
          connectingType: 'marriage',
          connectionPreview: null,
          sidePanelOpen: false
        }
      });
    };

    const createChildConnectionWithSingleAdoption = (parentPerson, childPerson) => {
      console.log('createChildConnectionWithSingleAdoption called');

      // Create adoption relationship (self-referential)
      const adoptionRelationship = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + '_adopt',
        from: parentPerson.id,
        to: parentPerson.id,
        type: 'adoption',
        color: '#06b6d4',
        lineStyle: 'dotted',
        isActive: true,
        notes: 'Single parent adoption',
        bubblePosition: 0.5,
        abbr: 'A'
      };

      // Create child relationship
      const childRelationship = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + '_childrel',
        from: adoptionRelationship.id,
        to: childPerson.id,
        type: 'child',
        color: adoptionRelationship.color,
        lineStyle: 'dashed',
        isActive: true
      };

      // Update state with all items
      dispatch({
        type: 'BATCH_UPDATE',
        payload: {
          people: state.people,
          relationships: [...state.relationships, adoptionRelationship, childRelationship],
          selectedPerson: childPerson,
          selectedRelationship: null,
          isConnecting: false,
          connectingFrom: null,
          connectingFromMarriage: null,
          connectingType: 'marriage',
          connectionPreview: null,
          sidePanelOpen: false
        }
      });
    };

    const changeRelationshipTypePreservingChildren = (relationshipId, newType) => {
      console.log('=== CHANGE RELATIONSHIP TYPE - PRESERVING CHILDREN ===');
      console.log('Relationship ID:', relationshipId);
      console.log('New type:', newType);
      
      const relationship = state.relationships.find(r => r.id === relationshipId);
      if (!relationship) {
        console.error('Relationship not found:', relationshipId);
        return;
      }
      
      // Check if this relationship has children
      const childRelationships = state.relationships.filter(r => 
        r.type === 'child' && r.from === relationshipId
      );
      
      if (childRelationships.length > 0) {
        console.log(`✅ Preserving ${childRelationships.length} child relationships while changing type`);
        console.log('Children:', childRelationships.map(r => {
          const child = state.people.find(p => p.id === r.to);
          return child ? child.name : 'Unknown';
        }));
      }
      
      // Update the relationship type while preserving all children
      dispatch({
        type: 'UPDATE_RELATIONSHIP',
        payload: {
          id: relationshipId,
          updates: {
            type: newType,
            isActive: !['divorce', 'separation', 'nullity'].includes(newType)
          }
        }
      });
      
      console.log(`✅ Successfully changed relationship type to "${newType}" while preserving all children`);
    };

    const addChildToRelationship = (relationshipId) => {
  console.log('=== UPDATED ADD CHILD FUNCTION - V3 ===');
  console.log('Called with relationshipId:', relationshipId);

  const relationship = state.relationships.find(r => r.id === relationshipId);
  if (!relationship) {
    console.error('Relationship not found!', relationshipId);
    return;
  }

  // Find the parents
  const parent1 = state.people.find(p => p.id === relationship.from);
  const parent2 = state.people.find(p => p.id === relationship.to);

  if (!parent1 && !parent2) {
    console.error('No parents found for relationship!');
    return;
  }

  // Find all existing children of THIS specific relationship (siblings)
  const existingChildRelationships = state.relationships.filter(r =>
    r.type === 'child' && r.from === relationshipId
  );

  const existingSiblings = existingChildRelationships.map(rel =>
    state.people.find(p => p.id === rel.to)
  ).filter(Boolean);

  console.log('Found', existingSiblings.length, 'existing siblings');

  // Calculate base position (centered between parents)
  let baseX, baseY;

  if (parent1 && parent2) {
    baseX = (parent1.x + parent2.x) / 2;
    baseY = Math.max(parent1.y, parent2.y) + 150;
  } else if (parent1) {
    baseX = parent1.x;
    baseY = parent1.y + 150;
  } else {
    baseX = parent2.x;
    baseY = parent2.y + 150;
  }

  console.log('Base position (center between parents):', { baseX, baseY });

  // Create a copy of all people to update
  const updatedPeople = [...state.people];
  
  // NEW APPROACH: Calculate positions for ALL children including the new one
  const totalChildren = existingSiblings.length + 1;
  const SPACING = 100; // Large spacing to prevent crowding
  const totalWidth = (totalChildren - 1) * SPACING;
  const startX = snapToGridFunc(baseX - (totalWidth / 2));
  
  console.log(`Arranging ${totalChildren} children with ${SPACING}px spacing`);
  console.log(`Total width: ${totalWidth}px, Starting X: ${startX}`);
  
  // Sort existing siblings by current X position
  const sortedSiblings = [...existingSiblings].sort((a, b) => a.x - b.x);
  
  // Reposition ALL existing siblings
  sortedSiblings.forEach((sibling, index) => {
    const newX = snapToGridFunc(startX + (index * SPACING));
    const personIndex = updatedPeople.findIndex(p => p.id === sibling.id);
    
    if (personIndex !== -1) {
      const oldX = updatedPeople[personIndex].x;
      console.log(`Moving sibling ${index + 1} "${sibling.name}" from X=${oldX} to X=${newX}`);
      updatedPeople[personIndex] = {
        ...updatedPeople[personIndex],
        x: newX
      };
    }
  });
  
  // Position for the new child (at the end)
  const newChildX = snapToGridFunc(startX + (sortedSiblings.length * SPACING));
  const newChildY = snapToGridFunc(baseY);
  
  console.log(`New child will be placed at X=${newChildX}`);

  // Create the new child
  const child = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: 'New Child',
    type: NodeType.PERSON,
    gender: 'unknown',
    x: newChildX,
    y: newChildY,
    age: '',
    birthDate: '',
    isDeceased: false,
    specialStatus: null,
    networkMember: false
  };

  // Create child relationship
  const childRelationship = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + '_childrel',
    from: relationshipId,
    to: child.id,
    type: 'child',
    color: relationship.color || '#3b82f6',
    lineStyle: 'default',
    isActive: true
  };

  // Add the new child
  updatedPeople.push(child);

  console.log('=== FINAL SUMMARY ===');
  console.log(`Repositioned ${sortedSiblings.length} siblings`);
  console.log(`Added 1 new child at X=${newChildX}`);
  console.log(`All ${totalChildren} children are spaced ${SPACING}px apart`);

  // Update state
  dispatch({
    type: 'BATCH_UPDATE',
    payload: {
      people: updatedPeople,
      relationships: [...state.relationships, childRelationship],
      selectedPerson: child,
      selectedRelationship: null,
      isConnecting: false,
      connectingFrom: null,
      connectingFromMarriage: null,
      connectingType: null,
      connectionPreview: null,
      newPersonModalOpen: true,
      sidePanelOpen: true
    }
  });
};

    // Promote a potential connection to confirmed
    const promoteConnectionToConfirmed = (relationshipId) => {
      const relationship = state.relationships.find(r => r.id === relationshipId);
      if (!relationship) return;
      
      updateRelationship(relationshipId, {
        connectionStatus: ConnectionStatus.CONFIRMED,
        discoveryNotes: relationship.discoveryNotes 
          ? `${relationship.discoveryNotes}\n\nConfirmed on ${new Date().toLocaleDateString()}`
          : `Confirmed on ${new Date().toLocaleDateString()}`
      });
    };

    // Create a potential connection (for family finding searches)
    const createPotentialConnection = (fromId, toId, type, discoveryInfo = {}) => {
      return createRelationship(fromId, toId, type, {
        connectionStatus: ConnectionStatus.POTENTIAL,
        discoverySource: discoveryInfo.source || null,
        discoveryDate: new Date().toISOString(),
        discoveryNotes: discoveryInfo.notes || ''
      });
    };

    // Z-Index Actions
    const bringToFront = (type, id) => {
      // Find the max zIndex across all items
      const maxZIndex = Math.max(
        ...state.people.map(p => p.zIndex || 0),
        ...state.textBoxes.map(t => t.zIndex || 0),
        ...state.households.map(h => h.zIndex || 0),
        0
      );
      
      if (type === 'person') {
        updatePerson(id, { zIndex: maxZIndex + 1 }, { skipAudit: true });
      } else if (type === 'textBox') {
        updateTextBox(id, { zIndex: maxZIndex + 1 });
      } else if (type === 'household') {
        updateHousehold(id, { zIndex: maxZIndex + 1 });
      }
    };
    
    const sendToBack = (type, id) => {
      // Find the min zIndex across all items
      const minZIndex = Math.min(
        ...state.people.map(p => p.zIndex || 0),
        ...state.textBoxes.map(t => t.zIndex || 0),
        ...state.households.map(h => h.zIndex || 0),
        0
      );
      
      if (type === 'person') {
        updatePerson(id, { zIndex: minZIndex - 1 }, { skipAudit: true });
      } else if (type === 'textBox') {
        updateTextBox(id, { zIndex: minZIndex - 1 });
      } else if (type === 'household') {
        updateHousehold(id, { zIndex: minZIndex - 1 });
      }
    };
    
    // Clipboard Actions
    const copyToClipboard = (type, data) => {
      dispatch({ type: 'COPY_TO_CLIPBOARD', payload: { type, data } });
    };
    
    const pasteFromClipboard = (offsetX = 50, offsetY = 50) => {
      if (!state.clipboard) return null;
      
      const { type, data } = state.clipboard;
      
      if (type === 'person') {
        // Create a copy of the person with new ID and offset position
        const newPerson = {
          ...data,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          x: snapToGridFunc(data.x + offsetX),
          y: snapToGridFunc(data.y + offsetY),
          name: `${data.name} (Copy)`
        };
        addPerson(newPerson);
        return newPerson;
      } else if (type === 'textBox') {
        // Create a copy of the text box with new ID and offset position
        const newTextBox = {
          ...data,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          x: data.x + offsetX,
          y: data.y + offsetY
        };
        addTextBox(newTextBox);
        return newTextBox;
      } else if (type === 'household') {
        // Create a copy of the household with new ID and offset points
        const newHousehold = {
          ...data,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: `${data.name} (Copy)`,
          points: data.points.map(pt => ({
            x: snapToGridFunc(pt.x + offsetX),
            y: snapToGridFunc(pt.y + offsetY)
          })),
          members: [] // Don't copy members
        };
        addHousehold(newHousehold);
        return newHousehold;
      }
      
      return null;
    };
    
    return {
      addPerson,
      updatePerson,
      deletePerson,
      flushPendingAudits,
      setNextPersonPosition,
      setNewPersonModal,
      addRelationship,
      updateRelationship,
      deleteRelationship,
      addPlacement,
      updatePlacement,
      deletePlacement,
      setSelectedPlacement,
      createPlacementConsideration,
      addHousehold,
      updateHousehold,
      deleteHousehold,
      addTextBox,
      updateTextBox,
      deleteTextBox,
      setCustomAttributes,
      addTagDefinition,
      updateTagDefinition,
      deleteTagDefinition,
      addTagToPerson,
      removeTagFromPerson,
      bulkAddTag,
      bulkRemoveTag,
      addToSearchHistory,
      clearSearchHistory,
      addFilterTemplate,
      updateFilterTemplate,
      deleteFilterTemplate,
      incrementTemplateUsage,
      selectPerson,
      selectRelationship,
      selectTextBox,
      selectHousehold,
      clearSelection,
  setFocusedNode,
  exitFocusMode,
  handlePersonClick,
      startConnection,
      cancelConnection,
      startDrawingHousehold,
      addHouseholdPoint,
      finishHousehold,
      cancelDrawingHousehold,
      setContextMenu,
      setDeleteConfirmation,
      toggleSidePanel,
  setSidePanelOpen,
              setQuickAddOpen,
        setQuickEditOpen,
        setMobileMenuOpen,
        setDiscoveryPanelOpen,
        setAnalyticsPanelOpen,
        setSearchModalOpen,
        setFilteredNodes,
        setShowBulkEditPanel,
        setSearchingNetworkFor,
      addToSelection,
      removeFromSelection,
      toggleNodeSelection,
      setSelectedNodes,
      clearNodeSelection,
      setZoom,
      setPan,
      setConnectionPreview,
      toggleSnapToGrid,
      toggleHighlightNetwork,
      toggleConnectionBadges,
      togglePlacementBadges,
      cycleRelationshipBubbles,
      setFileName,
      setDirty,
      loadData,
      newGenogram,
      saveToHistory,
      undo,
      redo,
      createRelationship,
      createChildRelationship,
      createChildWithUnknownParent,
      createSingleParentAdoption,
      connectExistingPersonAsChild,
      connectChildToExistingRelationship,
      handleChildConnectionOption,
      changeRelationshipTypePreservingChildren,
      addChildToRelationship,
      promoteConnectionToConfirmed,
      createPotentialConnection,
      bringToFront,
      sendToBack,
      copyToClipboard,
      pasteFromClipboard
    };
  }, [
    dispatch,
    snapToGridFunc,
    state.people,
    state.relationships,
    state.highlightNetwork,
    state.showConnectionBadges,
    state.showPlacementBadges,
    state.showRelationshipBubbles,
    state.REL_ABBREVIATIONS,
    state.selectedPerson,
    state.sidePanelOpen,
    state.focusedNodeId,
    state.clipboard
  ]);

  const contextValue = {
    ...state,
    isMobile: effectiveIsMobile,
    isTouch: effectiveIsTouch,
    uiMode: userInteractionOverride, // 'touch' | 'desktop' | null
    actions, // Make sure actions are included
    state, // Include state as a property for backward compatibility
    dispatch // Include dispatch for direct access if needed
  };

  return (
    <GenogramContext.Provider value={contextValue}>
      {children}
    </GenogramContext.Provider>
  );
}

export const useGenogram = () => {
  const context = useContext(GenogramContext);
  if (!context) {
    throw new Error('useGenogram must be used within a GenogramProvider');
  }
  return context;
};