const express = require('express');
const router = express.Router();
const { login, getMe, register, sendInvite, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect, admin } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/register', register); // Now public with invite code
router.post('/invite', protect, admin, sendInvite); // Admin sends invite
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
