const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', authenticateUser, getMe);
router.post('/logout', logout);

module.exports = router;
