/**
 * Member Service
 *
 * Frontend service layer for network member management operations.
 * Communicates with the /api/members endpoints.
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:7071';

/**
 * Get all members for a case/child
 * @param {string} caseId - Case/child ID
 * @param {Object} filters - Optional filters (status, role, page, limit)
 * @returns {Promise<Object>} Members list with pagination
 */
export async function getNetworkMembers(caseId, filters = {}) {
  const params = new URLSearchParams({ childId: caseId });

  if (filters.status) params.append('status', filters.status);
  if (filters.role) params.append('role', filters.role);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);

  const response = await fetch(`${API_BASE_URL}/api/members?${params}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch members' }));
    throw new Error(error.message || error.error || 'Failed to fetch members');
  }

  return await response.json();
}

/**
 * Get a single member by ID
 * @param {string} memberId - Member ID
 * @returns {Promise<Object>} Member details
 */
export async function getMember(memberId) {
  const response = await fetch(`${API_BASE_URL}/api/members/${memberId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch member' }));
    throw new Error(error.message || error.error || 'Failed to fetch member');
  }

  return await response.json();
}

/**
 * Create a new member
 * @param {Object} memberData - Member data including childId
 * @returns {Promise<Object>} Created member
 */
export async function createMember(memberData) {
  const response = await fetch(`${API_BASE_URL}/api/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(memberData)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create member' }));
    throw new Error(error.message || error.error || 'Failed to create member');
  }

  return await response.json();
}

/**
 * Update an existing member
 * @param {string} memberId - Member ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated member
 */
export async function updateMember(memberId, updates) {
  const response = await fetch(`${API_BASE_URL}/api/members/${memberId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update member' }));
    throw new Error(error.message || error.error || 'Failed to update member');
  }

  return await response.json();
}

/**
 * Delete a member
 * @param {string} memberId - Member ID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteMember(memberId) {
  const response = await fetch(`${API_BASE_URL}/api/members/${memberId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete member' }));
    throw new Error(error.message || error.error || 'Failed to delete member');
  }

  return await response.json();
}

/**
 * Merge duplicate members into a target
 * @param {string} targetMemberId - ID of member to merge into
 * @param {string[]} sourceMemberIds - IDs of members to merge from
 * @returns {Promise<Object>} Merged member result
 */
export async function mergeMembers(targetMemberId, sourceMemberIds) {
  const response = await fetch(`${API_BASE_URL}/api/members/${targetMemberId}/merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceMemberIds })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to merge members' }));
    throw new Error(error.message || error.error || 'Failed to merge members');
  }

  return await response.json();
}

/**
 * Add a search result as a new network member
 * @param {string} caseId - Case/child ID
 * @param {Object} searchResult - Search result to add
 * @returns {Promise<Object>} Created member
 */
export async function addMemberFromSearch(caseId, searchResult) {
  const memberData = {
    childId: caseId,
    firstName: searchResult.firstName || '',
    lastName: searchResult.lastName || '',
    relationshipToChild: searchResult.relationshipType || searchResult.relationship || '',
    phones: searchResult.phones?.value || searchResult.phones || [],
    emails: searchResult.emails?.value || searchResult.emails || [],
    addresses: searchResult.addresses?.value || searchResult.addresses || [],
    status: 'active',
    commitmentLevel: 'exploring',
    sourceProvenance: [
      searchResult.source || 'search',
      `confidence: ${searchResult.confidence || 'unknown'}`,
      `added: ${new Date().toISOString()}`
    ]
  };

  return await createMember(memberData);
}

/**
 * Format member for display
 * @param {Object} member - Raw member object from API
 * @returns {Object} Formatted member data
 */
export function formatMember(member) {
  return {
    id: member._id,
    name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown',
    firstName: member.firstName,
    lastName: member.lastName,
    relationship: member.relationshipToChild,
    role: member.role,
    status: member.status,
    commitmentLevel: member.commitmentLevel,
    activityState: member.activityState,
    phones: member.phones || [],
    emails: member.emails || [],
    addresses: member.addresses || [],
    lastContact: member.lastContactAt ? new Date(member.lastContactAt) : null,
    notes: member.notes,
    sourceProvenance: member.sourceProvenance || []
  };
}

/**
 * Get display text for commitment level
 * @param {string} level - Commitment level key
 * @returns {string} Display text
 */
export function getCommitmentDisplay(level) {
  const displays = {
    exploring: 'Exploring',
    willing: 'Willing to connect',
    engaged: 'Actively engaged',
    core: 'Core support'
  };
  return displays[level] || level || 'Unknown';
}

/**
 * Get display text for activity state
 * @param {string} state - Activity state key
 * @returns {Object} Display info with label and color
 */
export function getActivityStateDisplay(state) {
  const displays = {
    active: { label: 'Active', color: 'green' },
    warming: { label: 'Warming up', color: 'yellow' },
    cold: { label: 'Needs contact', color: 'red' }
  };
  return displays[state] || { label: state || 'Unknown', color: 'gray' };
}

/**
 * Get display text for member role
 * @param {string} role - Role key
 * @returns {string} Display text
 */
export function getRoleDisplay(role) {
  const displays = {
    emotional: 'Emotional Support',
    practical: 'Practical Support',
    placement: 'Placement Resource',
    advocacy: 'Advocacy',
    mentor: 'Mentor',
    other: 'Other'
  };
  return displays[role] || role || 'Not assigned';
}
