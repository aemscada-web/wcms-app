// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Member balance report
router.get('/member-balances', async (req, res) => {
    try {
        const { committee_id, status } = req.query;
        
        let query = 'SELECT * FROM view_member_balance WHERE 1=1';
        const params = [];

        if (committee_id) {
            query += ' AND committee_id = ?';
            params.push(committee_id);
        }

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY committee_name, member_code';

        const [data] = await pool.query(query, params);

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        console.error('Member balance report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate report'
        });
    }
});

// Pending verifications report (ZEC)
router.get('/pending-verifications',
    authorize('ZEC_USER', 'ZEC_VERIFIER', 'CEC_PRESIDENT', 'CEC_GS', 'ADMIN'),
    async (req, res) => {
        try {
            const [data] = await pool.query('SELECT * FROM view_pending_verifications');

            res.json({
                success: true,
                count: data.length,
                data
            });
        } catch (error) {
            console.error('Pending verifications report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate report'
            });
        }
    }
);

// Pending CEC approvals report
router.get('/pending-cec-approvals',
    authorize('CEC_PRESIDENT', 'CEC_GS', 'CEC_SECRETARY', 'CEC_FINANCE', 'ADMIN'),
    async (req, res) => {
        try {
            const [data] = await pool.query('SELECT * FROM view_pending_cec_approvals');

            res.json({
                success: true,
                count: data.length,
                data
            });
        } catch (error) {
            console.error('Pending CEC approvals report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate report'
            });
        }
    }
);

// Withdrawal requests report
router.get('/withdrawal-requests', async (req, res) => {
    try {
        const { final_status } = req.query;
        
        let query = 'SELECT * FROM view_withdrawal_requests WHERE 1=1';
        const params = [];

        if (final_status) {
            query += ' AND final_status = ?';
            params.push(final_status);
        }

        query += ' ORDER BY request_date DESC';

        const [data] = await pool.query(query, params);

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        console.error('Withdrawal requests report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate report'
        });
    }
});

// Suspense fund balance
router.get('/suspense-balance',
    authorize('CEC_PRESIDENT', 'CEC_GS', 'CEC_SECRETARY', 'CEC_FINANCE', 'ADMIN'),
    async (req, res) => {
        try {
            const [data] = await pool.query('SELECT * FROM view_suspense_balance');

            res.json({
                success: true,
                data: data[0]
            });
        } catch (error) {
            console.error('Suspense balance report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate report'
            });
        }
    }
);

// Committee-wise contribution summary
router.get('/committee-summary', async (req, res) => {
    try {
        const { year } = req.query;
        const currentYear = year || new Date().getFullYear();

        const [data] = await pool.query(`
            SELECT 
                c.committee_name,
                c.committee_type,
                COUNT(DISTINCT m.member_id) as total_members,
                COUNT(DISTINCT md.member_id) as contributing_members,
                SUM(md.deduction_amount) as total_contributions,
                AVG(md.deduction_amount) as avg_contribution
            FROM committees c
            LEFT JOIN members m ON c.committee_id = m.committee_id AND m.status = 'Active'
            LEFT JOIN monthly_deductions md ON m.member_id = md.member_id 
                AND YEAR(md.deduction_month) = ? 
                AND md.status = 'Approved'
            WHERE c.status = 'Active'
            GROUP BY c.committee_id
            ORDER BY c.committee_type, c.committee_name
        `, [currentYear]);

        res.json({
            success: true,
            year: currentYear,
            data
        });
    } catch (error) {
        console.error('Committee summary report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate report'
        });
    }
});

// Dashboard statistics
router.get('/dashboard', async (req, res) => {
    try {
        // Total members
        const [totalMembers] = await pool.query(
            'SELECT COUNT(*) as count FROM members WHERE status = "Active"'
        );

        // Total balance
        const [totalBalance] = await pool.query(
            'SELECT SUM(current_balance) as total FROM members WHERE status = "Active"'
        );

        // Pending verifications
        const [pendingVerifications] = await pool.query(
            'SELECT COUNT(*) as count FROM monthly_deductions WHERE status = "Entered"'
        );

        // Pending CEC approvals
        const [pendingApprovals] = await pool.query(
            'SELECT COUNT(*) as count FROM monthly_deductions WHERE status IN ("Verified", "Forwarded")'
        );

        // Pending withdrawals
        const [pendingWithdrawals] = await pool.query(
            'SELECT COUNT(*) as count FROM fund_withdrawals WHERE final_status = "Pending"'
        );

        // Current month contributions
        const [currentMonth] = await pool.query(`
            SELECT 
                COUNT(DISTINCT member_id) as members,
                SUM(deduction_amount) as amount
            FROM monthly_deductions
            WHERE deduction_month = DATE_FORMAT(CURDATE(), '%Y-%m-01')
        `);

        res.json({
            success: true,
            data: {
                total_active_members: totalMembers[0].count,
                total_fund_balance: parseFloat(totalBalance[0].total || 0),
                pending_verifications: pendingVerifications[0].count,
                pending_cec_approvals: pendingApprovals[0].count,
                pending_withdrawals: pendingWithdrawals[0].count,
                current_month: {
                    contributing_members: currentMonth[0].members || 0,
                    total_amount: parseFloat(currentMonth[0].amount || 0)
                }
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve dashboard statistics'
        });
    }
});

module.exports = router;
