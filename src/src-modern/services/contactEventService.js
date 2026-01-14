// src/src-modern/services/contactEventService.js
// Service layer for contact event API operations

import API_BASE_URL from './apiConfig';

/**
 * Search contact events with filters and pagination
 * @param {Object} filters - Search filters
 * @returns {Promise<Object>} Search results with pagination
 */
export async function searchContactEvents(filters = {}) {
  const params = new URLSearchParams();

  // Add all non-empty filters to query string
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  const url = `${API_BASE_URL}/api/contacts/search?${params.toString()}`;
  
  try {
    const response = await fetch(url);

    if (!response.ok) {
      // If API not available, return empty results for development
      if (response.status === 404 || !response.headers.get('content-type')?.includes('application/json')) {
        console.warn('Contact events API not available, returning empty results');
        return {
          success: true,
          data: [],
          pagination: { page: 1, limit: 50, total: 0, pages: 0 },
          filters
        };
      }
      const error = await response.json();
      throw new Error(error.message || 'Failed to search contact events');
    }

    return await response.json();
  } catch (err) {
    // Handle network errors or API not running
    if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
      console.warn('Contact events API not available, returning empty results');
      return {
        success: true,
        data: [],
        pagination: { page: 1, limit: 50, total: 0, pages: 0 },
        filters
      };
    }
    throw err;
  }
}

/**
 * Get contact event statistics
 * @param {Object} filters - Statistics filters
 * @returns {Promise<Object>} Contact event statistics
 */
export async function getContactEventStats(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  const url = `${API_BASE_URL}/api/contacts/stats?${params.toString()}`;
  
  try {
    const response = await fetch(url);

    if (!response.ok) {
      // If API not available, return empty stats for development
      if (response.status === 404 || !response.headers.get('content-type')?.includes('application/json')) {
        console.warn('Contact stats API not available, returning empty stats');
        return {
          success: true,
          stats: {
            total: 0,
            byType: [],
            byDirection: [],
            byProvider: [],
            byMonth: [],
            mostRecentContact: null
          },
          filters
        };
      }
      const error = await response.json();
      throw new Error(error.message || 'Failed to get contact event stats');
    }

    return await response.json();
  } catch (err) {
    // Handle network errors or API not running
    if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
      console.warn('Contact stats API not available, returning empty stats');
      return {
        success: true,
        stats: {
          total: 0,
          byType: [],
          byDirection: [],
          byProvider: [],
          byMonth: [],
          mostRecentContact: null
        },
        filters
      };
    }
    throw err;
  }
}

/**
 * Create a manual contact event
 * @param {Object} eventData - Contact event data
 * @returns {Promise<Object>} Created contact event
 */
export async function createContactEvent(eventData) {
  const url = `${API_BASE_URL}/api/contacts`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create contact event');
  }

  return await response.json();
}

/**
 * Update a contact event
 * @param {string} eventId - Event ID to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated contact event
 */
export async function updateContactEvent(eventId, updates) {
  const url = `${API_BASE_URL}/api/contacts/${eventId}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update contact event');
  }

  return await response.json();
}

/**
 * Delete a contact event
 * @param {string} eventId - Event ID to delete
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteContactEvent(eventId) {
  const url = `${API_BASE_URL}/api/contacts/${eventId}`;
  const response = await fetch(url, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete contact event');
  }

  return await response.json();
}

/**
 * Export contact events to CSV
 * @param {Object} filters - Export filters
 * @returns {Promise<Blob>} CSV file blob
 */
export async function exportContactEvents(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  const url = `${API_BASE_URL}/api/contacts/export?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to export contact events');
  }

  return await response.blob();
}

/**
 * Format contact event for display
 * @param {Object} event - Contact event object
 * @returns {Object} Formatted event data
 */
export function formatContactEvent(event) {
  return {
    id: event._id,
    type: event.contactType,
    direction: event.direction,
    timestamp: new Date(event.timestamp),
    member: event.member ? {
      id: event.member._id,
      name: `${event.member.firstName} ${event.member.lastName}`.trim(),
      relationship: event.member.relationship,
      email: event.member.email,
      phone: event.member.phone
    } : null,
    notes: event.notes || '',
    provider: event.metadata?.provider || 'manual',
    details: {
      to: event.metadata?.to,
      from: event.metadata?.from,
      subject: event.metadata?.subject,
      body: event.metadata?.body,
      messageId: event.metadata?.messageId
    }
  };
}

/**
 * Get contact type icon/label
 * @param {string} type - Contact type
 * @returns {Object} Icon and label
 */
export function getContactTypeDisplay(type) {
  const displays = {
    email: { icon: '📧', label: 'Email', color: '#3b82f6' },
    sms: { icon: '💬', label: 'SMS', color: '#10b981' },
    phone: { icon: '📞', label: 'Phone', color: '#8b5cf6' },
    visit: { icon: '🏠', label: 'Visit', color: '#f59e0b' },
    letter: { icon: '✉️', label: 'Letter', color: '#6366f1' },
    other: { icon: '📝', label: 'Other', color: '#6b7280' }
  };

  return displays[type] || displays.other;
}

/**
 * Get direction icon/label
 * @param {string} direction - Contact direction
 * @returns {Object} Icon and label
 */
export function getDirectionDisplay(direction) {
  const displays = {
    outbound: { icon: '↗️', label: 'Outbound' },
    inbound: { icon: '↙️', label: 'Inbound' }
  };

  return displays[direction] || { icon: '↔️', label: direction };
}
