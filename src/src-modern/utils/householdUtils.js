/**
 * Utility functions for household operations
 */

/**
 * Expand a polygon outward by a given buffer distance
 * @param {Array} polygon - Array of points defining the polygon
 * @param {number} buffer - Distance to expand (in pixels)
 * @returns {Array} - Expanded polygon points
 */
function expandPolygon(polygon, buffer) {
  if (!polygon || polygon.length < 3 || !buffer) {
    return polygon;
  }

  // Calculate the center of the polygon
  const centerX = polygon.reduce((sum, p) => sum + p.x, 0) / polygon.length;
  const centerY = polygon.reduce((sum, p) => sum + p.y, 0) / polygon.length;

  // Expand each point away from the center
  return polygon.map(point => {
    const dx = point.x - centerX;
    const dy = point.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return point;
    
    // Move point outward by buffer distance
    const ratio = (distance + buffer) / distance;
    return {
      x: centerX + dx * ratio,
      y: centerY + dy * ratio
    };
  });
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 * @param {Object} point - Point with x, y coordinates
 * @param {Array} polygon - Array of points defining the polygon
 * @param {number} buffer - Optional buffer distance to expand polygon (default: 15 pixels)
 * @returns {boolean} - True if point is inside polygon
 */
export function isPointInPolygon(point, polygon, buffer = 15) {
  if (!point || !polygon || polygon.length < 3) {
    return false;
  }

  // Expand the polygon slightly for more forgiving overlap detection
  const expandedPolygon = buffer > 0 ? expandPolygon(polygon, buffer) : polygon;

  let inside = false;
  const x = point.x;
  const y = point.y;

  for (let i = 0, j = expandedPolygon.length - 1; i < expandedPolygon.length; j = i++) {
    const xi = expandedPolygon[i].x;
    const yi = expandedPolygon[i].y;
    const xj = expandedPolygon[j].x;
    const yj = expandedPolygon[j].y;

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Calculate which people are inside each household boundary
 * @param {Array} households - Array of household objects with points
 * @param {Array} people - Array of person objects with x, y coordinates
 * @returns {Object} - Map of householdId to array of personIds
 */
export function calculateHouseholdMembers(households, people) {
  const membershipMap = {};

  if (!households || !people) {
    console.log('calculateHouseholdMembers: Missing data', { households: !!households, people: !!people });
    return membershipMap;
  }

  console.log('calculateHouseholdMembers:', { 
    householdCount: households.length, 
    peopleCount: people.length,
    samplePerson: people[0] ? { id: people[0].id, x: people[0].x, y: people[0].y } : null,
    sampleHousehold: households[0] ? { id: households[0].id, pointCount: households[0].points?.length } : null
  });

  households.forEach(household => {
    if (!household.id || !household.points || household.points.length < 3) {
      membershipMap[household.id] = [];
      return;
    }

    const members = people
      .filter(person => {
        if (!person || !person.id || person.x === undefined || person.y === undefined) {
          return false;
        }
        const isInside = isPointInPolygon({ x: person.x, y: person.y }, household.points);
        if (isInside) {
          console.log('Person inside household:', { 
            personId: person.id, 
            name: person.firstName || person.name,
            x: person.x, 
            y: person.y,
            householdId: household.id 
          });
        }
        return isInside;
      })
      .map(person => person.id);

    console.log(`Household ${household.id} members:`, members);
    membershipMap[household.id] = members;
  });

  return membershipMap;
}

/**
 * Update household objects with their calculated members
 * @param {Array} households - Array of household objects
 * @param {Array} people - Array of person objects
 * @returns {Array} - Updated households with members array
 */
export function updateHouseholdsWithMembers(households, people) {
  if (!households || !people) {
    return households;
  }

  const membershipMap = calculateHouseholdMembers(households, people);

  return households.map(household => ({
    ...household,
    members: membershipMap[household.id] || []
  }));
}

/**
 * Get all household IDs that contain a specific person
 * @param {string} personId - ID of the person
 * @param {Array} households - Array of household objects with members
 * @returns {Array} - Array of household IDs
 */
export function getPersonHouseholds(personId, households) {
  if (!personId || !households) {
    return [];
  }

  return households
    .filter(household => household.members && household.members.includes(personId))
    .map(household => household.id);
}
