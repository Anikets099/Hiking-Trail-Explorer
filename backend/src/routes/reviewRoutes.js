const express = require('express');
const router = express.Router();
const {
  getTrailReviews,
  createReview,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const { authenticateUser } = require('../middleware/authMiddleware');

// Get & add reviews for a trail
router.get('/trails/:trailId/reviews', getTrailReviews);
router.post('/trails/:trailId/reviews', authenticateUser, createReview);

// Edit & delete individual review
router.put('/reviews/:reviewId', authenticateUser, updateReview);
router.delete('/reviews/:reviewId', authenticateUser, deleteReview);

module.exports = router;
