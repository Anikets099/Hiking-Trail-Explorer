const express = require('express');
const router = express.Router();
const {
  getFavorites,
  addFavorite,
  removeFavorite
} = require('../controllers/favoriteController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.use(authenticateUser);

router.get('/', getFavorites);
router.post('/', addFavorite);
router.post('/:trailId', addFavorite);
router.delete('/:trailId', removeFavorite);

module.exports = router;
