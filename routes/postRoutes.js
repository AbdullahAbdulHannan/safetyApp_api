const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

// Create a post
router.post('/', protect, postController.createPost);

// Get all posts
router.get('/', postController.getAllPosts);

// Get posts by user
router.get('/user/:userId', postController.getPostsByUser);

// Like/unlike a post
router.post('/:id/like', protect, postController.toggleLike);

// Add a comment
router.post('/:id/comment', protect, postController.addComment);

module.exports = router; 