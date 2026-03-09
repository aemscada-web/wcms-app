// middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Verify JWT token
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const [users] = await pool.query(
            'SELECT user_id, username, full_name, email, committee_id, role, status FROM users WHERE user_id = ?',
            [decoded.userId]
        );

        if (users.length === 0 || users[0].status !== 'Active') {
            return res.status(401).json({
                success: false,
                message: 'Invalid or inactive user'
            });
        }

        req.user = users[0];
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

// Check user role authorization
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

// Check committee access
const checkCommitteeAccess = async (req, res, next) => {
    try {
        const committeeId = req.params.committeeId || req.body.committee_id;
        
        if (!committeeId) {
            return next();
        }

        // Admin and CEC roles have access to all committees
        if (req.user.role === 'ADMIN' || req.user.role.startsWith('CEC_')) {
            return next();
        }

        // Check if user belongs to the committee or its parent hierarchy
        const [committees] = await pool.query(`
            WITH RECURSIVE committee_hierarchy AS (
                SELECT committee_id, parent_committee_id
                FROM committees
                WHERE committee_id = ?
                UNION ALL
                SELECT c.committee_id, c.parent_committee_id
                FROM committees c
                INNER JOIN committee_hierarchy ch ON c.parent_committee_id = ch.committee_id
            )
            SELECT committee_id FROM committee_hierarchy
        `, [req.user.committee_id]);

        const accessibleCommittees = committees.map(c => c.committee_id);
        
        if (!accessibleCommittees.includes(parseInt(committeeId))) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this committee'
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Authorization error'
        });
    }
};

module.exports = {
    authenticate,
    authorize,
    checkCommitteeAccess
};
