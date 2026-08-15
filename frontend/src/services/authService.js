import { apiRequest } from './api';

export const authService = {
  async register(name, email, password) {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    if (res.token) {
      localStorage.setItem('trailexplorer_token', res.token);
    }
    return res;
  },

  async login(email, password) {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.token) {
      localStorage.setItem('trailexplorer_token', res.token);
    }
    return res;
  },

  async getMe() {
    return await apiRequest('/auth/me');
  },

  logout() {
    localStorage.removeItem('trailexplorer_token');
    return apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
  }
};

export default authService;
