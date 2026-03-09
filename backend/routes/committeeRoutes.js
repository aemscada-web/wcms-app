// routes/committeeRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Get all committees
router.get('/', async (req, res) => {
    try {
        const [committees] = await pool.query(`
            SELECT c.*, p.committee_name as parent_name
            FROM committees c
            LEFT JOIN committees p ON c.parent_committee_id = p.committee_id
            WHERE c.status = 'Active'
            ORDER BY c.committee_type, c.committee_name
        `);

        res.json({
            success: true,
            data: committees
        });
    } catch (error) {
        console.error('Get committees error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve committees'
        });
    }
});

module.exports = router;
