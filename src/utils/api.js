import { APP_CONFIG } from '../config.js';

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${APP_CONFIG.apiBaseUrl}${path}`, {
      credentials: 'include',
      headers: { Accept: 'application/json', ...options.headers },
      ...options,
    });
  } catch {
    throw new ApiError('Unable to reach the service. Please try again.');
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(body.message || 'The request could not be completed.', response.status);
  }
  return body;
}

export const Api = {
  getSession: () => request('/auth/session'),
  login: (email, password) => request('/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
  }),
  register: (name, email, password) => request('/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }),
  }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getInterests: () => request('/interests'),
  saveInterests: (interestIds) => request('/interests', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ interestIds }),
  }),
  getJobs: () => request('/jobs'),
};
