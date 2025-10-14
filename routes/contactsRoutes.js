const express = require('express');
const router = express.Router();
const contactsController = require('../controllers/contactsController');
const { protect } = require('../middleware/authMiddleware');

// Sync contacts
router.post('/sync', protect, contactsController.syncContacts);

// Emergency contacts
router.post('/emergency', protect, contactsController.addOrRemoveEmergencyContact);
router.get('/emergency', protect, contactsController.getEmergencyContacts);

// My People
router.get('/my-people', protect, contactsController.getMyPeople);
router.get('/registered', protect, contactsController.getRegisteredContacts);

module.exports = router; 