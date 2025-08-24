const Like = require('../models/like');
const Post = require('../models/post');

const togglePostLike = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const existingLike = await Like.findOne({ user: userId, post: postId });

        if (existingLike) {
            await Like.findByIdAndDelete(existingLike._id);
            const likesCount = await Like.countDocuments({ post: postId });
            
            res.json({
                message: 'Post unliked successfully',
                isLiked: false,
                likesCount
            });
        } else {
            await Like.create({ user: userId, post: postId });
            const likesCount = await Like.countDocuments({ post: postId });
            
            res.json({
                message: 'Post liked successfully',
                isLiked: true,
                likesCount
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPostLikes = async (req, res) => {
    try {
        const { postId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const likes = await Like.find({ post: postId })
            .populate('user', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalLikes = await Like.countDocuments({ post: postId });

        res.json({
            likes,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalLikes / limit),
                totalLikes,
                hasMore: page * limit < totalLikes
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const checkUserLikedPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        const like = await Like.findOne({ user: userId, post: postId });
        const likesCount = await Like.countDocuments({ post: postId });

        res.json({
            isLiked: !!like,
            likesCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    togglePostLike,
    getPostLikes,
    checkUserLikedPost
};
