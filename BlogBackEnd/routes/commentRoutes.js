const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/optionalAuth');
const {
    createComment,
    getCommentsByPost,
    updateComment,
    deleteComment,
    toggleCommentLike
} = require('../controllers/commentController');

router.get('/post/:postId', optionalAuth, getCommentsByPost);
router.post('/', auth, createComment);
router.put('/:commentId', auth, updateComment);
router.delete('/:commentId', auth, deleteComment);
router.post('/:commentId/like', auth, toggleCommentLike);

module.exports = router;
