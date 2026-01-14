// Case management service for Family Finder
import API_BASE_URL from './apiConfig';

/**
 * Get all cases with optional filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} List of cases
 */
export async function getCases(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  if (filters.hasFlags !== undefined) params.append('hasFlags', filters.hasFlags);
  
  const response = await fetch(`${API_BASE_URL}/api/cases?${params}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch cases' }));
    throw new Error(error.message || 'Failed to fetch cases');
  }
  
  return await response.json();
}

/**
 * Get a single case by ID
 * @param {string} caseId - Case ID
 * @returns {Promise<Object>} Case details
 */
export async function getCase(caseId) {
  const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch case' }));
    throw new Error(error.message || 'Failed to fetch case');
  }
  
  return await response.json();
}

/**
 * Create a new case
 * @param {Object} caseData - Case data
 * @returns {Promise<Object>} Created case
 */
export async function createCase(caseData) {
  const response = await fetch(`${API_BASE_URL}/api/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(caseData)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create case' }));
    throw new Error(error.message || 'Failed to create case');
  }
  
  return await response.json();
}

/**
 * Update a case
 * @param {string} caseId - Case ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated case
 */
export async function updateCase(caseId, updates) {
  const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update case' }));
    throw new Error(error.message || 'Failed to update case');
  }
  
  return await response.json();
}

/**
 * Delete a case
 * @param {string} caseId - Case ID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteCase(caseId) {
  const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete case' }));
    throw new Error(error.message || 'Failed to delete case');
  }
  
  return await response.json();
}

/**
 * Calculate case priority based on network health and flags
 * @param {Object} caseData - Case data
 * @returns {string} Priority level (high, medium, low)
 */
export function calculateCasePriority(caseData) {
  const { networkHealth = 5, flags = [], networkMembers = {} } = caseData;
  
  // High priority conditions
  if (flags.some(f => ['inactive member', 'low health', 'no placement option'].includes(f))) {
    return 'high';
  }
  
  if (networkHealth <= 3) {
    return 'high';
  }
  
  // Medium priority conditions
  if (networkHealth <= 6 || flags.length > 0) {
    return 'medium';
  }
  
  // Low priority - stable case
  return 'low';
}

/**
 * Calculate network health score
 * @param {Object} networkData - Network member data
 * @returns {number} Health score 0-10
 */
export function calculateNetworkHealth(networkData) {
  const { active = 0, inactive = 0, total = 0 } = networkData;
  
  if (total === 0) return 0;
  
  const activeRatio = active / total;
  const baseScore = activeRatio * 10;
  
  // Boost if there are many active members
  const volumeBonus = Math.min(active / 5, 2); // Up to +2 points for 5+ active
  
  return Math.min(10, Math.round(baseScore + volumeBonus));
}

/**
 * Get case statistics
 * @returns {Promise<Object>} Case statistics
 */
export async function getCaseStats() {
  const response = await fetch(`${API_BASE_URL}/api/cases/stats`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch stats' }));
    throw new Error(error.message || 'Failed to fetch stats');
  }
  
  return await response.json();
}

/**
 * Add flag to a case
 * @param {string} caseId - Case ID
 * @param {string} flag - Flag to add
 * @returns {Promise<Object>} Updated case
 */
export async function addCaseFlag(caseId, flag) {
  return updateCase(caseId, { $addToSet: { flags: flag } });
}

/**
 * Remove flag from a case
 * @param {string} caseId - Case ID
 * @param {string} flag - Flag to remove
 * @returns {Promise<Object>} Updated case
 */
export async function removeCaseFlag(caseId, flag) {
  return updateCase(caseId, { $pull: { flags: flag } });
}
