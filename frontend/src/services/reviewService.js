import { apiRequest } from './api';

export const reviewService = {
  async getTrailReviews(trailId) {
    return await apiRequest(`/trails/${trailId}/reviews`);
  },

  async createReview(trailId, reviewData) {
    return await apiRequest(`/trails/${trailId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  },

  async updateReview(reviewId, reviewData) {
    return await apiRequest(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(reviewData)
    });
  },

  async deleteReview(reviewId) {
    return await apiRequest(`/reviews/${reviewId}`, {
      method: 'DELETE'
    });
  }
};

export default reviewService;
