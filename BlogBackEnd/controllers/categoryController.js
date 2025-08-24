const Category = require('../models/category');

const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ title: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getActiveCategories = async (req, res) => {
    try {
        const categories = await Category.find({ 
            isActive: true, 
        }).sort({ title: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createCategory = async (req, res) => {
    try {
        const { title, isActive } = req.body;

        const existingCategory = await Category.findOne({ title: title.trim() });
        if (existingCategory) {
            return res.status(400).json({ error: 'Category with this title already exists' });
        }

        const newCategory = new Category({
            title: title.trim(),
            isActive: isActive !== undefined ? isActive : true
        });

        const savedCategory = await newCategory.save();
        res.status(201).json({
            message: 'Category created successfully',
            category: savedCategory
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, isActive } = req.body;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        if (title && title.trim() !== category.title) {
            const existingCategory = await Category.findOne({ title: title.trim() });
            if (existingCategory) {
                return res.status(400).json({ error: 'Category with this title already exists' });
            }
        }

        if (title) category.title = title.trim();
        if (isActive !== undefined) category.isActive = isActive;

        const updatedCategory = await category.save();
        res.json({
            message: 'Category updated successfully',
            category: updatedCategory
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        await Category.findByIdAndDelete(id);
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const toggleCategoryStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        category.isActive = !category.isActive;
        const updatedCategory = await category.save();

        res.json({
            message: 'Category status updated successfully',
            category: updatedCategory
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllCategories,
    getActiveCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus
};
