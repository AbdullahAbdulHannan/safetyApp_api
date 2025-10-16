const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
// Admin routes
router.get('/admin/users', userController.getAllUsers);
router.get('/admin/users/:id', userController.getUserById);
router.delete('/admin/users/:id', userController.deleteUser);

// SOS
router.post('/sos', protect, userController.setSOS);

// Get current user profile
router.get('/me', protect, userController.getCurrentUser);

//Search
// In your user routes file (e.g., routes/userRoutes.js)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullname: { $regex: q, $options: 'i' } }
      ]
    }).select('_id username fullname profileImage');

    res.json(users);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Error searching users' });
  }
});
module.exports = router; 