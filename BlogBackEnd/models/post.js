const mongoose = require('mongoose');
const User = require('./user');
const Category = require('./category');

const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
};

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        unique: true,
        index: true
    },
    body: {
        type: String,
        required: true,
    },
    img: {
        type: String,
        required: false,
    },
    images: [{
        type: String,
        required: false,
    }],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    isPinned: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

postSchema.virtual('likesCount', {
    ref: 'Like',
    localField: '_id',
    foreignField: 'post',
    count: true
});

postSchema.virtual('commentsCount', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'post',
    count: true
});

postSchema.pre('save', async function(next) {
    if (this.isNew || this.isModified('title')) {
        let baseSlug = generateSlug(this.title);
        let slug = baseSlug;
        let counter = 1;
        
        while (await this.constructor.findOne({ slug: slug, _id: { $ne: this._id } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        
        this.slug = slug;
    }
    next();
});

const Post = mongoose.model("Post", postSchema);
module.exports = Post;