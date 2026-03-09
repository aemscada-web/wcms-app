// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

// Public routes
router.post('/login', authController.login);

// Protected routes
router.post('/logout', authenticate, auditLog('LOGOUT'), authController.logout);
router.post('/change-password', authenticate, auditLog('PASSWORD_CHANGE', 'users'), authController.changePassword);
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
