/**
 * API client with error handling and token management
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

/**
 * Get auth token from localStorage
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

/**
 * Set auth token in localStorage
 */
export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', token);
}

/**
 * Clear auth token
 */
export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

/**
 * Make API request with error handling
 */
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add auth token if required
  if (requiresAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }
      return {} as T;
    }

    const data = await response.json();

    // Handle error responses
    if (!response.ok) {
      throw new APIError(
        data.error || data.message || 'Request failed',
        response.status,
        data.details || data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    // Network or other errors
    throw new APIError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
}

/**
 * API client methods
 */
export const api = {
  // Auth
  auth: {
    register: (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    }) => request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: false,
    }),

    login: (email: string, password: string) =>
      request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        requiresAuth: false,
      }),

    refresh: (refreshToken: string) =>
      request('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        requiresAuth: false,
      }),

    me: () => request('/api/auth/me', { method: 'GET' }),

    logout: () => request('/api/auth/logout', { method: 'POST' }),
  },

  // Leads
  leads: {
    list: (params?: Record<string, any>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/api/leads${query}`, { method: 'GET' });
    },

    get: (id: string) => request(`/api/leads/${id}`, { method: 'GET' }),

    create: (data: any) =>
      request('/api/leads', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      request(`/api/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request(`/api/leads/${id}`, { method: 'DELETE' }),

    addNote: (id: string, text: string, author?: string) =>
      request(`/api/leads/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ text, author }),
      }),

    stats: () => request('/api/leads/stats', { method: 'GET' }),
  },

  // Hail
  hail: {
    list: (params?: Record<string, any>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/api/hail${query}`, { method: 'GET' });
    },

    get: (id: string) => request(`/api/hail/${id}`, { method: 'GET' }),

    stats: () => request('/api/hail/stats', { method: 'GET' }),

    counties: () => request('/api/hail/counties', { method: 'GET' }),
  },

  // Skip Tracing
  skiptrace: {
    single: (leadId: string, propertyAddress: string, name: string) =>
      request('/api/skiptrace', {
        method: 'POST',
        body: JSON.stringify({ leadId, propertyAddress, name }),
      }),

    batch: (leadIds: string[]) =>
      request('/api/skiptrace/batch', {
        method: 'POST',
        body: JSON.stringify({ leadIds }),
      }),

    batchStatus: (batchId: string) =>
      request(`/api/skiptrace/batch/${batchId}`, { method: 'GET' }),
  },

  // Campaigns
  campaigns: {
    list: (params?: Record<string, any>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/api/campaigns${query}`, { method: 'GET' });
    },

    create: (data: any) =>
      request('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    launch: (id: string) =>
      request(`/api/campaigns/${id}/launch`, { method: 'POST' }),
  },

  // GoHighLevel
  ghl: {
    syncContact: (leadId: string, contact: any) =>
      request('/api/ghl/sync/contact', {
        method: 'POST',
        body: JSON.stringify({ leadId, contact }),
      }),

    batchSync: (leadIds: string[]) =>
      request('/api/ghl/sync/batch', {
        method: 'POST',
        body: JSON.stringify({ leadIds }),
      }),

    logs: () => request('/api/ghl/sync/logs', { method: 'GET' }),
  },

  // Stats
  stats: {
    dashboard: () => request('/api/stats/dashboard', { method: 'GET' }),
  },
};

export default api;
