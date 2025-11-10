const express = require('express');
const { getStreamToken, initiateEmergencyCall } = require('../controllers/callController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Get GetStream token for authenticated user
router.get('/token', protect, getStreamToken);

// Initiate emergency call
router.post('/emergency', protect, initiateEmergencyCall);

module.exports = router;
