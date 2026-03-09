// routes/withdrawalRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

// All routes require authentication
router.use(authenticate);

// Get all withdrawal requests
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        
        let query = `
            SELECT fw.*, m.member_code, m.full_name, m.current_balance,
                   c.committee_name as requesting_committee
            FROM fund_withdrawals fw
            JOIN members m ON fw.member_id = m.member_id
            JOIN committees c ON fw.requested_by_committee_id = c.committee_id
            WHERE 1=1
        `;
        const params = [];

        // Role-based filtering
        if (req.user.role.startsWith('DEC_') || req.user.role.startsWith('REC_')) {
            query += ' AND fw.requested_by_committee_id = ?';
            params.push(req.user.committee_id);
        }

        if (status) {
            query += ' AND fw.final_status = ?';
            params.push(status);
        }

        query += ' ORDER BY fw.request_date DESC';

        const [withdrawals] = await pool.query(query, params);

        res.json({
            success: true,
            count: withdrawals.length,
            data: withdrawals
        });
    } catch (error) {
        console.error('Get withdrawals error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve withdrawals'
        });
    }
});

// Create withdrawal request
router.post('/',
    authorize('DEC_USER', 'REC_USER', 'ADMIN'),
    auditLog('CREATE', 'fund_withdrawals'),
    async (req, res) => {
        try {
            const { member_id, withdrawal_type, requested_amount, reason } = req.body;

            if (!member_id || !withdrawal_type || !requested_amount) {
                return res.status(400).json({
                    success: false,
                    message: 'Member, type, and amount are required'
                });
            }

            // Get member balance
            const [members] = await pool.query(
                'SELECT current_balance FROM members WHERE member_id = ?',
                [member_id]
            );

            if (members.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Member not found'
                });
            }

            if (parseFloat(requested_amount) > parseFloat(members[0].current_balance)) {
                return res.status(400).json({
                    success: false,
                    message: 'Requested amount exceeds available balance'
                });
            }

            const [result] = await pool.query(`
                INSERT INTO fund_withdrawals 
                (member_id, withdrawal_type, requested_amount, request_date, reason, requested_by_committee_id)
                VALUES (?, ?, ?, CURDATE(), ?, ?)
            `, [member_id, withdrawal_type, requested_amount, reason, req.user.committee_id]);

            res.status(201).json({
                success: true,
                message: 'Withdrawal request created successfully',
                data: {
                    withdrawal_id: result.insertId
                }
            });
        } catch (error) {
            console.error('Create withdrawal error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create withdrawal request'
            });
        }
    }
);

// ZEC approval
router.post('/:id/zec-approve',
    authorize('ZEC_USER', 'ZEC_VERIFIER', 'ADMIN'),
    auditLog('ZEC_APPROVE', 'fund_withdrawals'),
    async (req, res) => {
        try {
            const { status, remarks } = req.body;

            if (!['Approved', 'Rejected'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status'
                });
            }

            await pool.query(`
                UPDATE fund_withdrawals
                SET zec_approved_by = ?,
                    zec_approval_date = NOW(),
                    zec_status = ?,
                    zec_remarks = ?
                WHERE withdrawal_id = ?
            `, [req.user.user_id, status, remarks, req.params.id]);

            res.json({
                success: true,
                message: `Withdrawal ${status.toLowerCase()} by ZEC`
            });
        } catch (error) {
            console.error('ZEC approval error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process ZEC approval'
            });
        }
    }
);

// CEC approval
router.post('/:id/cec-approve',
    authorize('CEC_PRESIDENT', 'CEC_GS', 'CEC_SECRETARY', 'CEC_FINANCE', 'ADMIN'),
    auditLog('CEC_APPROVE', 'fund_withdrawals'),
    async (req, res) => {
        const connection = await pool.getConnection();
        
        try {
            const { status, approved_amount, remarks } = req.body;

            if (!['Approved', 'Rejected'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status'
                });
            }

            await connection.beginTransaction();

            if (status === 'Approved') {
                // Call stored procedure
                await connection.query(
                    'CALL sp_process_withdrawal(?, ?, ?)',
                    [req.params.id, req.user.user_id, approved_amount]
                );
            } else {
                // Just update status if rejected
                await connection.query(`
                    UPDATE fund_withdrawals
                    SET cec_approved_by = ?,
                        cec_approval_date = NOW(),
                        cec_status = ?,
                        cec_remarks = ?,
                        final_status = ?
                    WHERE withdrawal_id = ?
                `, [req.user.user_id, status, remarks, 'Rejected', req.params.id]);
            }

            await connection.commit();

            res.json({
                success: true,
                message: `Withdrawal ${status.toLowerCase()} by CEC`
            });
        } catch (error) {
            await connection.rollback();
            console.error('CEC approval error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to process CEC approval'
            });
        } finally {
            connection.release();
        }
    }
);

module.exports = router;
