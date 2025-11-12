// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // attach minimal user info; fetch full user if needed
        req.user = { id: decoded.id, role: decoded.role };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token is not valid' });
    }
};

// Role-check middleware factory
const permit = (...allowed) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
        if (!allowed.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
        next();
    };
};

module.exports = { auth, permit };
