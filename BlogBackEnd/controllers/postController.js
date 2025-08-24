const Post = require('../models/post');
const Like = require('../models/like');
const Comment = require('../models/comment');
const Category = require('../models/category');
const { sendPostApprovedEmail } = require('../services/emailService');

const uploadImage = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }
        
        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ 
            message: 'Image uploaded successfully',
            imageUrl: imageUrl 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const uploadMultipleImages = (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No image files provided' });
        }
        
        const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
        res.json({ 
            message: 'Images uploaded successfully',
            imageUrls: imageUrls 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createPost = async (req, res) => {
    try {
        const { title, body, img, images, category, isPinned } = req.body;
        
        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }
        
        if (!body || !body.trim()) {
            return res.status(400).json({ error: 'Content is required' });
        }
        
        const canPin = req.user.role === 'admin' || req.user.role === 'Admin';
        const isAdmin = req.user.role === 'admin' || req.user.role === 'Admin';
        const finalIsPinned = canPin ? isPinned : false;
        
        
        const hasImages = (img && img.trim()) || (images && images.length > 0);
        if (!finalIsPinned && !hasImages) {
            return res.status(400).json({ error: 'At least one image is required' });
        }
        
        let finalCategory = category;
        if (finalIsPinned) {
            const importantCategory = await Category.findOne({ title: 'Important' });
            if (importantCategory) {
                finalCategory = importantCategory._id;
            } else {
                const newImportantCategory = new Category({
                    title: 'Important',
                    isActive: true
                });
                const savedCategory = await newImportantCategory.save();
                finalCategory = savedCategory._id;
            }
        } else if (!category) {
            return res.status(400).json({ error: 'Category is required' });
        }
        
        const postData = {
            title,
            body,
            user: req.user._id,
            category: finalCategory,
            isPinned: finalIsPinned,
            isActive: isAdmin 
        };
        
        if (images && images.length > 0) {
            postData.images = images;
            postData.img = images[0];
        } else if (img && img.trim()) {
            postData.img = img;
            postData.images = [img];
        }
        
        const newPost = new Post(postData);
        
        const savedPost = await newPost.save();
        await savedPost.populate([
            { path: 'user', select: 'firstName lastName email' },
            { path: 'category', select: 'title isActive' }
        ]);
        
        const responseData = {
            post: savedPost,
            message: isAdmin 
                ? 'Post created and published successfully!' 
                : 'Post created successfully! It will be visible after admin approval.'
        };
        
        res.status(201).json(responseData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllPosts = async (req, res) => {
    try {
        const { category, page = 1, limit = 5 } = req.query;
        const userId = req.user ? req.user._id : null;
        let filter = { isActive: true };
        
        if (category) {
            filter.category = category;
        }
        
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skipNumber = (pageNumber - 1) * limitNumber;
        
        const totalPosts = await Post.countDocuments(filter);
        const totalPages = Math.ceil(totalPosts / limitNumber);
        
        const posts = await Post.find(filter)
            .populate('user', 'firstName lastName email')
            .populate('category', 'title isActive')
            .sort({ isPinned: -1, createdAt: -1 })
            .skip(skipNumber)
            .limit(limitNumber);
        
        const postsWithLikes = await Promise.all(posts.map(async (post) => {
            const postObj = post.toObject();
            if (postObj.category && !postObj.category.isActive) {
                postObj.category = null;
            }
            
            const likesCount = await Like.countDocuments({ post: post._id });
            const commentsCount = await Comment.countDocuments({ post: post._id });
            postObj.likesCount = likesCount;
            postObj.commentsCount = commentsCount;
            
            if (userId) {
                const userLike = await Like.findOne({ user: userId, post: post._id });
                const userComment = await Comment.findOne({ user: userId, post: post._id });
                postObj.isLiked = !!userLike;
                postObj.hasCommented = !!userComment;
            } else {
                postObj.isLiked = false;
                postObj.hasCommented = false;
            }
            
            return postObj;
        }));
        
        res.json({
            posts: postsWithLikes,
            pagination: {
                currentPage: pageNumber,
                totalPages: totalPages,
                totalPosts: totalPosts,
                hasNextPage: pageNumber < totalPages,
                hasPrevPage: pageNumber > 1,
                limit: limitNumber
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserPosts = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 6 } = req.query;
        
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skipNumber = (pageNumber - 1) * limitNumber;
        
        const filter = { user: userId };
        const totalPosts = await Post.countDocuments(filter);
        const totalPages = Math.ceil(totalPosts / limitNumber);
        
        const posts = await Post.find(filter)
            .populate('user', 'firstName lastName email')
            .populate('category', 'title isActive')
            .sort({ createdAt: -1 })
            .skip(skipNumber)
            .limit(limitNumber);
        
        const postsWithLikes = await Promise.all(posts.map(async (post) => {
            const postObj = post.toObject();
            if (postObj.category && !postObj.category.isActive) {
                postObj.category = null;
            }
            
            const likesCount = await Like.countDocuments({ post: post._id });
            const commentsCount = await Comment.countDocuments({ post: post._id });
            postObj.likesCount = likesCount;
            postObj.commentsCount = commentsCount;
            
            const userLike = await Like.findOne({ user: userId, post: post._id });
            const userComment = await Comment.findOne({ user: userId, post: post._id });
            postObj.isLiked = !!userLike;
            postObj.hasCommented = !!userComment;
            
            return postObj;
        }));
        
        res.json({
            posts: postsWithLikes,
            pagination: {
                currentPage: pageNumber,
                totalPages: totalPages,
                totalPosts: totalPosts,
                hasNextPage: pageNumber < totalPages,
                hasPrevPage: pageNumber > 1,
                limit: limitNumber
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPostById = async (req, res) => {
    try {
        const userId = req.user ? req.user._id : null;
        const post = await Post.findById(req.params.id)
            .populate('user', 'firstName lastName email')
            .populate('category', 'title isActive');
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        const postObj = post.toObject();
        if (postObj.category && !postObj.category.isActive) {
            postObj.category = null;
        }
        
        const likesCount = await Like.countDocuments({ post: post._id });
        const commentsCount = await Comment.countDocuments({ post: post._id });
        postObj.likesCount = likesCount;
        postObj.commentsCount = commentsCount;
        
        if (userId) {
            const userLike = await Like.findOne({ user: userId, post: post._id });
            postObj.isLiked = !!userLike;
        } else {
            postObj.isLiked = false;
        }
        
        res.json(postObj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPostBySlug = async (req, res) => {
    try {
        const userId = req.user ? req.user._id : null;
        const post = await Post.findOne({ slug: req.params.slug })
            .populate('user', 'firstName lastName email')
            .populate('category', 'title isActive');
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        const postObj = post.toObject();
        if (postObj.category && !postObj.category.isActive) {
            postObj.category = null;
        }
        
        const likesCount = await Like.countDocuments({ post: post._id });
        const commentsCount = await Comment.countDocuments({ post: post._id });
        postObj.likesCount = likesCount;
        postObj.commentsCount = commentsCount;
        
        if (userId) {
            const userLike = await Like.findOne({ user: userId, post: post._id });
            postObj.isLiked = !!userLike;
        } else {
            postObj.isLiked = false;
        }
        
        res.json(postObj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updatePost = async (req, res) => {
    try {
        const { title, body, img, category, images, isPinned } = req.body;
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
    
        const isOwner = post.user.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Not authorized to update this post' });
        }

        if (isPinned !== undefined) {
            if (isPinned && !isAdmin) {
                return res.status(403).json({ error: 'Only admins can pin posts' });
            }
            post.isPinned = isPinned;
            
            if (isPinned) {
                const importantCategory = await Category.findOne({ title: { $regex: /^important$/i } });
                if (importantCategory) {
                    post.category = importantCategory._id;
                }
            }
        }

        if (title) post.title = title;
        if (body) post.body = body;
        if (img !== undefined) {
            if ((img === '' || img === null) && !post.isPinned) {
                return res.status(400).json({ error: 'Image is required and cannot be empty' });
            }
            post.img = img;
        }
        if (images !== undefined) {
            if ((!images || images.length === 0) && !post.isPinned) {
                return res.status(400).json({ error: 'At least one image is required' });
            }
            post.images = images;
        }
        
    
        if (category && !post.isPinned) {
            post.category = category;
        }

        const updatedPost = await post.save();
        await updatedPost.populate([
            { path: 'user', select: 'firstName lastName email' },
            { path: 'category', select: 'title isActive' }
        ]);
        
        res.json(updatedPost);
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ error: error.message });
    }
};

const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
    
        const isOwner = post.user.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Not authorized to delete this post' });
        }
        
        await Comment.deleteMany({ post: req.params.id });
        await Like.deleteMany({ post: req.params.id });
        await Post.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPopularPosts = async (req, res) => {
    try {
        const { period = 'week', limit = 5 } = req.query;
        const userId = req.user?._id;
        
        const now = new Date();
        let startDate;
        
        switch (period) {
            case 'day':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        const popularPosts = await Post.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    isActive: true
                }
            },
            {
                $lookup: {
                    from: 'likes',
                    localField: '_id',
                    foreignField: 'post',
                    as: 'likes'
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'post',
                    as: 'comments'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $addFields: {
                    likesCount: { $size: '$likes' },
                    commentsCount: { $size: '$comments' },
                    isLiked: userId ? { $in: [userId, '$likes.user'] } : false,
                    user: { $arrayElemAt: ['$user', 0] },
                    category: { $arrayElemAt: ['$category', 0] }
                }
            },
            {
                $project: {
                    title: 1,
                    body: 1,
                    img: 1,
                    slug: 1,
                    createdAt: 1,
                    likesCount: 1,
                    commentsCount: 1,
                    isLiked: 1,
                    user: {
                        _id: 1,
                        firstName: 1,
                        lastName: 1,
                        email: 1
                    },
                    category: {
                        _id: 1,
                        title: 1,
                        isActive: 1
                    }
                }
            },
            {
                $sort: { likesCount: -1, createdAt: -1 }
            },
            {
                $limit: parseInt(limit)
            }
        ]);

        res.json(popularPosts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllPostsAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'all' } = req.query;
        const userId = req.user ? req.user._id : null;
        let filter = {};
        
        if (status === 'active') {
            filter.isActive = true;
        } else if (status === 'inactive') {
            filter.isActive = false;
        }
        
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skipNumber = (pageNumber - 1) * limitNumber;
        
        const totalPosts = await Post.countDocuments(filter);
        const totalPages = Math.ceil(totalPosts / limitNumber);
        
        const posts = await Post.find(filter)
            .populate('user', 'firstName lastName email')
            .populate('category', 'title isActive')
            .sort({ isPinned: -1, createdAt: -1 })
            .skip(skipNumber)
            .limit(limitNumber);
        
        const postsWithLikes = await Promise.all(posts.map(async (post) => {
            const postObj = post.toObject();
            if (postObj.category && !postObj.category.isActive) {
                postObj.category = null;
            }
            
            const likesCount = await Like.countDocuments({ post: post._id });
            const commentsCount = await Comment.countDocuments({ post: post._id });
            postObj.likesCount = likesCount;
            postObj.commentsCount = commentsCount;
            
            if (userId) {
                const userLike = await Like.findOne({ user: userId, post: post._id });
                postObj.isLiked = !!userLike;
            } else {
                postObj.isLiked = false;
            }
            
            return postObj;
        }));
        
        res.json({
            posts: postsWithLikes,
            pagination: {
                currentPage: pageNumber,
                totalPages: totalPages,
                totalPosts: totalPosts,
                hasNextPage: pageNumber < totalPages,
                hasPrevPage: pageNumber > 1,
                limit: limitNumber
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const togglePostStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        const wasInactive = !post.isActive;
        post.isActive = !post.isActive;
        await post.save();
        
        await post.populate([
            { path: 'user', select: 'firstName lastName email' },
            { path: 'category', select: 'title isActive' }
        ]);
        

        if (wasInactive && post.isActive) {
            try {
                await sendPostApprovedEmail(
                    post.user.email,
                    post.user.firstName,
                    post.title
                );
            } catch (emailError) {
                console.error('Failed to send post approval email:', emailError);
            }
        }
        
        res.json({
            message: `Post ${post.isActive ? 'activated' : 'deactivated'} successfully`,
            post: post
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPendingPosts = async (req, res) => {
    try {
        const { page = 1, limit = 6 } = req.query;
        const userId = req.user ? req.user._id : null;
        let filter = { isActive: false };
        
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skipNumber = (pageNumber - 1) * limitNumber;
        
        const totalPosts = await Post.countDocuments(filter);
        const totalPages = Math.ceil(totalPosts / limitNumber);
        
        const posts = await Post.find(filter)
            .populate('user', 'firstName lastName email')
            .populate('category', 'title isActive')
            .sort({ createdAt: -1 }) // Show newest first
            .skip(skipNumber)
            .limit(limitNumber);
        
        const postsWithLikes = await Promise.all(posts.map(async (post) => {
            const postObj = post.toObject();
            if (postObj.category && !postObj.category.isActive) {
                postObj.category = null;
            }
            
            const likesCount = await Like.countDocuments({ post: post._id });
            const commentsCount = await Comment.countDocuments({ post: post._id });
            postObj.likesCount = likesCount;
            postObj.commentsCount = commentsCount;
            
            if (userId) {
                const userLike = await Like.findOne({ user: userId, post: post._id });
                postObj.isLiked = !!userLike;
            } else {
                postObj.isLiked = false;
            }
            
            return postObj;
        }));
        
        res.json({
            posts: postsWithLikes,
            pagination: {
                currentPage: pageNumber,
                totalPages: totalPages,
                totalPosts: totalPosts,
                hasNextPage: pageNumber < totalPages,
                hasPrevPage: pageNumber > 1,
                limit: limitNumber
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const approvePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        if (post.isActive) {
            return res.status(400).json({ error: 'Post is already approved' });
        }
        
        post.isActive = true;
        await post.save();
        
        await post.populate([
            { path: 'user', select: 'firstName lastName email' },
            { path: 'category', select: 'title isActive' }
        ]);

        try {
            await sendPostApprovedEmail(
                post.user.email,
                post.user.firstName,
                post.title
            );
        } catch (emailError) {
            console.error('Failed to send post approval email:', emailError);
        }
        
        res.json({
            message: 'Post approved successfully',
            post: post
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    uploadImage,
    uploadMultipleImages,
    createPost,
    getAllPosts,
    getUserPosts,
    getPostById,
    getPostBySlug,
    updatePost,
    deletePost,
    getPopularPosts,
    getAllPostsAdmin,
    togglePostStatus,
    getPendingPosts,
    approvePost
};
