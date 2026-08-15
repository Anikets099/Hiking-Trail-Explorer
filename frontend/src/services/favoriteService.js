import { apiRequest } from './api';

export const favoriteService = {
  async getFavorites() {
    return await apiRequest('/favorites');
  },

  async addFavorite(trailId, trailData = {}) {
    return await apiRequest(`/favorites/${trailId}`, {
      method: 'POST',
      body: JSON.stringify(trailData)
    });
  },

  async removeFavorite(trailId) {
    return await apiRequest(`/favorites/${trailId}`, {
      method: 'DELETE'
    });
  }
};

export default favoriteService;
