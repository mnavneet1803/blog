const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { auth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const { 
    checkCategoryHasPosts, 
    checkCategoryHasPostsForStatusToggle 
} = require('../middleware/categoryProtection');

router.get('/active', categoryController.getActiveCategories);

router.get('/', auth, categoryController.getAllCategories);

router.post('/', auth, requireAdmin, categoryController.createCategory);
router.put('/:id', auth, requireAdmin, categoryController.updateCategory);
router.patch('/:id/toggle-status', auth, requireAdmin, checkCategoryHasPostsForStatusToggle, categoryController.toggleCategoryStatus);
router.delete('/:id', auth, requireAdmin, checkCategoryHasPosts, categoryController.deleteCategory);

module.exports = router;
