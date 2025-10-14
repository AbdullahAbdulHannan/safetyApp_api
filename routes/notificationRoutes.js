const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Add notification
router.post('/', protect, notificationController.addNotification);
// Get notifications
router.get('/', protect, notificationController.getNotifications);
// Delete notification
router.delete('/:id', protect, notificationController.deleteNotification);

module.exports = router; 