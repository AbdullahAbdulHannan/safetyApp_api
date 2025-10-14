const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.post('/change-password', protect, authController.changePassword);
router.put('/update-profile', protect, authController.updateProfile);
router.get('/check-username', authController.checkUsername);
router.get('/check-phone', authController.checkPhone);

module.exports = router; 