const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Admin routes
router.get('/admin/users', userController.getAllUsers);
router.get('/admin/users/:id', userController.getUserById);
router.delete('/admin/users/:id', userController.deleteUser);

// SOS
router.post('/sos', protect, userController.setSOS);

// Get current user profile
router.get('/me', protect, userController.getCurrentUser);

module.exports = router; 