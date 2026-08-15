const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleware');
const {
  getCompletions,
  markCompleted,
  removeCompletion,
  checkCompletion
} = require('../controllers/completionController');

// All completion routes are protected by JWT authentication
router.use(authenticateUser);

router.route('/')
  .get(getCompletions)
  .post(markCompleted);

router.route('/check/:trailId')
  .get(checkCompletion);

router.route('/:trailId')
  .post(markCompleted)
  .delete(removeCompletion);

module.exports = router;
