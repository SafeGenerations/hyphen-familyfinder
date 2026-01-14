// src/src-modern/services/calendarService.js
// Service layer for Google Calendar integration

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

/**
 * Initialize Google Calendar OAuth flow
 * @returns {Promise<Object>} Auth URL and state token
 */
export async function initializeCalendarAuth() {
  const response = await fetch(`${API_BASE_URL}/api/calendar/auth/init`, {
    method: 'POST'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to initialize calendar auth');
  }

  return await response.json();
}

/**
 * Complete OAuth flow with authorization code
 * @param {string} code - OAuth authorization code
 * @param {string} state - State token from init
 * @returns {Promise<Object>} Auth result
 */
export async function completeCalendarAuth(code, state) {
  const response = await fetch(`${API_BASE_URL}/api/calendar/auth/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, state })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to complete calendar auth');
  }

  return await response.json();
}

/**
 * Check if user has authorized calendar access
 * @returns {Promise<Object>} Auth status
 */
export async function getCalendarAuthStatus() {
  const response = await fetch(`${API_BASE_URL}/api/calendar/auth/status`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get auth status');
  }

  return await response.json();
}

/**
 * Revoke calendar access
 * @returns {Promise<Object>} Revocation result
 */
export async function revokeCalendarAuth() {
  const response = await fetch(`${API_BASE_URL}/api/calendar/auth/revoke`, {
    method: 'POST'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to revoke calendar auth');
  }

  return await response.json();
}

/**
 * Create a calendar event for follow-up reminder
 * @param {Object} eventData - Event details
 * @returns {Promise<Object>} Created calendar event
 */
export async function createFollowUpEvent(eventData) {
  const response = await fetch(`${API_BASE_URL}/api/calendar/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create calendar event');
  }

  return await response.json();
}

/**
 * List calendar events for a specific member or child
 * @param {Object} filters - Query filters
 * @returns {Promise<Object>} List of calendar events
 */
export async function listFollowUpEvents(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  const response = await fetch(`${API_BASE_URL}/api/calendar/events?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to list calendar events');
  }

  return await response.json();
}

/**
 * Update a calendar event
 * @param {string} eventId - Calendar event ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated event
 */
export async function updateFollowUpEvent(eventId, updates) {
  const response = await fetch(`${API_BASE_URL}/api/calendar/events/${eventId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update calendar event');
  }

  return await response.json();
}

/**
 * Delete a calendar event
 * @param {string} eventId - Calendar event ID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteFollowUpEvent(eventId) {
  const response = await fetch(`${API_BASE_URL}/api/calendar/events/${eventId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete calendar event');
  }

  return await response.json();
}

/**
 * Generate follow-up event data from member and contact info
 * @param {Object} member - Network member object
 * @param {Object} options - Event options
 * @returns {Object} Event data for API
 */
export function buildFollowUpEventData(member, options = {}) {
  const {
    childId,
    date,
    time = '09:00',
    duration = 30,
    notes = '',
    contactType = 'phone',
    reminderMinutes = 60
  } = options;

  // Combine date and time
  const startDateTime = new Date(`${date}T${time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

  // Build event summary
  const memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Member';
  const summary = `Follow-up: ${memberName} (${member.relationship || 'Unknown'})`;

  // Build description
  const descriptionParts = [
    `Follow-up contact with ${memberName}`,
    member.relationship ? `Relationship: ${member.relationship}` : null,
    member.email ? `Email: ${member.email}` : null,
    member.phone ? `Phone: ${member.phone}` : null,
    member.address ? `Address: ${member.address}` : null,
    notes ? `\nNotes: ${notes}` : null
  ].filter(Boolean);

  return {
    childId,
    memberId: member._id,
    summary,
    description: descriptionParts.join('\n'),
    startTime: startDateTime.toISOString(),
    endTime: endDateTime.toISOString(),
    contactType,
    reminderMinutes,
    metadata: {
      memberName,
      relationship: member.relationship,
      email: member.email,
      phone: member.phone
    }
  };
}

/**
 * Format calendar event for display
 * @param {Object} event - Calendar event object
 * @returns {Object} Formatted event
 */
export function formatCalendarEvent(event) {
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);

  return {
    id: event._id || event.id,
    googleEventId: event.googleEventId,
    summary: event.summary,
    description: event.description,
    startTime,
    endTime,
    duration: Math.round((endTime - startTime) / 60000),
    member: event.metadata?.memberName || 'Unknown',
    relationship: event.metadata?.relationship,
    contactType: event.contactType,
    status: event.status || 'scheduled',
    reminderSent: event.reminderSent || false,
    htmlLink: event.htmlLink,
    createdAt: event.createdAt ? new Date(event.createdAt) : null
  };
}

/**
 * Get suggested follow-up dates based on last contact
 * @param {Date} lastContactDate - Date of last contact
 * @returns {Array} Suggested follow-up dates with labels
 */
export function getSuggestedFollowUpDates(lastContactDate = new Date()) {
  const baseDate = new Date(lastContactDate);
  const suggestions = [];

  // Tomorrow
  const tomorrow = new Date(baseDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  suggestions.push({
    label: 'Tomorrow',
    date: tomorrow.toISOString().split('T')[0],
    reason: 'Quick follow-up'
  });

  // 3 days
  const threeDays = new Date(baseDate);
  threeDays.setDate(threeDays.getDate() + 3);
  suggestions.push({
    label: 'In 3 days',
    date: threeDays.toISOString().split('T')[0],
    reason: 'Short-term follow-up'
  });

  // 1 week
  const oneWeek = new Date(baseDate);
  oneWeek.setDate(oneWeek.getDate() + 7);
  suggestions.push({
    label: 'In 1 week',
    date: oneWeek.toISOString().split('T')[0],
    reason: 'Standard follow-up interval'
  });

  // 2 weeks
  const twoWeeks = new Date(baseDate);
  twoWeeks.setDate(twoWeeks.getDate() + 14);
  suggestions.push({
    label: 'In 2 weeks',
    date: twoWeeks.toISOString().split('T')[0],
    reason: 'Extended follow-up'
  });

  // 1 month
  const oneMonth = new Date(baseDate);
  oneMonth.setMonth(oneMonth.getMonth() + 1);
  suggestions.push({
    label: 'In 1 month',
    date: oneMonth.toISOString().split('T')[0],
    reason: 'Long-term follow-up'
  });

  return suggestions;
}

/**
 * Check if member needs follow-up based on last contact
 * @param {Date} lastContactDate - Date of last contact
 * @param {number} thresholdDays - Days threshold for follow-up
 * @returns {Object} Follow-up recommendation
 */
export function checkFollowUpNeeded(lastContactDate, thresholdDays = 14) {
  if (!lastContactDate) {
    return {
      needed: true,
      urgency: 'high',
      message: 'No contact recorded',
      daysSinceContact: null
    };
  }

  const now = new Date();
  const lastContact = new Date(lastContactDate);
  const daysSince = Math.floor((now - lastContact) / (1000 * 60 * 60 * 24));

  if (daysSince > thresholdDays * 2) {
    return {
      needed: true,
      urgency: 'high',
      message: `${daysSince} days since last contact - urgent follow-up needed`,
      daysSinceContact: daysSince
    };
  } else if (daysSince > thresholdDays) {
    return {
      needed: true,
      urgency: 'medium',
      message: `${daysSince} days since last contact - follow-up recommended`,
      daysSinceContact: daysSince
    };
  } else if (daysSince > thresholdDays / 2) {
    return {
      needed: true,
      urgency: 'low',
      message: `${daysSince} days since last contact - follow-up approaching`,
      daysSinceContact: daysSince
    };
  } else {
    return {
      needed: false,
      urgency: 'none',
      message: `Recent contact (${daysSince} days ago)`,
      daysSinceContact: daysSince
    };
  }
}
