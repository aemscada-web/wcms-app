// controllers/deductionController.js
const { pool } = require('../config/database');
const XLSX = require('xlsx');

// Get deductions with filters
exports.getDeductions = async (req, res) => {
    try {
        const { month, status, committee_id } = req.query;
        
        let query = `
            SELECT md.*, m.member_code, m.full_name, 
                   c.committee_name, c.committee_type,
                   u.full_name as entered_by_name,
                   v.full_name as verified_by_name
            FROM monthly_deductions md
            JOIN members m ON md.member_id = m.member_id
            JOIN committees c ON md.committee_id = c.committee_id
            JOIN users u ON md.entered_by = u.user_id
            LEFT JOIN users v ON md.verified_by = v.user_id
            WHERE 1=1
        `;
        const params = [];

        // Role-based filtering
        if (req.user.role === 'DEC_USER' || req.user.role === 'REC_USER') {
            query += ' AND md.committee_id = ?';
            params.push(req.user.committee_id);
        } else if (req.user.role === 'ZEC_USER' || req.user.role === 'ZEC_VERIFIER') {
            // ZEC can see their own and child committees
            query += ` AND (md.committee_id = ? OR c.parent_committee_id = ?)`;
            params.push(req.user.committee_id, req.user.committee_id);
        }

        if (month) {
            query += ' AND md.deduction_month = ?';
            params.push(month);
        }

        if (status) {
            query += ' AND md.status = ?';
            params.push(status);
        }

        if (committee_id) {
            query += ' AND md.committee_id = ?';
            params.push(committee_id);
        }

        query += ' ORDER BY md.deduction_month DESC, md.created_at DESC';

        const [deductions] = await pool.query(query, params);

        res.json({
            success: true,
            count: deductions.length,
            data: deductions
        });
    } catch (error) {
        console.error('Get deductions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve deductions'
        });
    }
};

// Create deduction entry
exports.createDeduction = async (req, res) => {
    try {
        const { member_id, deduction_month, deduction_amount, remarks } = req.body;

        // Validate required fields
        if (!member_id || !deduction_month || !deduction_amount) {
            return res.status(400).json({
                success: false,
                message: 'Member, month, and amount are required'
            });
        }

        // Check if deduction already exists for this member and month
        const [existing] = await pool.query(
            'SELECT deduction_id FROM monthly_deductions WHERE member_id = ? AND deduction_month = ?',
            [member_id, deduction_month]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Deduction already exists for this member and month'
            });
        }

        // Get member's committee
        const [members] = await pool.query(
            'SELECT committee_id FROM members WHERE member_id = ?',
            [member_id]
        );

        if (members.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        const [result] = await pool.query(`
            INSERT INTO monthly_deductions 
            (member_id, committee_id, deduction_month, deduction_amount, entry_type, entered_by, status, remarks)
            VALUES (?, ?, ?, ?, 'Manual', ?, 'Entered', ?)
        `, [member_id, members[0].committee_id, deduction_month, deduction_amount, req.user.user_id, remarks]);

        res.status(201).json({
            success: true,
            message: 'Deduction entry created successfully',
            data: {
                deduction_id: result.insertId
            }
        });
    } catch (error) {
        console.error('Create deduction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create deduction entry'
        });
    }
};

// Verify deductions (ZEC)
exports.verifyDeductions = async (req, res) => {
    try {
        const { deduction_ids } = req.body;

        if (!Array.isArray(deduction_ids) || deduction_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Deduction IDs array is required'
            });
        }

        // Update status to Verified
        const [result] = await pool.query(`
            UPDATE monthly_deductions 
            SET status = 'Verified', 
                verified_by = ?,
                verification_date = NOW()
            WHERE deduction_id IN (?) 
            AND status = 'Entered'
        `, [req.user.user_id, deduction_ids]);

        res.json({
            success: true,
            message: `${result.affectedRows} deductions verified successfully`,
            data: {
                verified_count: result.affectedRows
            }
        });
    } catch (error) {
        console.error('Verify deductions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify deductions'
        });
    }
};

// Forward deductions to CEC
exports.forwardToCEC = async (req, res) => {
    try {
        const { deduction_month, committee_id } = req.body;

        if (!deduction_month) {
            return res.status(400).json({
                success: false,
                message: 'Deduction month is required'
            });
        }

        let query = `
            UPDATE monthly_deductions 
            SET status = 'Forwarded',
                forwarded_to_cec = TRUE,
                forwarded_date = NOW()
            WHERE deduction_month = ?
            AND status = 'Verified'
        `;
        const params = [deduction_month];

        if (committee_id) {
            query += ' AND committee_id = ?';
            params.push(committee_id);
        } else if (req.user.role.startsWith('ZEC_')) {
            query += ' AND committee_id = ?';
            params.push(req.user.committee_id);
        }

        const [result] = await pool.query(query, params);

        res.json({
            success: true,
            message: `${result.affectedRows} deductions forwarded to CEC`,
            data: {
                forwarded_count: result.affectedRows
            }
        });
    } catch (error) {
        console.error('Forward to CEC error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to forward deductions'
        });
    }
};

