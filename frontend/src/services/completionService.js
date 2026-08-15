import { apiRequest } from './api';

export const completionService = {
  // Get all completed trails & unlocked achievement badges for logged-in user
  async getCompletions() {
    return await apiRequest('/completions');
  },

  // Mark trail as completed
  async markCompleted(trailId, trailData = {}) {
    return await apiRequest(`/completions/${trailId}`, {
      method: 'POST',
      body: JSON.stringify(trailData)
    });
  },

  // Remove trail completion
  async removeCompletion(trailId) {
    return await apiRequest(`/completions/${trailId}`, {
      method: 'DELETE'
    });
  },

  // Check if a trail is completed by current user
  async checkCompletion(trailId) {
    return await apiRequest(`/completions/check/${trailId}`);
  }
};

export default completionService;
