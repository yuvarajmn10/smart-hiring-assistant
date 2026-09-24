const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
// ↑ protect runs first — if token valid, getMe runs next
// protect is the "security guard", getMe is the "room inside"
module.exports = router;