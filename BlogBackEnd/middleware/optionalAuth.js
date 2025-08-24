const optionalAuth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        req.user = null;
        return next();
    }
    
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require('../models/user');
        User.findById(decoded.userId).then(user => {
            if (user) {
                req.user = user;
            } else {
                req.user = null;
            }
            next();
        }).catch(() => {
            req.user = null;
            next();
        });
    } catch (error) {
        req.user = null;
        next();
    }
};

module.exports = { optionalAuth };
