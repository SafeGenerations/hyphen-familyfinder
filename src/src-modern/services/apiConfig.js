/**
 * API Configuration
 *
 * Centralized configuration for API endpoints.
 * For Azure Static Web Apps, the API is served from the same origin.
 */

// In production (Azure SWA), API is at same origin
// In development, can use REACT_APP_API_BASE_URL for local Functions
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

export default API_BASE_URL;

export function getApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}
