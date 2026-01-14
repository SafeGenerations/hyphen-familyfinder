// Audit logging service for tracking all genogram changes
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:7071';

/**
 * Create an audit log entry
 */
export async function createAuditLog({
  userId = 'anonymous',
  userName = 'Anonymous User',
  action,
  entityType,
  entityId,
  beforeState = null,
  afterState = null,
  metadata = {}
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        userName,
        action,
        entityType,
        entityId,
        beforeState,
        afterState,
        metadata
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create audit log: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Failed to create audit log:', error);
    // Don't throw - audit logging should not break the app
    return { success: false, error: error.message };
  }
}

/**
 * Search audit logs with filters
 */
export async function searchAuditLogs({
  entityType = 'all',
  entityId = null,
  action = 'all',
  userId = 'all',
  dateRange = '30days',
  page = 1,
  limit = 50
} = {}) {
  try {
    const params = new URLSearchParams({
      entityType,
      action,
      userId,
      dateRange,
      page: page.toString(),
      limit: limit.toString()
    });

    if (entityId) {
      params.append('entityId', entityId);
    }

    const response = await fetch(`${API_BASE_URL}/api/audit?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to search audit logs: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Failed to search audit logs:', error);
    return {
      success: true,
      data: [],
      pagination: { page: 1, limit, total: 0, pages: 0 }
    };
  }
}

/**
 * Get audit log statistics
 */
export async function getAuditStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/audit/stats`);

    if (!response.ok) {
      throw new Error(`Failed to get audit stats: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Failed to get audit stats:', error);
    return {
      success: true,
      data: {
        total: 0,
        byAction: {},
        byEntityType: {},
        byUser: {},
        recent: []
      }
    };
  }
}
