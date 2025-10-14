const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadMiddleware, uploadToImgbb } = require('../controllers/uploadController');

router.post('/', protect, uploadMiddleware, uploadToImgbb);

module.exports = router; 