const express = require('express');
const router = express.Router();
const {
  getTrails,
  getPopularTrails,
  getNearbyTrails,
  getTrailById,
  createTrail,
  updateTrail,
  deleteTrail
} = require('../controllers/trailController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

// Public query routes
router.get('/', getTrails);
router.get('/popular', getPopularTrails);
router.get('/nearby', getNearbyTrails);
router.get('/:id', getTrailById);

// Admin-only management routes
router.post('/', authenticateUser, requireAdmin, createTrail);
router.put('/:id', authenticateUser, requireAdmin, updateTrail);
router.delete('/:id', authenticateUser, requireAdmin, deleteTrail);

module.exports = router;
