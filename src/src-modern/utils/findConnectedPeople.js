// src/src-modern/utils/findConnectedPeople.js

/**
 * Finds all people connected to a given person through relationships
 * @param {string} personId - The starting person's ID
 * @param {Array} people - Array of all people
 * @param {Array} relationships - Array of all relationships
 * @param {Set} visited - Set of already visited person IDs (used for recursion)
 * @returns {Set} Set of all connected person IDs
 */
export function findConnectedPeople(personId, people, relationships, visited = new Set()) {
  if (visited.has(personId)) return visited;
  
  visited.add(personId);
  
  // Find all relationships involving this person
  const connectedRelationships = relationships.filter(rel => 
    rel.from === personId || rel.to === personId
  );
  
  // For each relationship, add the other person and recurse
  connectedRelationships.forEach(rel => {
    const otherPersonId = rel.from === personId ? rel.to : rel.from;
    if (!visited.has(otherPersonId)) {
      findConnectedPeople(otherPersonId, people, relationships, visited);
    }
  });
  
  return visited;
}

/**
 * Finds all people connected through given person IDs
 * @param {Array} startingIds - Array of person IDs to start from
 * @param {Array} relationships - Array of all relationships
 * @param {Array} people - Array of all people
 * @returns {Array} Array of all connected person IDs
 */
export function findAllConnectedPeople(startingIds, relationships, people) {
  const connectedIds = new Set();
  
  // Helper function to recursively find connections
  const findConnections = (personId) => {
    if (connectedIds.has(personId)) return;
    
    connectedIds.add(personId);
    
    // Find all relationships involving this person
    const personRelationships = relationships.filter(rel => 
      rel.from === personId || rel.to === personId
    );
    
    // For each relationship, add the other person and recurse
    personRelationships.forEach(rel => {
      const otherPersonId = rel.from === personId ? rel.to : rel.from;
      if (!connectedIds.has(otherPersonId)) {
        findConnections(otherPersonId);
      }
      
      // For child relationships, also include the parent relationship participants
      if (rel.type === 'child') {
        if (rel.from && rel.from !== personId) {
          // This is a parent relationship ID, find the actual parents
          const parentRel = relationships.find(r => r.id === rel.from);
          if (parentRel) {
            findConnections(parentRel.from);
            findConnections(parentRel.to);
          }
        }
      }
    });
  };
  
  // Start from all provided IDs
  startingIds.forEach(id => findConnections(id));
  
  return Array.from(connectedIds);
}

/**
 * Finds immediate family members (parents, children, siblings)
 * @param {string} personId - The person's ID
 * @param {Array} people - Array of all people
 * @param {Array} relationships - Array of all relationships
 * @returns {Object} Object with arrays of parentIds, childIds, and siblingIds
 */
export function findImmediateFamily(personId, people, relationships) {
  const family = {
    parentIds: [],
    childIds: [],
    siblingIds: []
  };
  
  // Find parent relationships (where this person is the child)
  const childRelationships = relationships.filter(r => 
    r.type === 'child' && r.to === personId
  );
  
  childRelationships.forEach(childRel => {
    // Find the parent marriage/partnership
    const parentRel = relationships.find(r => r.id === childRel.from);
    if (parentRel) {
      family.parentIds.push(parentRel.from, parentRel.to);
      
      // Find siblings (other children of the same parents)
      const siblingRelationships = relationships.filter(r => 
        r.type === 'child' && r.from === parentRel.id && r.to !== personId
      );
      siblingRelationships.forEach(sibRel => {
        if (!family.siblingIds.includes(sibRel.to)) {
          family.siblingIds.push(sibRel.to);
        }
      });
    }
  });
  
  // Find children (where this person is a parent)
  const parentRelationships = relationships.filter(r => 
    (r.from === personId || r.to === personId) && 
    ['marriage', 'partner', 'cohabitation'].includes(r.type)
  );
  
  parentRelationships.forEach(parentRel => {
    const childrenRelationships = relationships.filter(r => 
      r.type === 'child' && r.from === parentRel.id
    );
    childrenRelationships.forEach(childRel => {
      if (!family.childIds.includes(childRel.to)) {
        family.childIds.push(childRel.to);
      }
    });
  });
  
  return family;
}

/**
 * Calculates the offset positions for all connected people
 * Used when dragging a relationship to maintain relative positions
 * @param {Array} connectedIds - Array of connected person IDs
 * @param {Array} people - Array of all people
 * @param {Object} dragStartPos - The starting position of the drag
 * @returns {Object} Object mapping person IDs to their offset positions
 */
export function calculateConnectedOffsets(connectedIds, people, dragStartPos) {
  const offsets = {};
  
  connectedIds.forEach(personId => {
    const person = people.find(p => p.id === personId);
    if (person) {
      offsets[personId] = {
        x: person.x - dragStartPos.x,
        y: person.y - dragStartPos.y
      };
    }
  });
  
  return offsets;
}