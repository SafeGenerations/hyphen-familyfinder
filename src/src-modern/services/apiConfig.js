/**
 * API Configuration
 *
 * Centralized configuration for API endpoints.
 * Uses standalone Azure Functions app for API.
 */

// Uses standalone Azure Functions app since SWA managed functions
// don't support the v3 model properly
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ||
  'https://func-hyphen-familyfinder-dev.azurewebsites.net';

export default API_BASE_URL;

export function getApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}
