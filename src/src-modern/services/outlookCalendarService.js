// src/src-modern/services/outlookCalendarService.js
// Service layer for Microsoft Outlook/Exchange Calendar integration

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

/**
 * Initialize Microsoft OAuth flow for Outlook Calendar
 * @returns {Promise<Object>} Auth URL and state token
 */
export async function initializeOutlookAuth() {
  const response = await fetch(`${API_BASE_URL}/api/calendar/outlook/auth/init`, {
    method: 'POST'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to initialize Outlook auth');
  }

  return await response.json();
}

/**
 * Complete Microsoft OAuth flow with authorization code
 * @param {string} code - OAuth authorization code
 * @param {string} state - State token from init
 * @returns {Promise<Object>} Auth result
 */
export async function completeOutlookAuth(code, state) {
  const response = await fetch(`${API_BASE_URL}/api/calendar/outlook/auth/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, state })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to complete Outlook auth');
  }

  return await response.json();
}

/**
 * Check if user has authorized Outlook calendar access
 * @returns {Promise<Object>} Auth status with provider info
 */
export async function getOutlookAuthStatus() {
  const response = await fetch(`${API_BASE_URL}/api/calendar/outlook/auth/status`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get Outlook auth status');
  }

  return await response.json();
}

/**
 * Revoke Outlook calendar access
 * @returns {Promise<Object>} Revocation result
 */
export async function revokeOutlookAuth() {
  const response = await fetch(`${API_BASE_URL}/api/calendar/outlook/auth/revoke`, {
    method: 'POST'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to revoke Outlook auth');
  }

  return await response.json();
}

/**
 * Create an Outlook calendar event for follow-up reminder
 * @param {Object} eventData - Event details
 * @returns {Promise<Object>} Created calendar event
 */
export async function createOutlookFollowUpEvent(eventData) {
  const response = await fetch(`${API_BASE_URL}/api/calendar/outlook/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create Outlook calendar event');
  }

  return await response.json();
}

/**
 * List Outlook calendar events for a specific member or child
 * @param {Object} filters - Query filters
 * @returns {Promise<Object>} List of calendar events
 */
export async function listOutlookFollowUpEvents(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  const response = await fetch(`${API_BASE_URL}/api/calendar/outlook/events?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to list Outlook calendar events');
  }

  return await response.json();
}

/**
 * Detect which calendar provider user should use based on org settings or browser
 * @returns {string} 'outlook' or 'google'
 */
export function detectCalendarProvider() {
  // Check localStorage for user preference
  const userPreference = localStorage.getItem('calendar_provider');
  if (userPreference) {
    return userPreference;
  }

  // Check for organization-wide setting (could come from admin config)
  const orgSetting = window.FAMILY_FINDER_CONFIG?.defaultCalendarProvider;
  if (orgSetting) {
    return orgSetting;
  }

  // Default to Outlook for government/enterprise environments
  return 'outlook';
}

/**
 * Set user's calendar provider preference
 * @param {string} provider - 'outlook' or 'google'
 */
export function setCalendarProvider(provider) {
  if (provider !== 'outlook' && provider !== 'google') {
    throw new Error('Invalid calendar provider. Must be "outlook" or "google"');
  }
  localStorage.setItem('calendar_provider', provider);
}

/**
 * Get unified calendar service based on provider
 * @param {string} provider - 'outlook' or 'google'
 * @returns {Object} Calendar service functions
 */
export function getCalendarService(provider = null) {
  const selectedProvider = provider || detectCalendarProvider();

  if (selectedProvider === 'outlook') {
    return {
      provider: 'outlook',
      name: 'Microsoft Outlook',
      icon: '📧',
      initAuth: initializeOutlookAuth,
      completeAuth: completeOutlookAuth,
      getAuthStatus: getOutlookAuthStatus,
      revokeAuth: revokeOutlookAuth,
      createEvent: createOutlookFollowUpEvent,
      listEvents: listOutlookFollowUpEvents
    };
  } else {
    // Import Google Calendar service functions
    const {
      initializeCalendarAuth,
      completeCalendarAuth,
      getCalendarAuthStatus,
      revokeCalendarAuth,
      createFollowUpEvent,
      listFollowUpEvents
    } = require('./calendarService');

    return {
      provider: 'google',
      name: 'Google Calendar',
      icon: '📅',
      initAuth: initializeCalendarAuth,
      completeAuth: completeCalendarAuth,
      getAuthStatus: getCalendarAuthStatus,
      revokeAuth: revokeCalendarAuth,
      createEvent: createFollowUpEvent,
      listEvents: listFollowUpEvents
    };
  }
}
