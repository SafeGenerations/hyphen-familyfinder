/**
 * Network Data Service
 *
 * Frontend service layer for network graph data operations.
 * Communicates with the /api/network endpoints.
 */

import API_BASE_URL from './apiConfig';

/**
 * Get complete network graph for a child/case
 * @param {string} childId - Child/case ID
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Network graph with nodes and edges
 */
export async function getNetworkGraph(childId, options = {}) {
  const params = new URLSearchParams();

  if (options.includeInactive) {
    params.append('includeInactive', 'true');
  }

  const url = `${API_BASE_URL}/api/network/${childId}${params.size > 0 ? '?' + params : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch network graph' }));
    throw new Error(error.message || error.error || 'Failed to fetch network graph');
  }

  return await response.json();
}

/**
 * Get network statistics only (lighter weight than full graph)
 * @param {string} childId - Child/case ID
 * @returns {Promise<Object>} Network statistics
 */
export async function getNetworkStats(childId) {
  const response = await fetch(`${API_BASE_URL}/api/network/${childId}/stats`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch network stats' }));
    throw new Error(error.message || error.error || 'Failed to fetch network stats');
  }

  return await response.json();
}

/**
 * Get relationships for a network
 * @param {string} childId - Child/case ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>} Relationships list
 */
export async function getRelationships(childId, filters = {}) {
  const params = new URLSearchParams({ childId });

  if (filters.memberId) params.append('memberId', filters.memberId);
  if (filters.type) params.append('type', filters.type);
  if (filters.conflictFlag !== undefined) params.append('conflictFlag', filters.conflictFlag);

  const response = await fetch(`${API_BASE_URL}/api/relationships?${params}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch relationships' }));
    throw new Error(error.message || error.error || 'Failed to fetch relationships');
  }

  return await response.json();
}

/**
 * Create a relationship between members
 * @param {Object} relationshipData - Relationship data
 * @returns {Promise<Object>} Created relationship
 */
export async function createRelationship(relationshipData) {
  const response = await fetch(`${API_BASE_URL}/api/relationships`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(relationshipData)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create relationship' }));
    throw new Error(error.message || error.error || 'Failed to create relationship');
  }

  return await response.json();
}

/**
 * Update a relationship
 * @param {string} relationshipId - Relationship ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated relationship
 */
