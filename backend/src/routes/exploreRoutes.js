const express = require('express');
const router = express.Router();
const {
  searchCityTrails,
  getNearbyTrailsDynamic
} = require('../controllers/exploreController');

// Dynamic geographic exploration routes
router.get('/search', searchCityTrails);
router.get('/nearby', getNearbyTrailsDynamic);

module.exports = router;
