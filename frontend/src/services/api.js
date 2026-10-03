// Use the Vite proxy locally. Production must call the deployed API directly;
// relative URLs such as /api point back to the static frontend host.
const productionApiUrl = 'https://hiking-trail-explorer-backend.onrender.com/api';
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');
const API_BASE_URL =
  import.meta.env.PROD && (!configuredApiUrl || configuredApiUrl.startsWith('/'))
    ? productionApiUrl
    : configuredApiUrl || '/api';

/**
 * Universal API Request Wrapper with JWT Header Injection
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const token = localStorage.getItem('trailexplorer_token');

  const headers = {
    ...options.headers
  };

  // If not sending FormData (for file uploads), default to JSON content-type
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export default apiRequest;
