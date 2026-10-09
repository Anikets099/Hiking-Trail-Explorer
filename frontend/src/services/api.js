// Use the Vite proxy locally. Production must call the deployed API directly;
// relative URLs such as /api point back to the static frontend host.
const productionApiUrl = 'https://hiking-trail-explorer-backend.onrender.com/api';
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');
export const API_BASE_URL =
  import.meta.env.PROD && (!configuredApiUrl || configuredApiUrl.startsWith('/'))
    ? productionApiUrl
    : configuredApiUrl || '/api';

// Origin that serves backend-hosted files such as /uploads (empty when proxied by Vite)
export const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

// Uploaded files live on the backend host, everything else is a frontend asset or absolute URL
export function resolveUploadUrl(path) {
  if (path && path.startsWith('/uploads/')) {
    return `${BACKEND_BASE_URL}${path}`;
  }
  return path;
}

/**
 * Universal API Request Wrapper with JWT Header Injection
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const token = localStorage.getItem('trailexplorer_token');

  const headers = {
    ...options.headers
  };

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
    error.code = data.code;
    error.data = data;
    throw error;
  }

  return data;
}

export default apiRequest;