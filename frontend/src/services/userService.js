import { apiRequest } from './api';

export const userService = {
  async getUserProfile() {
    return await apiRequest('/users/me');
  },

  async updateUserProfile(profileData) {
    return await apiRequest('/users/me', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  async getExploredTrails() {
    return await apiRequest('/users/me/explored');
  },

  async getUserReviews() {
    return await apiRequest('/users/me/reviews');
  },

  async recordTrailExplored(trailId, trailData = {}) {
    return await apiRequest(`/users/explored/${trailId}`, {
      method: 'POST',
      body: JSON.stringify(trailData)
    });
  },

  async uploadProfilePhoto(file) {
    const formData = new FormData();
    formData.append('profileImage', file);

    return await apiRequest('/users/me/profile-image', {
      method: 'POST',
      body: formData
    });
  },

  async deleteProfilePhoto() {
    return await apiRequest('/users/me/profile-image', {
      method: 'DELETE'
    });
  }
};

export default userService;