// Approve deductions (CEC)
exports.approveDeductions = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const { deduction_month, committee_id, actual_collection } = req.body;

        if (!deduction_month) {
            return res.status(400).json({
                success: false,
                message: 'Deduction month is required'
            });
        }

        await connection.beginTransaction();

        // Get total deductions
        const [summary] = await connection.query(`
            SELECT 
                COUNT(DISTINCT member_id) as total_members,
                SUM(deduction_amount) as total_deductions
            FROM monthly_deductions
            WHERE deduction_month = ?
            AND committee_id = ?
            AND status = 'Forwarded'
        `, [deduction_month, committee_id]);

        if (summary[0].total_members === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'No deductions found to approve'
            });
        }

        const totalDeductions = parseFloat(summary[0].total_deductions);
        const actualCollection = actual_collection ? parseFloat(actual_collection) : totalDeductions;
        const variance = actualCollection - totalDeductions;

        // Call stored procedure to approve deductions
        await connection.query(
            'CALL sp_approve_deductions(?, ?, ?)',
            [deduction_month, committee_id, req.user.user_id]
        );

        // Update approval record with actual collection
        await connection.query(`
            UPDATE deduction_approvals
            SET actual_collection = ?,
                variance = ?,
                status = ?
            WHERE deduction_month = ?
            AND committee_id = ?
        `, [
            actualCollection,
            variance,
            variance === 0 ? 'Matched' : 'Variance_Noted',
            deduction_month,
            committee_id
        ]);

        await connection.commit();

        res.json({
            success: true,
            message: 'Deductions approved successfully',
            data: {
                total_members: summary[0].total_members,
                total_deductions: totalDeductions,
                actual_collection: actualCollection,
                variance: variance
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Approve deductions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve deductions'
        });
    } finally {
        connection.release();
    }
};

// Bulk import deductions from Excel
exports.bulkImportDeductions = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        const inserted = [];
        const errors = [];

        for (const row of data) {
            try {
                // Validate required fields
                if (!row.member_code || !row.deduction_month || !row.deduction_amount) {
                    errors.push({
                        row: row,
                        error: 'Missing required fields'
                    });
                    continue;
                }

                // Get member ID from member code
                const [members] = await pool.query(
                    'SELECT member_id, committee_id FROM members WHERE member_code = ?',
                    [row.member_code]
                );

                if (members.length === 0) {
                    errors.push({
                        row: row,
                        error: 'Member not found'
                    });
                    continue;
                }

                const member = members[0];

                // Check if deduction already exists
                const [existing] = await pool.query(
                    'SELECT deduction_id FROM monthly_deductions WHERE member_id = ? AND deduction_month = ?',
                    [member.member_id, row.deduction_month]
                );

                if (existing.length > 0) {
                    errors.push({
                        row: row,
                        error: 'Deduction already exists'
                    });
                    continue;
                }

                await pool.query(`
                    INSERT INTO monthly_deductions 
                    (member_id, committee_id, deduction_month, deduction_amount, entry_type, entered_by, status)
                    VALUES (?, ?, ?, ?, 'Excel_Upload', ?, 'Entered')
                `, [
                    member.member_id,
                    member.committee_id,
                    row.deduction_month,
                    row.deduction_amount,
                    req.user.user_id
                ]);

                inserted.push(row.member_code);
            } catch (error) {
                errors.push({
                    row: row,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `Imported ${inserted.length} deductions`,
            data: {
                inserted: inserted.length,
                errors: errors.length,
                errorDetails: errors
            }
        });
    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to import deductions'
        });
    }
};

// Get monthly summary
exports.getMonthlySummary = async (req, res) => {
    try {
        const { month } = req.query;

        if (!month) {
            return res.status(400).json({
                success: false,
                message: 'Month parameter is required'
            });
        }

        const [summary] = await pool.query(`
            SELECT 
                c.committee_name,
                c.committee_type,
                COUNT(DISTINCT md.member_id) as total_members,
                SUM(md.deduction_amount) as total_amount,
                md.status,
                COUNT(md.deduction_id) as deduction_count
            FROM monthly_deductions md
            JOIN committees c ON md.committee_id = c.committee_id
            WHERE md.deduction_month = ?
            GROUP BY md.committee_id, md.status
            ORDER BY c.committee_type, c.committee_name
        `, [month]);

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Get monthly summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve monthly summary'
        });
    }
};
