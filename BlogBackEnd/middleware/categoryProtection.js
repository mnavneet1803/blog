const Post = require('../models/post');

const checkCategoryHasPosts = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const postCount = await Post.countDocuments({ category: id });
        
        if (postCount > 0) {
            return res.status(400).json({ 
                error: `Cannot delete category. It is currently being used by ${postCount} post${postCount > 1 ? 's' : ''}.`,
                postCount: postCount
            });
        }
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const checkCategoryHasPostsForDeactivation = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const postCount = await Post.countDocuments({ category: id });
        
        if (postCount > 0) {
            return res.status(400).json({ 
                error: `Cannot deactivate category. It is currently being used by ${postCount} post${postCount > 1 ? 's' : ''}.`,
                postCount: postCount
            });
        }
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const checkCategoryHasPostsForStatusToggle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const Category = require('../models/category');
        
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        if (category.isActive) {
            const postCount = await Post.countDocuments({ category: id });
            
            if (postCount > 0) {
                return res.status(400).json({ 
                    error: `Cannot deactivate category. It is currently being used by ${postCount} post${postCount > 1 ? 's' : ''}.`,
                    postCount: postCount,
                    action: 'deactivate'
                });
            }
        }
        
        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    checkCategoryHasPosts,
    checkCategoryHasPostsForDeactivation,
    checkCategoryHasPostsForStatusToggle
};
