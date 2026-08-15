const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
  deleteProfilePhoto,
  recordTrailExplored,
  getExploredTrails,
  getUserReviews
} = require('../controllers/userController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { uploadProfileImage } = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/rateLimitMiddleware');

router.use(authenticateUser);

router.get('/me', getUserProfile);
router.get('/me/explored', getExploredTrails);
router.get('/me/reviews', getUserReviews);
router.put('/me', updateUserProfile);
router.post('/explored/:trailId', recordTrailExplored);
router.post('/me/profile-image', uploadLimiter, uploadProfileImage.single('profileImage'), uploadProfilePhoto);
router.delete('/me/profile-image', deleteProfilePhoto);

module.exports = router;
