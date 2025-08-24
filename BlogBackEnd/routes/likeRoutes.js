const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
    togglePostLike,
    getPostLikes,
    checkUserLikedPost
} = require('../controllers/likeController');

router.post('/post/:postId', auth, togglePostLike);
router.get('/post/:postId', getPostLikes);
router.get('/post/:postId/status', auth, checkUserLikedPost);

module.exports = router;
