const Comment = require('../models/comment');
const Post = require('../models/post');
const { sendNewCommentEmail } = require('../services/emailService');

const createComment = async (req, res) => {
    try {
        const { content, postId, parentCommentId } = req.body;
        const userId = req.user._id;

        const post = await Post.findById(postId).populate('user', 'firstName lastName email');
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (parentCommentId) {
            const parentComment = await Comment.findById(parentCommentId);
            if (!parentComment) {
                return res.status(404).json({ error: 'Parent comment not found' });
            }
            if (parentComment.post.toString() !== postId) {
                return res.status(400).json({ error: 'Parent comment does not belong to this post' });
            }
        }

        const comment = new Comment({
            content,
            user: userId,
            post: postId,
            parentComment: parentCommentId || null
        });

        await comment.save();
        await comment.populate('user', 'firstName lastName email');

        if (post.user._id.toString() !== userId.toString()) {
            try {
                await sendNewCommentEmail(
                    post.user.email,
                    post.user.firstName,
                    comment.user.firstName,
                    post.title,
                    content
                );
            } catch (emailError) {
                console.error('Failed to send comment notification email:', emailError);
            }
        }

        const commentObj = comment.toObject();
        commentObj.isLiked = false;

        res.status(201).json({
            message: 'Comment created successfully',
            comment: commentObj
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getCommentsByPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user ? req.user._id : null;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const comments = await Comment.find({ 
            post: postId, 
            parentComment: null 
        })
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        const commentsWithReplies = await Promise.all(
            comments.map(async (comment) => {
                const replies = await Comment.find({ parentComment: comment._id })
                    .populate('user', 'firstName lastName email')
                    .sort({ createdAt: 1 });
                
                const commentObj = comment.toObject();
                commentObj.replies = replies;
                return commentObj;
            })
        );

        const commentsWithLikes = commentsWithReplies.map(comment => {
            if (userId) {
                comment.isLiked = comment.likes && comment.likes.some(likeId => likeId.toString() === userId.toString());
            } else {
                comment.isLiked = false;
            }
            
            if (comment.replies && comment.replies.length > 0) {
                comment.replies = comment.replies.map(reply => {
                    const replyObj = reply.toObject ? reply.toObject() : reply;
                    if (userId) {
                        replyObj.isLiked = reply.likes && reply.likes.some(likeId => likeId.toString() === userId.toString());
                    } else {
                        replyObj.isLiked = false;
                    }
                    return replyObj;
                });
            }
            
            return comment;
        });

        const totalComments = await Comment.countDocuments({ post: postId });

        res.json({
            comments: commentsWithLikes,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalComments / limit),
                totalComments,
                hasMore: page * limit < totalComments
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.user._id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.user.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'You can only edit your own comments' });
        }

        comment.content = content;
        comment.isEdited = true;
        comment.editedAt = new Date();
        await comment.save();

        await comment.populate('user', 'firstName lastName email');

        const commentObj = comment.toObject();
        commentObj.isLiked = comment.likes.some(likeId => likeId.toString() === userId.toString());

        res.json({
            message: 'Comment updated successfully',
            comment: commentObj
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user._id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.user.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'You can only delete your own comments' });
        }

        await Comment.findByIdAndDelete(commentId);
        await Comment.deleteMany({ parentComment: commentId });

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const toggleCommentLike = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user._id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        const userLikedIndex = comment.likes.findIndex(likeId => likeId.toString() === userId.toString());
        
        if (userLikedIndex > -1) {
            comment.likes.splice(userLikedIndex, 1);
        } else {
            comment.likes.push(userId);
        }

        await comment.save();

        res.json({
            message: userLikedIndex > -1 ? 'Comment unliked' : 'Comment liked',
            likesCount: comment.likes.length,
            isLiked: userLikedIndex === -1
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createComment,
    getCommentsByPost,
    updateComment,
    deleteComment,
    toggleCommentLike
};
