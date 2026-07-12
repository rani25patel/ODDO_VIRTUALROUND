/* ==========================================================================
   api.js
   Single source of truth for backend endpoints + a small fetch wrapper.
   Every page module (auth.js, dashboard.js, ...) calls through here —
   nothing outside this file should hardcode a URL.
   ========================================================================== */

const API_BASE_URL = 'http://localhost:5000/api'; // TODO: point to real backend

const API_ENDPOINTS = {
  login: `${API_BASE_URL}/auth/login`,
  logout: `${API_BASE_URL}/auth/logout`,
  forgotPassword: `${API_BASE_URL}/auth/forgot-password`,
  currentUser: `${API_BASE_URL}/auth/me`,

  dashboardStats: `${API_BASE_URL}/dashboard/stats`,
  dashboardActivity: `${API_BASE_URL}/dashboard/activity`,

  departments: `${API_BASE_URL}/departments`,
  employees: `${API_BASE_URL}/employees`,
  categories: `${API_BASE_URL}/categories`,
  assets: `${API_BASE_URL}/assets`,
  allocations: `${API_BASE_URL}/allocations`,
  bookings: `${API_BASE_URL}/bookings`,
  maintenance: `${API_BASE_URL}/maintenance`,
  audits: `${API_BASE_URL}/audits`,
  reports: `${API_BASE_URL}/reports`,
  notifications: `${API_BASE_URL}/notifications`,
  profile: `${API_BASE_URL}/profile`,
};

/**
 * Generic request wrapper around fetch().
 * Centralizes headers, JSON parsing, and error handling so every
 * page module can call apiRequest() instead of repeating boilerplate.
 *
 * @param {string} url
 * @param {object} options - { method, body, headers }
 * @returns {Promise<any>}
 */
async function apiRequest(url, options = {}) {
  const token = localStorage.getItem('assetflow_token');

  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  };

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : null;

    if (!response.ok) {
      const message = (data && data.message) || `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return data;
  } catch (error) {
    // Network failure, backend offline, etc. Callers decide fallback behavior
    // (e.g. using dummy data while the backend isn't ready yet).
    console.error(`[API] ${config.method} ${url} failed:`, error.message);
    throw error;
  }
}

/* Convenience verbs used across page modules */
const api = {
  get: (url) => apiRequest(url, { method: 'GET' }),
  post: (url, body) => apiRequest(url, { method: 'POST', body }),
  put: (url, body) => apiRequest(url, { method: 'PUT', body }),
  patch: (url, body) => apiRequest(url, { method: 'PATCH', body }),
  delete: (url) => apiRequest(url, { method: 'DELETE' }),
};