export async function updateRelationship(relationshipId, updates) {
  const response = await fetch(`${API_BASE_URL}/api/relationships/${relationshipId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update relationship' }));
    throw new Error(error.message || error.error || 'Failed to update relationship');
  }

  return await response.json();
}

/**
 * Delete a relationship
 * @param {string} relationshipId - Relationship ID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteRelationship(relationshipId) {
  const response = await fetch(`${API_BASE_URL}/api/relationships/${relationshipId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete relationship' }));
    throw new Error(error.message || error.error || 'Failed to delete relationship');
  }

  return await response.json();
}

/**
 * Format network graph for visualization components
 * @param {Object} networkData - Raw network data from API
 * @returns {Object} Formatted network graph
 */
export function formatNetworkGraph(networkData) {
  if (!networkData || !networkData.nodes) {
    return { nodes: [], edges: [], metadata: {} };
  }

  return {
    nodes: (networkData.nodes || []).map(node => ({
      id: node._id,
      label: node.name,
      type: 'person',
      data: {
        firstName: node.firstName,
        lastName: node.lastName,
        relationship: node.relationshipToChild,
        role: node.role,
        status: node.status,
        commitmentLevel: node.commitmentLevel,
        activityState: node.activityState,
        lastContactAt: node.lastContactAt,
        phones: node.phones || [],
        emails: node.emails || []
      }
    })),
    edges: (networkData.edges || []).map(edge => ({
      id: edge._id,
      source: edge.memberIdA,
      target: edge.memberIdB,
      type: edge.type,
      strength: edge.strength,
      hasConflict: edge.conflictFlag
    })),
    metadata: {
      childId: networkData.childId,
      summary: networkData.summary
    }
  };
}

/**
 * Calculate network health summary from stats
 * @param {Object} stats - Network statistics
 * @returns {Object} Health summary
 */
export function calculateNetworkHealthSummary(stats) {
  if (!stats || !stats.metrics) {
    return { score: 0, status: 'unknown', details: {} };
  }

  const { score, activeCount, roles, conflicts } = stats.metrics;
  const { members, relationships, contactEvents } = stats.counts || {};
  const { active, warming, cold } = stats.activityBuckets || {};

  // Determine status based on score
  let status;
  if (score >= 12) status = 'excellent';
  else if (score >= 8) status = 'healthy';
  else if (score >= 5) status = 'fair';
  else status = 'at-risk';

  return {
    score,
    status,
    details: {
      activeMembers: activeCount,
      totalMembers: members,
      roleDiversity: roles?.length || 0,
      conflictCount: conflicts,
      relationshipCount: relationships,
      contactEventCount: contactEvents,
      activityBreakdown: { active, warming, cold }
    }
  };
}

/**
 * Get color for health score
 * @param {number} score - Health score
 * @returns {string} Color name
 */
export function getHealthScoreColor(score) {
  if (score >= 12) return 'green';
  if (score >= 8) return 'blue';
  if (score >= 5) return 'yellow';
  return 'red';
}

/**
 * Get display text for relationship type
 * @param {string} type - Relationship type key
 * @returns {string} Display text
 */
export function getRelationshipTypeDisplay(type) {
  const displays = {
    support: 'Supportive',
    conflict: 'Conflict',
    estranged: 'Estranged',
    close: 'Close relationship',
    distant: 'Distant',
    coparent: 'Co-parenting'
  };
  return displays[type] || type || 'Unknown';
}

/**
 * Export network data as JSON
 * @param {Object} networkData - Network data to export
 * @param {string} filename - Base filename (without extension)
 */
export function exportNetworkAsJson(networkData, filename = 'network') {
  const blob = new Blob([JSON.stringify(networkData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export network data as CSV
 * @param {Object} networkData - Network data to export
 * @param {string} filename - Base filename (without extension)
 */
export function exportNetworkAsCsv(networkData, filename = 'network') {
  if (!networkData || !networkData.nodes) return;

  // Build members CSV
  const memberHeaders = ['Name', 'Relationship', 'Role', 'Status', 'Activity', 'Commitment', 'Last Contact'];
  const memberRows = networkData.nodes.map(node => [
    node.name,
    node.relationshipToChild || '',
    node.role || '',
    node.status || '',
    node.activityState || '',
    node.commitmentLevel || '',
    node.lastContactAt ? new Date(node.lastContactAt).toLocaleDateString() : ''
  ]);

  // Build relationships CSV section
  const relHeaders = ['Member A', 'Member B', 'Type', 'Conflict'];
  const nodeMap = new Map(networkData.nodes.map(n => [n._id, n.name]));
  const relRows = (networkData.edges || []).map(edge => [
    nodeMap.get(edge.memberIdA) || edge.memberIdA,
    nodeMap.get(edge.memberIdB) || edge.memberIdB,
    edge.type || '',
    edge.conflictFlag ? 'Yes' : 'No'
  ]);

  // Build CSV content
  const csvContent = [
    'NETWORK MEMBERS',
    memberHeaders.join(','),
    ...memberRows.map(row => row.map(cell => `"${cell}"`).join(',')),
    '',
    'RELATIONSHIPS',
    relHeaders.join(','),
    ...relRows.map(row => row.map(cell => `"${cell}"`).join(',')),
    '',
    'SUMMARY',
    `Health Score,${networkData.summary?.metrics?.score || 0}`,
    `Active Members,${networkData.summary?.metrics?.activeCount || 0}`,
    `Total Members,${networkData.summary?.counts?.members || 0}`,
    `Conflicts,${networkData.summary?.metrics?.conflicts || 0}`
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
